"""
API de administração consumida pelo upzcontroll (/admin/upzlab).
Sem chave de API: consumida apenas pelo upzcontroll na rede interna.
"""
import json
import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database.database import get_db
from app.models.auto_docs_models import AutoDocApp, AutoDocFile
from app.models.config_models import UpzLabConfig
from app.models.dev_tester_models import DevProfile, UpzPointsLedger
from app.models.distribution_models import AppDistributionRelease
from app.models.beta_feedback_models import BetaFeedback, BetaUpdate
from app.models.beta_product_models import BetaProduct
from app.models.user_models import AppUser


router = APIRouter(
    prefix="/upzlab-admin",
    tags=["UpzLab Admin (upzcontroll)"],
)


class ProductBody(BaseModel):
    slug: str
    name: str
    tagline: Optional[str] = ""
    description: Optional[str] = ""
    phase: Optional[str] = "Beta Fechado"
    version: Optional[str] = "0.1.0-beta"
    platform: Optional[str] = ""
    download_url: Optional[str] = ""
    public_page_url: Optional[str] = ""
    pdf_url: Optional[str] = ""
    is_active: Optional[bool] = True


class UpdateBody(BaseModel):
    product_slug: str
    version: str = ""
    title: str
    body: str
    type: str = "update"
    requires_feedback: bool = False
    is_published: bool = True


class FeedbackStatusBody(BaseModel):
    status: str


class UserStatusBody(BaseModel):
    status: str


class GithubConfigBody(BaseModel):
    client_id: str
    client_secret: Optional[str] = ""


_SECRET_HINTS = ("secret", "token", "password", "key", "private")


def _is_secret(name: str) -> bool:
    return any(h in (name or "").lower() for h in _SECRET_HINTS)


def _mask(value, key: str = ""):
    """Mascara segredos em valores de configuração (JSON ou texto puro)."""
    if value is None:
        return None
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return "********" if _is_secret(key) else value

    def walk(node, secret=False):
        if isinstance(node, dict):
            return {k: walk(v, _is_secret(k)) for k, v in node.items()}
        if isinstance(node, list):
            return [walk(v, secret) for v in node]
        return "********" if secret and node else node

    return walk(parsed, _is_secret(key))


def _user_dict(user: AppUser, profile: Optional[DevProfile]) -> dict:
    data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "email_verified": user.email_verified,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "profile": None,
    }
    if profile:
        p = profile.to_dict()
        p["is_staff"] = profile.is_staff
        p["timezone"] = profile.timezone
        data["profile"] = p
    return data


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "success": True,
        "data": {
            "products": db.query(func.count(BetaProduct.id)).scalar() or 0,
            "active_products": db.query(func.count(BetaProduct.id)).filter(BetaProduct.is_active == True).scalar() or 0,
            "users": db.query(func.count(AppUser.id)).scalar() or 0,
            "banned_users": db.query(func.count(DevProfile.id)).filter(DevProfile.status == "BANNED").scalar() or 0,
            "total_points": db.query(func.coalesce(func.sum(DevProfile.points), 0)).scalar() or 0,
            "git_repos": db.query(func.count(AutoDocApp.id)).scalar() or 0,
            "github_linked": db.query(func.count(DevProfile.id)).filter(DevProfile.github_username.isnot(None), DevProfile.github_username != "").scalar() or 0,
            "feedbacks": db.query(func.count(BetaFeedback.id)).scalar() or 0,
            "open_feedbacks": db.query(func.count(BetaFeedback.id)).filter(BetaFeedback.status == "open").scalar() or 0,
            "updates": db.query(func.count(BetaUpdate.id)).scalar() or 0,
        },
    }


# ── Produtos ─────────────────────────────────────────────────────────────────

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    items = db.query(BetaProduct).order_by(BetaProduct.created_at.desc()).all()
    return {"success": True, "data": [i.to_dict() for i in items]}


@router.post("/products")
def create_product(data: ProductBody, db: Session = Depends(get_db)):
    if db.query(BetaProduct).filter(BetaProduct.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="Slug já cadastrado")
    p = BetaProduct(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"success": True, "data": p.to_dict()}


