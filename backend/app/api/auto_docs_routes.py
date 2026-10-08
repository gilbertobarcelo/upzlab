from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta

from database.database import get_db
from app.models.auto_docs_models import AutoDocApp, AutoDocFile, AutoDocGeneration
from app.ai.git_documenter import process_github_repo_task
from app.core.security import get_user_id_optional

router = APIRouter()

# ── Configurações de cota ─────────────────────────────────────────────────────
STAFF_DEV_ID   = 1          # dev_id isento de limites (UpzLab Team)
MAX_GENERATIONS = 3         # tentativas por tipo de doc por app
COOLDOWN_DAYS   = 20        # dias de cooldown após atingir o limite
ESTIMATED_SECS  = 180       # tempo médio estimado em segundos (~3 min)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_dev(request: Request) -> int:
    user_id = get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    return int(user_id)


def _get_owned_app_or_404(app_id: int, dev_id: int, db: Session) -> AutoDocApp:
    app_record = db.query(AutoDocApp).filter(AutoDocApp.id == app_id).first()
    if not app_record or app_record.dev_id != dev_id:
        raise HTTPException(status_code=404, detail="App não encontrado.")
    return app_record


def _check_quota(dev_id: int, beta_product_id: Optional[int], doc_type: str, db: Session):
    """
    Verifica cota e cooldown. Levanta 429 com detalhes se bloqueado.
    Contas staff (dev_id == STAFF_DEV_ID) são totalmente isentas.
    """
    if dev_id == STAFF_DEV_ID:
        return  # isento

    query = db.query(AutoDocGeneration).filter(
        AutoDocGeneration.dev_id == dev_id,
        AutoDocGeneration.doc_type == doc_type,
        AutoDocGeneration.status == "completed",
    )
    if beta_product_id:
        query = query.filter(AutoDocGeneration.beta_product_id == beta_product_id)

    generations = query.order_by(AutoDocGeneration.created_at.asc()).all()
    count = len(generations)

    if count < MAX_GENERATIONS:
        return  # ainda tem tentativas

    # Atingiu o limite — verifica cooldown a partir da 3ª (última permitida)
    last = generations[-1]
    now = datetime.now(timezone.utc)
    last_ts = last.created_at if last.created_at.tzinfo else last.created_at.replace(tzinfo=timezone.utc)
    unlock_at = last_ts + timedelta(days=COOLDOWN_DAYS)

    if now < unlock_at:
        days_left = (unlock_at - now).days + 1
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Limite de {MAX_GENERATIONS} gerações atingido para este tipo de doc.",
                "cooldown_days": COOLDOWN_DAYS,
                "days_left": days_left,
                "unlock_at": unlock_at.isoformat(),
            }
        )
    # Cooldown expirou — pode gerar novamente


def _record_generation(dev_id: int, beta_product_id: Optional[int], doc_type: str, status: str, db: Session):
    """Registra uma tentativa finalizada no histórico imutável."""
    db.add(AutoDocGeneration(
        dev_id=dev_id,
        beta_product_id=beta_product_id,
        doc_type=doc_type,
        status=status,
    ))
    db.commit()


