"""Endpoints de catálogo gratuito e playground autenticado do UpzLabRouter."""
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, StrictStr
from sqlalchemy.orm import Session

from database.database import get_db
from app.core.security import get_user_id_optional
from upzlabrouter.providers.base import ChatMessage, ChatRequest
from upzlabrouter.services.novita_catalog import fetch_novita_models
from upzlabrouter.services.router import route

router = APIRouter(prefix="/dashboard", tags=["UpzLabRouter Dashboard"])


def _require_session_user(request: Request) -> int:
    user_id = get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Entre na sua conta UpzLab para acessar o Router.")
    try:
        return int(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="A sessão UpzLab é inválida.") from exc


class PlaygroundMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["system", "user", "assistant"]
    content: StrictStr = Field(min_length=1, max_length=20_000)


class PlaygroundRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    model: str = Field(min_length=1, max_length=200)
    messages: list[PlaygroundMessage] = Field(min_length=1, max_length=30)
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=1024, gt=0, le=8192)


@router.get("/models")
def list_free_models(request: Request):
    _require_session_user(request)
    catalog = fetch_novita_models()
    models = [model for model in catalog if model["is_free"]]
    models.sort(key=lambda model: (model["category"], model["name"].lower(), model["id"]))
    return {
        "provider": "Novita",
        "free_only": True,
        "catalog_count": len(catalog),
        "free_count": len(models),
        "data": models,
    }


@router.post("/chat/completions")
def playground_chat(
    payload: PlaygroundRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    dev_id = _require_session_user(request)
    model = next(
        (item for item in fetch_novita_models() if item["id"] == payload.model and item["is_free"]),
        None,
    )
    if model is None:
        raise HTTPException(status_code=403, detail="Este modelo não está confirmado como gratuito. Nenhuma chamada foi enviada.")

    chat_request = ChatRequest(
        model=f"novita/{payload.model}",
        messages=[ChatMessage(role=message.role, content=message.content) for message in payload.messages],
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        stream=False,
    )
    response, _ = route(chat_request, dev_id, None, db)

    return {
        "id": f"chatcmpl-upzlab-{uuid4().hex}",
        "object": "chat.completion",
        "created": int(datetime.now(timezone.utc).timestamp()),
        "model": response.model,
        "provider": response.provider,
        "upzpoints_charged": 0,
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