@router.put("/products/{product_id}")
def update_product(product_id: int, data: ProductBody, db: Session = Depends(get_db)):
    p = db.query(BetaProduct).filter(BetaProduct.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Não encontrado")
    for k, v in data.model_dump().items():
        if k == "pdf_url" and not v:
            continue
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return {"success": True, "data": p.to_dict()}


@router.post("/products/{product_id}/upload-pdf")
def upload_product_pdf(product_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    p = db.query(BetaProduct).filter(BetaProduct.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Não encontrado")
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = os.path.join(base_dir, "uploads", "beta-docs")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{p.slug}-{uuid.uuid4().hex[:8]}.pdf"
    with open(os.path.join(upload_dir, filename), "wb") as f:
        shutil.copyfileobj(file.file, f)

    p.pdf_url = f"/uploads/beta-docs/{filename}"
    db.commit()
    return {"success": True, "pdf_url": p.pdf_url}


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(BetaProduct).filter(BetaProduct.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Não encontrado")
    db.delete(p)
    db.commit()
    return {"success": True}


# ── Updates ──────────────────────────────────────────────────────────────────

@router.get("/updates")
def list_updates(product_slug: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(BetaUpdate)
    if product_slug:
        q = q.filter(BetaUpdate.product_slug == product_slug)
    return {"success": True, "data": [i.to_dict() for i in q.order_by(BetaUpdate.created_at.desc()).all()]}


@router.post("/updates")
def create_update(data: UpdateBody, db: Session = Depends(get_db)):
    u = BetaUpdate(**data.model_dump())
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"success": True, "data": u.to_dict()}


@router.delete("/updates/{update_id}")
def delete_update(update_id: int, db: Session = Depends(get_db)):
    u = db.query(BetaUpdate).filter(BetaUpdate.id == update_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Não encontrado")
    db.query(BetaFeedback).filter(BetaFeedback.update_id == update_id).update({"update_id": None})
    db.delete(u)
    db.commit()
    return {"success": True}


# ── Feedbacks ────────────────────────────────────────────────────────────────

@router.get("/feedbacks")
def list_feedbacks(product_slug: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(BetaFeedback, AppUser).outerjoin(AppUser, AppUser.id == BetaFeedback.user_id)
    if product_slug:
        q = q.join(BetaUpdate, BetaUpdate.id == BetaFeedback.update_id).filter(BetaUpdate.product_slug == product_slug)
    rows = q.order_by(BetaFeedback.created_at.desc()).all()
    return {
        "success": True,
        "data": [
            {
                **fb.to_dict(),
                "product_slug": product_slug,
                "user_name": (user.name if user else None) or fb.author_name,
                "user_email": user.email if user else None,
            }
            for fb, user in rows
        ],
    }


@router.patch("/feedbacks/{feedback_id}/status")
def update_feedback_status(feedback_id: int, body: FeedbackStatusBody, db: Session = Depends(get_db)):
    fb = db.query(BetaFeedback).filter(BetaFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Não encontrado")
    fb.status = body.status
    db.commit()
    return {"success": True}


# ── Usuários ─────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(AppUser, DevProfile).outerjoin(DevProfile, DevProfile.user_id == AppUser.id)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(AppUser.name.ilike(like), AppUser.email.ilike(like), DevProfile.username.ilike(like), DevProfile.github_username.ilike(like)))
    if status:
        q = q.filter(DevProfile.status == status.upper())
    total = q.count()
    rows = q.order_by(AppUser.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "success": True,
        "total": total,
        "page": page,
        "data": [_user_dict(u, p) for u, p in rows],
    }


@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(AppUser).filter(AppUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Não encontrado")
    profile = db.query(DevProfile).filter(DevProfile.user_id == user_id).first()
    data = _user_dict(user, profile)
    if profile:
        ledger = (
            db.query(UpzPointsLedger)
            .filter(UpzPointsLedger.dev_profile_id == profile.id)
            .order_by(UpzPointsLedger.created_at.desc())
            .limit(20)
            .all()
        )
        data["ledger"] = [e.to_dict() for e in ledger]
    return {"success": True, "data": data}


@router.patch("/users/{user_id}/status")
def update_user_status(user_id: int, body: UserStatusBody, db: Session = Depends(get_db)):
    new_status = body.status.upper()
    if new_status not in ("ACTIVE", "BANNED"):
        raise HTTPException(status_code=400, detail="Status inválido (ACTIVE | BANNED)")
    profile = db.query(DevProfile).filter(DevProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    profile.status = new_status
    db.commit()
    return {"success": True, "status": new_status}


# ── Git / GitHub ─────────────────────────────────────────────────────────────

@router.get("/git/repos")
def list_git_repos(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Repositórios enviados para a documentação automática."""
    files_count = (
        db.query(AutoDocFile.app_id, func.count(AutoDocFile.id).label("files"))
        .group_by(AutoDocFile.app_id)
        .subquery()
    )
    q = (
        db.query(AutoDocApp, DevProfile, files_count.c.files)
        .outerjoin(DevProfile, DevProfile.id == AutoDocApp.dev_id)
        .outerjoin(files_count, files_count.c.app_id == AutoDocApp.id)
    )
    if status:
        q = q.filter(AutoDocApp.status == status)
    rows = q.order_by(AutoDocApp.created_at.desc()).all()
    return {
        "success": True,
        "data": [
            {
                "id": a.id,
                "app_name": a.app_name,
                "github_url": a.github_url,
                "status": a.status,
                "doc_type": a.doc_type,
                "error_message": a.error_message,
                "beta_product_id": a.beta_product_id,
                "dev_id": a.dev_id,
                "dev_username": p.username if p else None,
                "github_username": p.github_username if p else None,
                "files_documented": files or 0,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a, p, files in rows
        ],
    }


@router.get("/git/profiles")
def list_git_profiles(db: Session = Depends(get_db)):
    """Devs com GitHub vinculado e a pontuação da análise."""
    rows = (
        db.query(DevProfile)
        .filter(DevProfile.github_username.isnot(None), DevProfile.github_username != "")
        .order_by(DevProfile.github_score.desc())
        .all()
    )
    return {
        "success": True,
        "data": [
            {
                "profile_id": p.id,
                "user_id": p.user_id,
                "username": p.username,
                "github_username": p.github_username,
                "github_account_age_days": p.github_account_age_days,
                "github_total_repos": p.github_total_repos,
                "github_score": p.github_score,
                "top_languages": p.top_languages,
            }
            for p in rows
        ],
    }


@router.get("/git/config")
def git_config(db: Session = Depends(get_db)):
    """Configuração do login GitHub (OAuth) com segredos mascarados."""
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == "github_oauth").first()
    return {
        "success": True,
        "data": {
            "configured": bool(cfg and cfg.config_value),
            "config": _mask(cfg.config_value) if cfg else None,
            "updated_at": cfg.updated_at.isoformat() if cfg and cfg.updated_at else None,
        },
    }


@router.put("/git/config")
def save_git_config(body: GithubConfigBody, db: Session = Depends(get_db)):
    """Salva Client ID/Secret do GitHub OAuth. Secret vazio mantém o atual."""
    client_id = body.client_id.strip()
    if not client_id:
        raise HTTPException(status_code=400, detail="Client ID é obrigatório")
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == "github_oauth").first()
    current = {}
    if cfg and cfg.config_value:
        try:
            current = json.loads(cfg.config_value)
        except ValueError:
            current = {}
    secret = (body.client_secret or "").strip() or current.get("client_secret", "")
    if not secret:
        raise HTTPException(status_code=400, detail="Client Secret é obrigatório na primeira configuração")
    value = json.dumps({"client_id": client_id, "client_secret": secret})
    if cfg:
        cfg.config_value = value
    else:
        db.add(UpzLabConfig(config_key="github_oauth", config_value=value, description="GitHub OAuth (login e conexão de repositórios)"))
    db.commit()
    return {"success": True}


class SmtpConfigBody(BaseModel):
    host: str
    port: int = 587
    username: Optional[str] = ""
    password: Optional[str] = ""
    sender: str
    use_tls: bool = True


class SmtpTestBody(BaseModel):
    to: str


@router.get("/smtp")
def get_smtp(db: Session = Depends(get_db)):
    """SMTP usado para e-mails da comunidade (verificação, convites, lembretes). Senha nunca é devolvida."""
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == "smtp").first()
    data = {}
    if cfg and cfg.config_value:
        try:
            data = json.loads(cfg.config_value)
        except ValueError:
            data = {}
    return {
        "success": True,
        "data": {
            "configured": bool(data.get("host") and data.get("sender")),
            "host": data.get("host", ""),
            "port": data.get("port", 587),
            "username": data.get("username", ""),
            "sender": data.get("sender", ""),
            "use_tls": data.get("use_tls", True),
            "has_password": bool(data.get("password")),
            "updated_at": cfg.updated_at.isoformat() if cfg and cfg.updated_at else None,
        },
    }


@router.put("/smtp")
def save_smtp(body: SmtpConfigBody, db: Session = Depends(get_db)):
    host = body.host.strip()
    sender = body.sender.strip()
    if not host or not sender:
        raise HTTPException(status_code=400, detail="Servidor SMTP e remetente são obrigatórios")
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == "smtp").first()
    current = {}
    if cfg and cfg.config_value:
        try:
            current = json.loads(cfg.config_value)
        except ValueError:
            current = {}
    value = json.dumps({
        "host": host,
        "port": body.port,
        "username": (body.username or "").strip(),
        "password": body.password or current.get("password", ""),
        "sender": sender,
        "use_tls": body.use_tls,
    })
    if cfg:
        cfg.config_value = value
    else:
        db.add(UpzLabConfig(config_key="smtp", config_value=value, description="SMTP da comunidade (e-mails de verificação e convites)"))
    db.commit()
    return {"success": True}


@router.delete("/smtp")
def delete_smtp(db: Session = Depends(get_db)):
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == "smtp").first()
    if cfg:
        db.delete(cfg)
        db.commit()
    return {"success": True}


@router.post("/smtp/test")
def test_smtp(body: SmtpTestBody):
    from app.services.mail_service import send_email

    try:
        send_email(body.to.strip(), "Teste SMTP - UpzLab", "Se você recebeu este e-mail, o SMTP da UpzLab está funcionando.")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Falha ao enviar: {str(exc)[:300]}")
    return {"success": True}


# ── Configurações ────────────────────────────────────────────────────────────

class ConfigValueBody(BaseModel):
    value: str


@router.put("/config/{key}")
def update_config(key: str, body: ConfigValueBody, db: Session = Depends(get_db)):
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == key).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Chave não encontrada")
    if _is_secret(key) or key in ("github_oauth", "smtp"):
        raise HTTPException(status_code=400, detail="Esta chave só pode ser editada no formulário próprio")
    cfg.config_value = body.value
    db.commit()
    return {"success": True}


@router.delete("/config/{key}")
def delete_config(key: str, db: Session = Depends(get_db)):
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == key).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Chave não encontrada")
    db.delete(cfg)
    db.commit()
    return {"success": True}


@router.get("/config")
def list_config(db: Session = Depends(get_db)):
    rows = db.query(UpzLabConfig).order_by(UpzLabConfig.config_key).all()
    return {
        "success": True,
        "data": [
            {
                "key": c.config_key,
                "value": _mask(c.config_value, c.config_key),
                "description": c.description,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in rows
        ],
    }


# ── Distribuição ─────────────────────────────────────────────────────────────

@router.get("/distribution/releases")
def list_releases(db: Session = Depends(get_db)):
    rows = db.query(AppDistributionRelease).order_by(AppDistributionRelease.version_code.desc()).all()
    return {"success": True, "data": [r.to_dict() for r in rows]}
