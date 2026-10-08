"""GET /v1/models — lista modelos disponíveis no UpzLabRouter."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database.database import get_db
from upzlabrouter.core.config import MODEL_CATALOG
from upzlabrouter.services.quota import get_all_status

router = APIRouter(tags=["UpzLabRouter Models"])


@router.get("/v1/models")
def list_models(db: Session = Depends(get_db)):
    """Retorna catálogo de modelos com disponibilidade atual."""
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
            "available": provider_status.get("is_active", True) and provider_status.get("remaining", 1) > 0,
            "remaining_today": provider_status.get("remaining"),
        })
    return {"object": "list", "data": models}
