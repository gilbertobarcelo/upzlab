"""
Uso interno do UpzLabRouter pelos recursos da própria plataforma (LabsAi, DocsLab).
Sem chave de API de dev: usa o roteamento automático com fallback entre provedores.
"""
from typing import Optional

from sqlalchemy.orm import Session

from upzlabrouter.core.config import STAFF_USER_ID
from upzlabrouter.providers.base import ChatMessage, ChatRequest
from upzlabrouter.services.router import route


def router_chat(
    messages: list[dict],
    db: Session,
    model: str = "auto",
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> str:
    """Envia as mensagens pelo roteador (modelos gratuitos) e devolve só o texto."""
    request = ChatRequest(
        model=model,
        messages=[ChatMessage(role=m["role"], content=m["content"]) for m in messages],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    response, _ = route(request, STAFF_USER_ID, None, db)
    return response.content
