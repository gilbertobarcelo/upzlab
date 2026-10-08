"""Exceções padronizadas do UpzLabRouter."""
from fastapi import HTTPException


class RouterAuthError(HTTPException):
    def __init__(self, detail: str = "UPZLAB_KEY inválida ou ausente."):
        super().__init__(status_code=401, detail=detail)


class RouterQuotaError(HTTPException):
    def __init__(self, detail: str = "Sem UpzPoints suficientes para este modelo."):
        super().__init__(status_code=402, detail=detail)


class RouterRateLimitError(HTTPException):
    def __init__(self, provider: str, retry_after: int = 60):
        super().__init__(
            status_code=429,
            detail={
                "message": f"Rate limit atingido no provedor {provider}.",
                "retry_after_seconds": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )


class RouterModelNotFound(HTTPException):
    def __init__(self, model: str):
        super().__init__(status_code=404, detail=f"Modelo '{model}' não encontrado no UpzLabRouter.")


class RouterProviderError(HTTPException):
    def __init__(self, provider: str, detail: str = ""):
        super().__init__(
            status_code=502,
            detail=f"Erro no provedor {provider}: {detail}"
        )
