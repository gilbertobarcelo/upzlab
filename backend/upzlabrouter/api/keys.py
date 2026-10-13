"""
CRUD de UPZLAB_KEY — geração, listagem e revogação.
"""
import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database.database import get_db
from app.core.security import get_user_id_optional
from upzlabrouter.core.config import KEY_PREFIX
from upzlabrouter.core.exceptions import RouterAuthError
from upzlabrouter.models.router_models import RouterApiKey

router = APIRouter(prefix="/keys", tags=["UpzLabRouter Keys"])


def _require_dev(request: Request) -> int:
    uid = get_user_id_optional(request)
    if not uid:
        raise RouterAuthError("Não autenticado.")
    try:
        return int(uid)
    except ValueError as exc:
        raise RouterAuthError("Sessão UpzLab inválida.") from exc


def _hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class CreateKeyPayload(BaseModel):
    name: str = Field(default="Minha chave", min_length=1, max_length=100)


@router.post("")
def create_key(payload: CreateKeyPayload, request: Request, db: Session = Depends(get_db)):
    """Gera uma nova UPZLAB_KEY. O valor completo é retornado UMA VEZ — não é armazenado."""
    dev_id = _require_dev(request)
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="O nome da chave não pode ficar vazio.")

    raw     = KEY_PREFIX + secrets.token_urlsafe(32)
    prefix  = raw[:16]
    key_hash = _hash_key(raw)

    key = RouterApiKey(
        dev_id=dev_id,
        key_hash=key_hash,
        key_prefix=prefix,
        name=name,
        is_active=True,
    )
    db.add(key)
    db.commit()
    db.refresh(key)

    return {
        "id": key.id,
        "key": raw,          # mostrado apenas aqui — nunca mais recuperável
        "key_prefix": prefix,
        "name": key.name,
        "created_at": key.created_at,
        "warning": "Guarde esta chave agora. Ela não será exibida novamente.",
    }


@router.get("")
def list_keys(request: Request, db: Session = Depends(get_db)):
    """Lista todas as chaves do dev (sem expor o valor completo)."""
    dev_id = _require_dev(request)
    keys = db.query(RouterApiKey).filter(
        RouterApiKey.dev_id == dev_id
    ).order_by(RouterApiKey.created_at.desc()).all()

    return [
        {
            "id": k.id,
            "key_prefix": k.key_prefix,
            "name": k.name,
            "is_active": k.is_active,
            "last_used_at": k.last_used_at,
            "created_at": k.created_at,
        }
        for k in keys
    ]


@router.delete("/{key_id}")
def revoke_key(key_id: int, request: Request, db: Session = Depends(get_db)):
    """Revoga (desativa) uma chave."""
    dev_id = _require_dev(request)
    key = db.query(RouterApiKey).filter(
        RouterApiKey.id == key_id,
        RouterApiKey.dev_id == dev_id
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="Chave não encontrada.")
    key.is_active = False
    db.commit()
    return {"message": "Chave revogada com sucesso."}
