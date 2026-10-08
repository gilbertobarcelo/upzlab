"""
POST /v1/chat/completions — endpoint principal do UpzLabRouter.
100% compatível com o formato OpenAI — troca a base_url e a api_key, funciona.
"""
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database.database import get_db
from upzlabrouter.core.exceptions import RouterAuthError, RouterModelNotFound
from upzlabrouter.models.router_models import RouterApiKey
from upzlabrouter.providers.base import ChatRequest, ChatMessage
from upzlabrouter.services.router import route

router = APIRouter(tags=["UpzLabRouter Chat"])


# ── Schemas OpenAI-compatíveis ─────────────────────────────────────────────────

class MessageInput(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = "auto"
    messages: list[MessageInput]
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    stream: bool = False


def _authenticate(request: Request, db: Session) -> tuple[int, int | None]:
    """
    Lê a UPZLAB_KEY do header Authorization: Bearer <key>.
    Retorna (dev_id, api_key_id).
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise RouterAuthError("Header Authorization ausente ou malformado.")

    raw_key  = auth.split(" ", 1)[1].strip()
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    key_record = db.query(RouterApiKey).filter(
        RouterApiKey.key_hash == key_hash,
        RouterApiKey.is_active == True
    ).first()

    if not key_record:
        raise RouterAuthError("UPZLAB_KEY inválida ou revogada.")

    # Atualiza last_used_at
    key_record.last_used_at = datetime.now(timezone.utc)
    db.commit()

    return key_record.dev_id, key_record.id


@router.post("/v1/chat/completions")
def chat_completions(
    payload: ChatCompletionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Endpoint principal do UpzLabRouter.
    Compatível com OpenAI SDK — basta trocar:
        client = OpenAI(base_url="http://localhost:8001/api/upzlabrouter", api_key="upzlk_...")
    """
    dev_id, api_key_id = _authenticate(request, db)

    chat_request = ChatRequest(
        model=payload.model,
        messages=[ChatMessage(role=m.role, content=m.content) for m in payload.messages],
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        stream=payload.stream,
    )

    response, pts_charged = route(chat_request, dev_id, api_key_id, db)

    # Resposta no formato OpenAI
    return {
        "id": f"upzlk-{response.provider}-{int(datetime.now().timestamp())}",
        "object": "chat.completion",
        "model": response.model,
        "provider": response.provider,
        "upzpoints_charged": pts_charged,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": response.content},
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": response.prompt_tokens,
            "completion_tokens": response.completion_tokens,
            "total_tokens": response.prompt_tokens + response.completion_tokens,
        },
    }
