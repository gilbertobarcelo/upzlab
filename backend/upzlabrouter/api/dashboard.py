"""Endpoints de catálogo gratuito e playground autenticado do UpzLabRouter."""
from datetime import datetime, timedelta, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, StrictStr
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from database.database import get_db
from app.core.security import get_user_id_optional
from upzlabrouter.providers.base import ChatMessage, ChatRequest
from upzlabrouter.services.novita_catalog import fetch_novita_models
from upzlabrouter.services.free_catalog import fetch_free_groq_models, fetch_free_openrouter_models
from upzlabrouter.models.router_models import RouterUsageLog
from upzlabrouter.services.router import route

router = APIRouter(prefix="/dashboard", tags=["UpzLabRouter Dashboard"])


def _require_session_user(request: Request) -> int:
    user_id = get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Entre na sua conta UpzLab para acessar o Router.")
    try:
        return int(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="A sessão UpzLab é inválida.") from exc


class PlaygroundMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["system", "user", "assistant"]
    content: StrictStr = Field(min_length=1, max_length=20_000)


class PlaygroundRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    model: str = Field(min_length=1, max_length=200)
    messages: list[PlaygroundMessage] = Field(min_length=1, max_length=30)
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=1024, gt=0, le=8192)


@router.get("/models")
def list_free_models(request: Request):
    _require_session_user(request)
    catalog = fetch_novita_models()
    models = [model for model in catalog if model["is_free"]]
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
    return {
        "provider": "UpzLabRouter",
        "free_only": True,
        "catalog_count": len(catalog),
        "free_count": len(models),
        "data": models,
    }


@router.post("/chat/completions")
def playground_chat(
    payload: PlaygroundRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    dev_id = _require_session_user(request)
    external = {
        f"groq/{m}" for m in fetch_free_groq_models()
    } | {f"openrouter/{m}" for m in fetch_free_openrouter_models()}
    if payload.model in external:
        model, routed_model = {"id": payload.model}, payload.model
    else:
        model = next(
            (item for item in fetch_novita_models() if item["id"] == payload.model and item["is_free"]),
            None,
        )
        routed_model = f"novita/{payload.model}"
    if model is None:
        raise HTTPException(status_code=403, detail="Este modelo não está confirmado como gratuito. Nenhuma chamada foi enviada.")

    chat_request = ChatRequest(
        model=routed_model,
        messages=[ChatMessage(role=message.role, content=message.content) for message in payload.messages],
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        stream=False,
    )
    response, _ = route(chat_request, dev_id, None, db)

    return {
        "id": f"chatcmpl-upzlab-{uuid4().hex}",
        "object": "chat.completion",
        "created": int(datetime.now(timezone.utc).timestamp()),
        "model": payload.model,
        "upzpoints_charged": 0,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": response.content},
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": response.prompt_tokens,
            "completion_tokens": response.completion_tokens,
            "total_tokens": response.prompt_tokens + response.completion_tokens,
        },
    }


@router.get("/usage")
def usage_stats(request: Request, days: int = 14, db: Session = Depends(get_db)):
    """Uso do Router pelo usuário logado: série diária, provedores e modelos."""
    dev_id = _require_session_user(request)
    days = max(1, min(days, 90))
    since = datetime.now(timezone.utc) - timedelta(days=days - 1)
    since = since.replace(hour=0, minute=0, second=0, microsecond=0)
    base = db.query(RouterUsageLog).filter(RouterUsageLog.dev_id == dev_id, RouterUsageLog.created_at >= since)

    day = func.date(RouterUsageLog.created_at)
    tokens = func.coalesce(RouterUsageLog.prompt_tokens, 0) + func.coalesce(RouterUsageLog.completion_tokens, 0)
    errors = func.sum(case((RouterUsageLog.status != "success", 1), else_=0))
    daily_rows = (
        db.query(day, func.count(), func.sum(tokens), errors, func.avg(RouterUsageLog.latency_ms))
        .filter(RouterUsageLog.dev_id == dev_id, RouterUsageLog.created_at >= since)
        .group_by(day).all()
    )
    by_day = {str(d): (c, int(t or 0), int(e or 0), float(l or 0)) for d, c, t, e, l in daily_rows}
    series = []
    for i in range(days):
        d = (since + timedelta(days=i)).date().isoformat()
        c, t, e, l = by_day.get(d, (0, 0, 0, 0))
        series.append({"date": d, "requests": c, "tokens": t, "errors": e, "latency_ms": round(l)})

    route_prefixes = ("groq/", "cohere/", "apodex/", "openrouter/", "novita/", "huggingface/")

    def public_name(name):
        name = name or ""
        for prefix in route_prefixes:
            if name.lower().startswith(prefix):
                name = name[len(prefix):]
                break
        return name

    def grouped(col):
        rows = (
            db.query(col, func.count(), func.sum(tokens))
            .filter(RouterUsageLog.dev_id == dev_id, RouterUsageLog.created_at >= since)
            .group_by(col).order_by(func.count().desc()).limit(8).all()
        )
        merged = {}
        for n, c, t in rows:
            m = merged.setdefault(public_name(n).lower(), {"name": public_name(n), "requests": 0, "tokens": 0})
            m["requests"] += c
            m["tokens"] += int(t or 0)
        return sorted(merged.values(), key=lambda x: -x["requests"])

    total = sum(x["requests"] for x in series)
    total_errors = sum(x["errors"] for x in series)
    avg_latency = base.with_entities(func.avg(RouterUsageLog.latency_ms)).scalar() or 0
    return {
        "success": True,
        "days": days,
        "totals": {
            "requests": total,
            "tokens": sum(x["tokens"] for x in series),
            "errors": total_errors,
            "success_rate": round((total - total_errors) * 100 / total, 1) if total else None,
            "avg_latency_ms": round(float(avg_latency)),
        },
        "series": series,
        "models": grouped(RouterUsageLog.model_real),
    }
