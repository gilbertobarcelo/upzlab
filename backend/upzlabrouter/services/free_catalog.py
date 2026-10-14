"""Catálogos dinâmicos de modelos gratuitos (Groq e OpenRouter) com cache curto."""
import logging
import time

import requests

from upzlabrouter.core.config import PROVIDER_KEYS

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 600
_NON_TEXT_TERMS = ("whisper", "orpheus", "guard", "safeguard", "tts", "embed", "content-safety")
_cache: dict[str, tuple[float, list[str]]] = {}


def _cached(name: str, loader) -> list[str]:
    hit = _cache.get(name)
    if hit and time.monotonic() - hit[0] < CACHE_TTL_SECONDS:
        return hit[1]
    try:
        ids = loader()
    except Exception as exc:
        logger.warning("Falha ao listar modelos de %s: %s", name, exc.__class__.__name__)
        ids = hit[1] if hit else []
    _cache[name] = (time.monotonic(), ids)
    return ids


def _is_text(model_id: str) -> bool:
    return not any(term in model_id.lower() for term in _NON_TEXT_TERMS)


def fetch_free_groq_models() -> list[str]:
    key = PROVIDER_KEYS.get("groq", "").strip()
    if not key:
        return []

    def load() -> list[str]:
        r = requests.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"}, timeout=15)
        r.raise_for_status()
        return sorted(m["id"] for m in r.json().get("data", []) if m.get("active", True) and _is_text(m["id"]))

    return _cached("groq", load)


def fetch_free_openrouter_models() -> list[str]:
    def load() -> list[str]:
        r = requests.get("https://openrouter.ai/api/v1/models", timeout=15)
        r.raise_for_status()
        return sorted(m["id"] for m in r.json().get("data", []) if m["id"].endswith(":free") and _is_text(m["id"]))

    return _cached("openrouter", load)
