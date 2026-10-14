"""
Lógica central do UpzLabRouter.
Resolve modelo → provedor → executa → fallback automático.
"""
import time
from sqlalchemy.orm import Session

from upzlabrouter.core.config import MODEL_CATALOG, PROVIDER_KEYS, FALLBACK_ORDER
from upzlabrouter.core.exceptions import RouterModelNotFound, RouterProviderError, RouterRateLimitError
from upzlabrouter.providers.base import ChatRequest, ChatResponse
from upzlabrouter.providers.cohere import CohereProvider
from upzlabrouter.providers.apodex import ApodexProvider
from upzlabrouter.providers.novita import NovitaProvider
from upzlabrouter.providers.openai_compat import OpenRouterProvider, HuggingFaceProvider, GroqProvider
from upzlabrouter.services.quota import can_use, increment
from upzlabrouter.models.router_models import RouterUsageLog
from upzlabrouter.services.novita_catalog import fetch_free_novita_model

# Registro de provedores disponíveis
_PROVIDERS = {
    "cohere": CohereProvider(),
    "apodex": ApodexProvider(),
    "novita": NovitaProvider(),
    "openrouter": OpenRouterProvider(),
    "huggingface": HuggingFaceProvider(),
    "groq": GroqProvider(),
}

# Prefixos para escolher qualquer modelo do provedor: "openrouter/<id>" ou "hf/<id>"
_DYNAMIC_PREFIXES = {"openrouter/": "openrouter", "hf/": "huggingface", "groq/": "groq"}


def _resolve_model(model_alias: str) -> list[dict]:
    """
    Retorna lista de (spec_dict) a tentar, em ordem.
    Para "auto" retorna todos os provedores free em ordem de fallback.
    """
    if model_alias == "auto":
        specs = []
        for provider_id in FALLBACK_ORDER:
            for alias, spec in MODEL_CATALOG.items():
                if spec["provider"] == provider_id and spec["tier"] == "free":
                    specs.append({**spec, "alias": alias})
                    break
        return specs

    for prefix, provider_id in _DYNAMIC_PREFIXES.items():
        if model_alias.startswith(prefix):
            if provider_id == "openrouter" and not model_alias.endswith(":free"):
                raise RouterModelNotFound(model_alias)
            return [{
                "provider": provider_id,
                "model": model_alias.removeprefix(prefix),
                "tier": "free",
                "pts_per_1k": 0,
                "description": "",
                "context_window": 0,
                "alias": model_alias,
            }]

    if model_alias.startswith("novita/"):
        model_id = model_alias.removeprefix("novita/")
        model = fetch_free_novita_model(model_id)
        if model is None:
            raise RouterModelNotFound(model_alias)
        return [{
            "provider": "novita",
            "model": model_id,
            "tier": "free",
            "pts_per_1k": 0,
            "description": model["description"],
            "context_window": model["context_window"],
            "alias": model_alias,
        }]

    spec = MODEL_CATALOG.get(model_alias)
    if not spec:
        raise RouterModelNotFound(model_alias)
    return [{**spec, "alias": model_alias}]


def route(request: ChatRequest, dev_id: int, api_key_id: int | None, db: Session) -> tuple[ChatResponse, int]:
    """
    Roteia a requisição para o melhor provedor disponível.
    Retorna (ChatResponse, upzpoints_charged).
    Faz fallback automático em caso de 429 ou erro de provedor.
    """
    specs = _resolve_model(request.model)
    if request.model != "auto":
        # Se o modelo pedido falhar, o roteador tenta os outros provedores
        tried = {spec["provider"] for spec in specs}
        specs += [spec for spec in _resolve_model("auto") if spec["provider"] not in tried]
    last_error = None

    for spec in specs:
        provider_id = spec["provider"]
        model_real  = spec["model"]
        alias       = spec["alias"]

        # Verifica cota diária
        if not can_use(provider_id, db):
            last_error = f"Cota diária do provedor {provider_id} esgotada."
            continue

        provider = _PROVIDERS.get(provider_id)
        if not provider:
            last_error = f"Provedor {provider_id} não implementado."
            continue

        api_key = PROVIDER_KEYS.get(provider_id, "")
        if not api_key:
            last_error = f"Chave do provedor {provider_id} não configurada."
            continue

        # Ajusta o model no request para o nome real do provedor
        real_request = ChatRequest(
            model=model_real,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=request.stream,
        )

        try:
            response = provider.chat(real_request, api_key)
            increment(provider_id, db)

            # Billing (0 pts para modelos free)
            from upzlabrouter.services.billing import check_and_debit
            total_tokens = response.prompt_tokens + response.completion_tokens
            pts_charged  = check_and_debit(dev_id, alias, total_tokens, db)

            # Log
            _log(db, dev_id, api_key_id, provider_id, alias, model_real, response, pts_charged, "success")

            return response, pts_charged

        except RouterRateLimitError:
            last_error = f"Rate limit no provedor {provider_id}."
            _log_error(db, dev_id, api_key_id, provider_id, alias, model_real, "rate_limited", last_error)
            continue  # tenta próximo

        except RouterProviderError as e:
            last_error = str(e.detail)
            _log_error(db, dev_id, api_key_id, provider_id, alias, model_real, "error", last_error)
            continue  # tenta próximo

    # Todos falharam
    raise RouterProviderError("all", last_error or "Todos os provedores falharam.")


def _log(db, dev_id, api_key_id, provider, alias, model_real, response: ChatResponse, pts, status):
    db.add(RouterUsageLog(
        dev_id=dev_id,
        api_key_id=api_key_id,
        provider=provider,
        model_alias=alias,
        model_real=model_real,
        prompt_tokens=response.prompt_tokens,
        completion_tokens=response.completion_tokens,
        upzpoints_charged=pts,
        latency_ms=response.latency_ms,
        status=status,
    ))
    db.commit()


def _log_error(db, dev_id, api_key_id, provider, alias, model_real, status, detail):
    db.add(RouterUsageLog(
        dev_id=dev_id,
        api_key_id=api_key_id,
        provider=provider,
        model_alias=alias,
        model_real=model_real,
        status=status,
        error_detail=str(detail)[:500],
    ))
    db.commit()
