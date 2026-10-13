"""
POST /v1/chat/completions — endpoint principal do UpzLabRouter.
"""
from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, StrictStr
from sqlalchemy.orm import Session

from database.database import get_db
from upzlabrouter.api.auth import authenticate_api_key
from upzlabrouter.providers.base import ChatMessage, ChatRequest
from upzlabrouter.services.router import route

router = APIRouter(tags=["UpzLabRouter Chat"])


class MessageInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["system", "user", "assistant"]
    content: StrictStr = Field(min_length=1, max_length=100_000)


class ChatCompletionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    model: str = Field(default="auto", min_length=1, max_length=100)
    messages: list[MessageInput] = Field(min_length=1, max_length=100)
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=None, gt=0, le=131_072)
    stream: bool = False


@router.post("/v1/chat/completions")
def chat_completions(
    payload: ChatCompletionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Compatível com o formato chat-completions da OpenAI, sem streaming."""
    dev_id, api_key_id = authenticate_api_key(request, db)
    if payload.stream:
        raise HTTPException(
            status_code=400,
            detail="Streaming ainda não está disponível no UpzLabRouter. Envie stream=false.",
        )

    chat_request = ChatRequest(
        model=payload.model,
        messages=[ChatMessage(role=message.role, content=message.content) for message in payload.messages],
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        stream=False,
    )
    response, points_charged = route(chat_request, dev_id, api_key_id, db)
    created = int(datetime.now(timezone.utc).timestamp())

    return {
        "id": f"chatcmpl-upzlk-{uuid4().hex}",
        "object": "chat.completion",
        "created": created,
        "model": response.model,
        "provider": response.provider,
        "upzpoints_charged": points_charged,
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