def _get_quota_info(dev_id: int, beta_product_id: Optional[int], doc_type: str, db: Session) -> dict:
    """Retorna informações de cota para exibição no frontend."""
    if dev_id == STAFF_DEV_ID:
        return {"used": 0, "max": None, "is_staff": True, "blocked": False, "days_left": 0}

    count = db.query(func.count(AutoDocGeneration.id)).filter(
        AutoDocGeneration.dev_id == dev_id,
        AutoDocGeneration.doc_type == doc_type,
        AutoDocGeneration.status == "completed",
        AutoDocGeneration.beta_product_id == beta_product_id if beta_product_id else True,
    ).scalar() or 0

    blocked = count >= MAX_GENERATIONS
    days_left = 0

    if blocked:
        last = db.query(AutoDocGeneration).filter(
            AutoDocGeneration.dev_id == dev_id,
            AutoDocGeneration.doc_type == doc_type,
            AutoDocGeneration.status == "completed",
        ).order_by(AutoDocGeneration.created_at.desc()).first()
        if last:
            now = datetime.now(timezone.utc)
            last_ts = last.created_at if last.created_at.tzinfo else last.created_at.replace(tzinfo=timezone.utc)
            unlock_at = last_ts + timedelta(days=COOLDOWN_DAYS)
            if now < unlock_at:
                days_left = (unlock_at - now).days + 1
            else:
                blocked = False  # cooldown expirou

    return {
        "used": count,
        "max": MAX_GENERATIONS,
        "is_staff": False,
        "blocked": blocked,
        "days_left": days_left,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

class AutoDocRequest(BaseModel):
    app_name: str
    github_url: str
    doc_type: str = "educational"
    beta_product_id: Optional[int] = None


@router.post("/generate")
def trigger_documentation_generation(
    request: AutoDocRequest,
    http_request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Valida cota, cria/reseta o AutoDocApp e agenda a task em background."""
    dev_id = _require_dev(http_request)

    # Verifica cota antes de qualquer coisa
    _check_quota(dev_id, request.beta_product_id, request.doc_type, db)

    existing = db.query(AutoDocApp).filter(AutoDocApp.app_name == request.app_name).first()
    if existing:
        if existing.dev_id != dev_id:
            raise HTTPException(status_code=409, detail="Já existe uma documentação com esse nome de app.")
        existing.status = "pending"
        existing.github_url = request.github_url
        existing.doc_type = request.doc_type
        existing.beta_product_id = request.beta_product_id
        existing.error_message = None
        db.query(AutoDocFile).filter(AutoDocFile.app_id == existing.id).delete()
        db.commit()
        app_record = existing
    else:
        app_record = AutoDocApp(
            dev_id=dev_id,
            app_name=request.app_name,
            github_url=request.github_url,
            doc_type=request.doc_type,
            beta_product_id=request.beta_product_id,
            status="pending"
        )
        db.add(app_record)
        db.commit()
        db.refresh(app_record)

    # Agenda background task
    background_tasks.add_task(
        process_github_repo_task,
        app_record.id,
        request.github_url,
        request.doc_type,
        dev_id,
        request.beta_product_id,
    )

    return {
        "message": "Documentação iniciada em background! Você pode fechar esta tela — será notificado quando concluir.",
        "app_id": app_record.id,
        "status": app_record.status,
        "estimated_seconds": ESTIMATED_SECS,
    }


@router.get("/quota")
def get_quota(
    http_request: Request,
    doc_type: str = "educational",
    beta_product_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retorna informações de cota do dev logado para o frontend exibir."""
    dev_id = _require_dev(http_request)
    return _get_quota_info(dev_id, beta_product_id, doc_type, db)


@router.get("/status/{app_id}")
def check_status(app_id: int, http_request: Request, db: Session = Depends(get_db)):
    dev_id = _require_dev(http_request)
    app_record = _get_owned_app_or_404(app_id, dev_id, db)
    return {
        "id": app_record.id,
        "app_name": app_record.app_name,
        "status": app_record.status,
        "error_message": app_record.error_message
    }


@router.get("/{app_name}/files")
def get_app_documentation(app_name: str, http_request: Request, db: Session = Depends(get_db)):
    app_record = db.query(AutoDocApp).filter(AutoDocApp.app_name == app_name).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="App não encontrado")

    token_user = get_user_id_optional(http_request)
    dev_id = int(token_user) if token_user else None
    is_owner = dev_id is not None and app_record.dev_id == dev_id
    doc_type = app_record.doc_type or "educational"

    if doc_type == "technical":
        if not is_owner:
            raise HTTPException(status_code=401 if not token_user else 404, detail="Não autorizado.")
    else:
        if app_record.status != "published" and not is_owner:
            raise HTTPException(status_code=401 if not token_user else 404, detail="Não autorizado.")

    files = db.query(AutoDocFile).filter(AutoDocFile.app_id == app_record.id).all()
    quota = _get_quota_info(app_record.dev_id, app_record.beta_product_id, doc_type, db) if is_owner else None

    return {
        "app_id": app_record.id,
        "app_name": app_record.app_name,
        "status": app_record.status,
        "doc_type": doc_type,
        "github_url": app_record.github_url,
        "error_message": app_record.error_message,
        "is_owner": is_owner,
        "quota": quota,
        "files": [{"id": f.id, "file_path": f.file_path, "content": f.content} for f in files]
    }


@router.put("/{app_name}/publish")
def publish_documentation(app_name: str, http_request: Request, db: Session = Depends(get_db)):
    import urllib.parse
    dev_id = _require_dev(http_request)
    decoded_name = urllib.parse.unquote(app_name)
    app_record = db.query(AutoDocApp).filter(AutoDocApp.app_name == decoded_name).first()
    if not app_record or app_record.dev_id != dev_id:
        raise HTTPException(status_code=404, detail="App não encontrado.")
    if app_record.status != "completed":
        raise HTTPException(status_code=400, detail="A documentação ainda não foi concluída.")
    app_record.status = "published"
    db.commit()
    return {"message": "Documentação publicada com sucesso!", "app_name": app_record.app_name}


@router.delete("/files/{file_id}")
def delete_documentation_file(file_id: int, http_request: Request, db: Session = Depends(get_db)):
    dev_id = _require_dev(http_request)
    file_record = db.query(AutoDocFile).filter(AutoDocFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    app_record = db.query(AutoDocApp).filter(AutoDocApp.id == file_record.app_id).first()
    if not app_record or app_record.dev_id != dev_id:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    db.delete(file_record)
    db.commit()
    return {"message": "Arquivo deletado com sucesso."}


@router.delete("/{app_id}")
def delete_documentation(app_id: int, http_request: Request, db: Session = Depends(get_db)):
    dev_id = _require_dev(http_request)
    app_record = _get_owned_app_or_404(app_id, dev_id, db)
    db.delete(app_record)
    db.commit()
    return {"message": "Documentação deletada com sucesso."}


@router.get("/apps")
def list_developer_apps(http_request: Request, db: Session = Depends(get_db)):
    dev_id = _require_dev(http_request)
    apps = db.query(AutoDocApp).filter(AutoDocApp.dev_id == dev_id).order_by(AutoDocApp.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "app_name": a.app_name,
            "github_url": a.github_url,
            "status": a.status,
            "doc_type": a.doc_type or "educational",
            "beta_product_id": a.beta_product_id,
            "created_at": a.created_at
        } for a in apps
    ]
