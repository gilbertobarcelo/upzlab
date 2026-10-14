"""GET /v1/models — lista modelos disponíveis no UpzLabRouter."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database.database import get_db
from upzlabrouter.api.auth import authenticate_api_key
from upzlabrouter.core.config import MODEL_CATALOG, PROVIDER_KEYS
from upzlabrouter.services.quota import get_all_status
from upzlabrouter.services.novita_catalog import fetch_novita_models
from upzlabrouter.services.free_catalog import fetch_free_groq_models, fetch_free_openrouter_models

router = APIRouter(tags=["UpzLabRouter Models"])


@router.get("/public/models")
def list_public_free_models():
    """Public SEO-safe catalog containing only models confirmed free by Novita."""
    if not PROVIDER_KEYS.get("novita", "").strip():
        raise HTTPException(status_code=503, detail="O catálogo público de modelos está temporariamente indisponível.")

    models = [
        {
            "id": model["id"],
            "name": model["name"],
            "description": model["description"],
            "context_window": model["context_window"],
            "category": model["category"],
            "is_free": True,
        }
        for model in fetch_novita_models()
        if model["is_free"]
    ]
    for provider_id, fetcher in (("groq", fetch_free_groq_models), ("openrouter", fetch_free_openrouter_models)):
        for model_id in fetcher():
            models.append({
                "id": f"{provider_id}/{model_id}",
                "name": model_id,
                "description": "Modelo gratuito do UpzLabRouter.",
                "context_window": None,
                "category": "text",
                "is_free": True,
            })
    models.sort(key=lambda model: (model["category"], model["name"].lower(), model["id"]))
    return {"provider": "UpzLabRouter", "free_only": True, "data": models}


@router.get("/v1/models")
def list_models(request: Request, db: Session = Depends(get_db)):
    """Retorna catálogo de modelos com disponibilidade atual."""
    authenticate_api_key(request, db)
    quota_map = {s["provider"]: s for s in get_all_status(db)}
    models = []
    for alias, spec in MODEL_CATALOG.items():
        if alias == "auto":
            continue
        provider_status = quota_map.get(spec["provider"], {})
        models.append({
            "id": alias,
            "provider": spec["provider"],
            "model": spec["model"],
            "tier": spec["tier"],
            "pts_per_1k_tokens": spec["pts_per_1k"],
            "description": spec["description"],
            "context_window": spec["context_window"],
            "available": bool(PROVIDER_KEYS.get(spec["provider"]))
            and provider_status.get("is_active", True)
            and provider_status.get("remaining", 1) > 0,
            "remaining_today": provider_status.get("remaining"),
        })
    if PROVIDER_KEYS.get("novita"):
        novita_status = quota_map.get("novita", {})
        for model in fetch_novita_models():
            if not model["is_free"]:
                continue
            models.append({
                "id": f"novita/{model['id']}",
                "provider": "novita",
                "model": model["id"],
                "tier": "free",
                "pts_per_1k_tokens": 0,
                "description": model["description"],
                "context_window": model["context_window"],
                "category": model["category"],
                "available": novita_status.get("is_active", True)
                and novita_status.get("remaining", 1) > 0,
                "remaining_today": novita_status.get("remaining"),
            })
    seen = {m["id"] for m in models}
    for provider_id, fetcher in (("groq", fetch_free_groq_models), ("openrouter", fetch_free_openrouter_models)):
        status = quota_map.get(provider_id, {})
        available = bool(PROVIDER_KEYS.get(provider_id)) and status.get("is_active", True) and status.get("remaining", 1) > 0
        for model_id in fetcher():
            alias = f"{provider_id}/{model_id}"
            if alias in seen:
                continue
            models.append({
                "id": alias,
                "provider": provider_id,
                "model": model_id,
                "tier": "free",
                "pts_per_1k_tokens": 0,
                "description": "Modelo gratuito do UpzLabRouter.",
                "context_window": 0,
                "category": "text",
                "available": available,
                "remaining_today": status.get("remaining"),
            })
    return {"object": "list", "data": models}
