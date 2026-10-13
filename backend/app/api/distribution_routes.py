from typing import Literal
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dev_auth_routes import _require_staff
from app.models.distribution_models import AppDistributionRelease
from database.database import get_db

router = APIRouter(prefix="/api/dev/distribution", tags=["App Distribution"])


class ReleaseCreatePayload(BaseModel):
    version_name: str = Field(min_length=1, max_length=60)
    version_code: int = Field(gt=0)
    file_type: str = Field(min_length=1, max_length=40)
    release_notes: str = Field(default="", max_length=5000)
    status: Literal["draft", "published"] = "published"
    firebase_url: str = Field(min_length=1, max_length=1000)

    @field_validator("version_name", "file_type")
    @classmethod
    def require_nonblank_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O campo não pode ficar vazio.")
        return value

    @field_validator("firebase_url")
    @classmethod
    def require_https_url(cls, value: str) -> str:
        value = value.strip()
        parsed = urlparse(value)
        if parsed.scheme != "https" or not parsed.netloc:
            raise ValueError("Informe um link HTTPS válido para a release.")
        return value


@router.get("/latest")
async def get_latest_release(db: Session = Depends(get_db)):
    release = (
        db.query(AppDistributionRelease)
        .filter(AppDistributionRelease.status == "published")
        .order_by(
            AppDistributionRelease.version_code.desc(),
            AppDistributionRelease.created_at.desc(),
        )
        .first()
    )
    return release.to_dict() if release else None


@router.post("/releases", status_code=201)
async def create_release(
    payload: ReleaseCreatePayload,
    request: Request,
    db: Session = Depends(get_db),
):
    _require_staff(request, db)
    release = AppDistributionRelease(**payload.model_dump())
    db.add(release)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Já existe uma release cadastrada com este código de versão.",
        ) from exc
    db.refresh(release)
    return {"success": True, "data": release.to_dict()}
