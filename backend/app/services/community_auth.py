"""Helpers de autenticação compartilhados pelas páginas da comunidade (fórum, desafios, vagas...)."""
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from app.core.security import get_user_id_optional
from app.models.dev_tester_models import DevProfile


def current_profile_optional(request: Request, db: Session):
    uid = get_user_id_optional(request)
    if not uid or not str(uid).isdigit():
        return None
    return db.query(DevProfile).filter(DevProfile.user_id == int(uid)).first()


def require_profile(request: Request, db: Session) -> DevProfile:
    profile = current_profile_optional(request, db)
    if not profile:
        raise HTTPException(status_code=401, detail="Faça login para continuar.")
    return profile


def author_payload(profile: DevProfile) -> dict:
    return {
        "user_id": profile.user_id,
        "username": profile.username,
        "name": profile.name or profile.username or "Dev",
        "avatar_url": profile.avatar_url,
    }
