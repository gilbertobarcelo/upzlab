"""
Provedor Apodex — Apodex 1.1 Mini.
A API do Apodex é OpenAI-compatível: POST /v1/chat/completions.
Documentação: https://www.apodex.com/
"""
import time
import requests
from upzlabrouter.providers.base import BaseProvider, ChatRequest, ChatResponse
from upzlabrouter.core.exceptions import RouterProviderError, RouterRateLimitError

APODEX_CHAT_URL = "https://api.apodex.com/v1/chat/completions"
TIMEOUT = 90  # modelo de raciocínio pode ser mais lento


class ApodexProvider(BaseProvider):
    provider_id = "apodex"

    def chat(self, request: ChatRequest, api_key: str) -> ChatResponse:
        # Formato OpenAI-compatível
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        payload: dict = {
            "model": request.model,
            "messages": messages,
            "temperature": request.temperature,
        }
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        t0 = time.time()
        try:
            res = requests.post(APODEX_CHAT_URL, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.exceptions.Timeout:
            raise RouterProviderError("apodex", "Timeout após 90s")
        except requests.exceptions.RequestException as e:
            raise RouterProviderError("apodex", str(e))

        latency_ms = int((time.time() - t0) * 1000)

        if res.status_code == 429:
            raise RouterRateLimitError("apodex", retry_after=60)
        if res.status_code not in (200, 201):
            raise RouterProviderError("apodex", f"HTTP {res.status_code}: {res.text[:200]}")

        try:
            body = res.json()
        except ValueError as exc:
            raise RouterProviderError("apodex", "Resposta JSON inválida do provedor.") from exc

        choices = body.get("choices") if isinstance(body, dict) else None
        if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
            raise RouterProviderError("apodex", "Resposta sem choices válidos.")
        message = choices[0].get("message")
        if not isinstance(message, dict) or not isinstance(message.get("content"), str):
            raise RouterProviderError("apodex", "Resposta sem conteúdo de mensagem válido.")
        content = message["content"]
        usage = body.get("usage", {})
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
        try:
            res = requests.post(
                APODEX_CHAT_URL,
                json={"model": "apodex-1.1-mini", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 1},
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                timeout=10,
            )
            return res.status_code in (200, 201)
        except requests.exceptions.RequestException:
            return False
