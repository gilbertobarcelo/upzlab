"""
Classe base para todos os provedores do UpzLabRouter.
Cada provedor implementa esta interface — o roteador não conhece detalhes de HTTP.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ChatMessage:
    role: str      # "system" | "user" | "assistant"
    content: str


@dataclass
class ChatRequest:
    model: str
    messages: list[ChatMessage]
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    stream: bool = False


@dataclass
class ChatResponse:
    content: str
    model: str
    provider: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: int = 0
    raw: dict = field(default_factory=dict)


class BaseProvider(ABC):
    """Interface que todo provedor deve implementar."""

    provider_id: str = ""  # "cohere" | "apodex" | ...

    @abstractmethod
    def chat(self, request: ChatRequest, api_key: str) -> ChatResponse:
        """Faz a chamada ao provedor e retorna ChatResponse padronizado."""
        ...

    @abstractmethod
    def is_available(self, api_key: str) -> bool:
        """Retorna True se o provedor está acessível (healthcheck rápido)."""
        ...
