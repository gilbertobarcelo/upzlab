from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database.database import get_db
from app.core.security import get_user_id_optional
from app.models.dev_tester_models import DevProfile
from app.models.beta_product_models import BetaProduct, ProjectFollower
from app.services.daily_checkin_service import (
    get_daily_status,
    record_app_open,
)

router = APIRouter(prefix="/sdk", tags=["UpzLab SDK"])


class SDKCheckinRequest(BaseModel):
    app_id: str = Field(default="upzlab-community", min_length=1, max_length=120, description="Identificador do app")
    platform: str = Field(default="unknown", min_length=1, max_length=40, description="android, ios, web, react-native, kotlin, next")
    session_id: Optional[str] = Field(default=None, max_length=255, description="ID da sessão do app")
    timezone: str = Field(default="America/Sao_Paulo", max_length=80, description="Timezone IANA do usuário")
    app_version: Optional[str] = Field(default=None, max_length=60, description="Versão do app")


def _current_profile(request: Request, db: Session) -> DevProfile:
    user_id = get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Autenticação UpzLab obrigatória.")
    try:
        user_id = int(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Sessão UpzLab inválida.") from exc

    profile = db.query(DevProfile).filter(DevProfile.user_id == user_id).first()
    if not profile or profile.status != "ACTIVE":
        raise HTTPException(status_code=404, detail="Perfil UpzLab ativo não encontrado.")
    return profile


def _owned_product(db: Session, profile: DevProfile, app_key: str) -> BetaProduct:
    product = (
        db.query(BetaProduct)
        .filter(
            or_(
                BetaProduct.slug == app_key,
                BetaProduct.package_id == app_key,
                BetaProduct.id == int(app_key) if app_key.isdigit() else False,
            )
        )
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="App cadastrado não encontrado.")
    if product.owner_id != profile.id:
        raise HTTPException(status_code=403, detail="Somente o dono do app pode configurar o SDK.")
    return product


@router.get("/apps")
async def get_sdk_apps(request: Request, db: Session = Depends(get_db)):
    profile = _current_profile(request, db)
    followed_ids = (
        db.query(ProjectFollower.product_id)
        .filter(ProjectFollower.dev_profile_id == profile.id)
        .subquery()
    )
    products = (
        db.query(BetaProduct)
        .filter(
            BetaProduct.is_active.is_(True),
            (BetaProduct.owner_id == profile.id) | BetaProduct.id.in_(followed_ids),
        )
        .order_by(BetaProduct.name.asc())
        .all()
    )
    return {
        "success": True,
        "data": [
            {
                "id": product.id,
                "name": product.name,
                "package_id": product.package_id,
                "app_id": product.package_id,
                "is_owner": product.owner_id == profile.id,
            }
            for product in products
            if product.package_id
        ],
    }


@router.get("/apps/{app_key}/configuration")
async def get_sdk_app_configuration(
    app_key: str,
    request: Request,
    db: Session = Depends(get_db),
):
    profile = _current_profile(request, db)
    product = _owned_product(db, profile, app_key)
    return {
        "success": True,
        "data": {
            "id": product.id,
            "name": product.name,
            "package_id": product.package_id,
            "app_id": product.package_id,
            "version": product.version,
        },
    }


def _validate_checkin_app(db: Session, profile: DevProfile, app_id: str) -> None:
    if app_id == "upzlab-community":
        return
    product = db.query(BetaProduct).filter(
        BetaProduct.package_id == app_id,
        BetaProduct.is_active.is_(True),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="App Android não cadastrado na UpzLab.")
    is_owner = product.owner_id == profile.id
    is_tester = (
        db.query(ProjectFollower)
        .filter(
            ProjectFollower.product_id == product.id,
            ProjectFollower.dev_profile_id == profile.id,
        )
        .first()
        is not None
    )
    if not is_owner and not is_tester:
        raise HTTPException(status_code=403, detail="Cadastre-se como testador deste app antes do check-in.")


@router.post("/checkin")
async def receive_sdk_checkin(
    payload: SDKCheckinRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Recebe o ping diário do app integrado ao SDK UpzLab.
    """
    try:
        profile = _current_profile(request, db)
        _validate_checkin_app(db, profile, payload.app_id)
        payload_data = record_app_open(
            db=db,
            dev_profile=profile,
            app_id=payload.app_id,
            platform=payload.platform,
            session_id=payload.session_id,
            timezone_name=payload.timezone,
        )
        return {"success": True, "data": payload_data}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/checkin/status")
async def get_sdk_checkin_status(
    request: Request,
    app_id: str = Query("upzlab-community", description="Identificador do app"),
    timezone: Optional[str] = Query(None, max_length=80, description="Timezone IANA do usuário"),
    db: Session = Depends(get_db),
):
    try:
        profile = _current_profile(request, db)
        _validate_checkin_app(db, profile, app_id)
        return {"success": True, "data": get_daily_status(db, profile, app_id, timezone)}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/checkin/compliance")
async def get_sdk_compliance(
    request: Request,
    app_id: str = Query("upzlab-community", description="Identificador do app"),
    timezone: Optional[str] = Query(None, max_length=80, description="Timezone IANA do usuário"),
    db: Session = Depends(get_db),
):
    try:
        profile = _current_profile(request, db)
        _validate_checkin_app(db, profile, app_id)
        return {"success": True, "data": get_daily_status(db, profile, app_id, timezone)}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
