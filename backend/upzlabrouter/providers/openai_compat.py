"""Provedores com API compatível com OpenAI (OpenRouter, Hugging Face)."""
import time
from typing import Any

import requests

from upzlabrouter.core.exceptions import RouterProviderError, RouterRateLimitError
from upzlabrouter.providers.base import BaseProvider, ChatRequest, ChatResponse

TIMEOUT_SECONDS = 90


class OpenAICompatProvider(BaseProvider):
    chat_url: str = ""
    extra_headers: dict[str, str] = {}

    def chat(self, request: ChatRequest, api_key: str) -> ChatResponse:
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": [{"role": m.role, "content": m.content} for m in request.messages],
            "temperature": request.temperature,
            "stream": False,
        }
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", **self.extra_headers}
        started_at = time.monotonic()
        try:
            response = requests.post(self.chat_url, json=payload, headers=headers, timeout=TIMEOUT_SECONDS)
        except requests.exceptions.Timeout as exc:
            raise RouterProviderError(self.provider_id, "Tempo limite excedido.") from exc
        except requests.exceptions.RequestException as exc:
            raise RouterProviderError(self.provider_id, "Não foi possível conectar.") from exc

        latency_ms = int((time.monotonic() - started_at) * 1000)
        if response.status_code == 429:
            raise RouterRateLimitError(self.provider_id, retry_after=60)
        if response.status_code not in (200, 201):
            raise RouterProviderError(self.provider_id, f"HTTP {response.status_code}: {response.text[:160]}")

        try:
            body = response.json()
        except ValueError as exc:
            raise RouterProviderError(self.provider_id, "Resposta JSON inválida.") from exc

        choices = body.get("choices") if isinstance(body, dict) else None
        message = choices[0].get("message") if isinstance(choices, list) and choices and isinstance(choices[0], dict) else None
        content = message.get("content") if isinstance(message, dict) else None
        if not isinstance(content, str) or not content.strip():
            raise RouterProviderError(self.provider_id, "A resposta não contém texto.")

        usage = body.get("usage") if isinstance(body.get("usage"), dict) else {}
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        return ChatResponse(
            content=content,
            model=body.get("model", request.model),
            provider=self.provider_id,
            prompt_tokens=prompt_tokens if isinstance(prompt_tokens, int) and prompt_tokens >= 0 else 0,
            completion_tokens=completion_tokens if isinstance(completion_tokens, int) and completion_tokens >= 0 else 0,
            latency_ms=latency_ms,
            raw=body,
        )

    def is_available(self, api_key: str) -> bool:
        return bool(api_key)


class OpenRouterProvider(OpenAICompatProvider):
    provider_id = "openrouter"
    chat_url = "https://openrouter.ai/api/v1/chat/completions"
    extra_headers = {"HTTP-Referer": "https://upzlab.com", "X-Title": "UpzLabRouter"}


class HuggingFaceProvider(OpenAICompatProvider):
    provider_id = "huggingface"
    chat_url = "https://router.huggingface.co/v1/chat/completions"


class GroqProvider(OpenAICompatProvider):
    provider_id = "groq"
    chat_url = "https://api.groq.com/openai/v1/chat/completions"
