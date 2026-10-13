"""Provedor Novita usando a API compatível com OpenAI."""
import time
from typing import Any

import requests

from upzlabrouter.core.exceptions import RouterProviderError, RouterRateLimitError
from upzlabrouter.providers.base import BaseProvider, ChatRequest, ChatResponse

NOVITA_CHAT_URL = "https://api.novita.ai/openai/v1/chat/completions"
TIMEOUT_SECONDS = 90


class NovitaProvider(BaseProvider):
    provider_id = "novita"

    def chat(self, request: ChatRequest, api_key: str) -> ChatResponse:
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": [{"role": message.role, "content": message.content} for message in request.messages],
            "temperature": request.temperature,
            "stream": False,
        }
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        started_at = time.monotonic()
        try:
            response = requests.post(
                NOVITA_CHAT_URL,
                json=payload,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                timeout=TIMEOUT_SECONDS,
            )
        except requests.exceptions.Timeout as exc:
            raise RouterProviderError("novita", "Tempo limite excedido ao aguardar a Novita.") from exc
        except requests.exceptions.RequestException as exc:
            raise RouterProviderError("novita", "Não foi possível conectar à Novita.") from exc

        latency_ms = int((time.monotonic() - started_at) * 1000)
        if response.status_code == 429:
            raise RouterRateLimitError("novita", retry_after=60)
        if response.status_code not in (200, 201):
            raise RouterProviderError("novita", f"A API retornou HTTP {response.status_code}.")

        try:
            body = response.json()
        except ValueError as exc:
            raise RouterProviderError("novita", "A API retornou uma resposta JSON inválida.") from exc

        choices = body.get("choices") if isinstance(body, dict) else None
        if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
            raise RouterProviderError("novita", "A resposta não contém escolhas válidas.")
        message = choices[0].get("message")
        content = message.get("content") if isinstance(message, dict) else None
        if not isinstance(content, str):
            raise RouterProviderError("novita", "A resposta não contém texto compatível com chat.")

        usage = body.get("usage") if isinstance(body, dict) else {}
        if not isinstance(usage, dict):
            usage = {}
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        if not isinstance(prompt_tokens, int) or prompt_tokens < 0:
            prompt_tokens = 0
        if not isinstance(completion_tokens, int) or completion_tokens < 0:
            completion_tokens = 0

        return ChatResponse(
            content=content,
            model=body.get("model", request.model),
            provider=self.provider_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            raw=body,
        )

    def is_available(self, api_key: str) -> bool:
        return bool(api_key)
