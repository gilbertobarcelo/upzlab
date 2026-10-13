"""
Provedor Cohere — North Mini Code.
Documentação: https://docs.cohere.com/docs/north-mini-code-1.0
A API v2 do Cohere usa endpoint /v2/chat com formato próprio (não OpenAI-compatível).
"""
import time
import requests
from upzlabrouter.providers.base import BaseProvider, ChatRequest, ChatResponse
from upzlabrouter.core.exceptions import RouterProviderError, RouterRateLimitError

COHERE_CHAT_URL = "https://api.cohere.com/v2/chat"
TIMEOUT = 60  # segundos


class CohereProvider(BaseProvider):
    provider_id = "cohere"

    def chat(self, request: ChatRequest, api_key: str) -> ChatResponse:
        # Converte mensagens para formato Cohere v2
        # Separa system prompt das mensagens de usuário
        system = None
        messages = []
        for msg in request.messages:
            if msg.role == "system":
                system = msg.content
            else:
                messages.append({"role": msg.role, "content": msg.content})

        payload: dict = {
            "model": request.model,
            "messages": messages,
            "temperature": request.temperature,
        }
        if system:
            payload["system"] = system
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        t0 = time.time()
        try:
            res = requests.post(COHERE_CHAT_URL, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.exceptions.Timeout:
            raise RouterProviderError("cohere", "Timeout após 60s")
        except requests.exceptions.RequestException as e:
            raise RouterProviderError("cohere", str(e))

        latency_ms = int((time.time() - t0) * 1000)

        if res.status_code == 429:
            raise RouterRateLimitError("cohere", retry_after=60)
        if res.status_code not in (200, 201):
            raise RouterProviderError("cohere", f"HTTP {res.status_code}: {res.text[:200]}")

        try:
            body = res.json()
        except ValueError as exc:
            raise RouterProviderError("cohere", "Resposta JSON inválida do provedor.") from exc
        if not isinstance(body, dict):
            raise RouterProviderError("cohere", "Resposta inválida do provedor.")

        # Extrai conteúdo da resposta Cohere v2
        content = ""
        message = body.get("message", {})
        if not isinstance(message, dict) or not isinstance(message.get("content", []), list):
            raise RouterProviderError("cohere", "Resposta sem conteúdo de mensagem válido.")
        for block in message.get("content", []):
            if not isinstance(block, dict):
                continue
            if block.get("type") == "text":
                text = block.get("text", "")
                if isinstance(text, str):
                    content += text

        # Tokens de uso
        usage = body.get("usage", {})
        if not isinstance(usage, dict):
            usage = {}
        billed = usage.get("billed_units", {})
        if not isinstance(billed, dict):
            billed = {}
        prompt_tokens     = billed.get("input_tokens", 0)
        completion_tokens = billed.get("output_tokens", 0)
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
                COHERE_CHAT_URL,
                json={"model": "north-mini-code-1.0", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 1},
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                timeout=10,
            )
            return res.status_code in (200, 201)
        except requests.exceptions.RequestException:
            return False
