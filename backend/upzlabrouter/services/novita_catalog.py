"""Consulta e classifica os modelos LLM da Novita sem expor credenciais."""
import logging
from typing import Any

import requests
from fastapi import HTTPException

from upzlabrouter.core.config import PROVIDER_KEYS

logger = logging.getLogger(__name__)

NOVITA_MODELS_URL = "https://api.novita.ai/openai/v1/models"
REQUEST_TIMEOUT_SECONDS = 20


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        if not isinstance(value, str) or not value.strip():
            return None
        try:
            return float(value)
        except ValueError:
            return None
    return float(value)


def classify_model(model_id: str, title: str, description: str) -> str:
    searchable = f"{model_id} {title} {description}".lower()
    if any(term in searchable for term in ("text-to-video", "image-to-video", "video generation", "video")):
        return "video"
    if any(term in searchable for term in ("text-to-speech", "speech", "audio", "whisper", "asr", "tts")):
        return "audio"
    if any(term in searchable for term in ("vision", "visual", "image", "-vl", "multimodal")):
        return "multimodal"
    if any(term in searchable for term in ("reasoning", "deepseek-r1", "qwq", "thinking", "-r1")):
        return "reasoning"
    if any(term in searchable for term in ("coder", "coding", "code")):
        return "code"
    return "text"


def fetch_novita_models() -> list[dict[str, Any]]:
    api_key = PROVIDER_KEYS.get("novita", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="UpzLabRouter ainda não está configurado com a chave da Novita.")

    try:
        response = requests.get(
            NOVITA_MODELS_URL,
            headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
    except requests.exceptions.Timeout as exc:
        logger.warning("Timeout ao consultar o catálogo da Novita.")
        raise HTTPException(status_code=503, detail="O catálogo da Novita demorou para responder. Tente novamente.") from exc
    except requests.exceptions.RequestException as exc:
        logger.warning("Falha ao consultar o catálogo da Novita: %s", exc.__class__.__name__)
        raise HTTPException(status_code=503, detail="Não foi possível consultar o catálogo da Novita.") from exc
    except ValueError as exc:
        logger.warning("A Novita retornou JSON inválido para o catálogo.")
        raise HTTPException(status_code=502, detail="A Novita retornou uma resposta inválida para o catálogo.") from exc

    entries = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(entries, list):
        raise HTTPException(status_code=502, detail="A Novita retornou um formato inesperado para o catálogo.")

    models: list[dict[str, Any]] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        model_id = entry.get("id")
        if not isinstance(model_id, str) or not model_id.strip():
            continue
        title = entry.get("title") if isinstance(entry.get("title"), str) else model_id
        description = entry.get("description") if isinstance(entry.get("description"), str) else ""
        input_price = _number(entry.get("input_token_price_per_m"))
        output_price = _number(entry.get("output_token_price_per_m"))
        if input_price is None or output_price is None:
            continue
        models.append({
            "id": model_id,
            "name": title,
            "description": description,
            "context_window": entry.get("context_size") if isinstance(entry.get("context_size"), int) else None,
            "input_price_per_m": input_price,
            "output_price_per_m": output_price,
            "is_free": input_price == 0 and output_price == 0,
            "category": classify_model(model_id, title, description),
        })

    return models


def fetch_free_novita_model(model_id: str) -> dict[str, Any] | None:
    """Refreshes vendor pricing before use so a paid model can never pass as free."""
    return next(
        (model for model in fetch_novita_models() if model["id"] == model_id and model["is_free"]),
        None,
    )
