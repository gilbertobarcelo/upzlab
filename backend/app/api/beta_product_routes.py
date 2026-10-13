from fastapi import APIRouter, BackgroundTasks, Depends, Form, UploadFile, File, Request, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database.database import get_db
from app.models.beta_product_models import BetaProduct, CampaignTemplate
from app.models.dev_tester_models import DevProfile, UpzPointsLedger
from pydantic import BaseModel

router = APIRouter(prefix="/campaigns", tags=["Campanhas"])


def _is_http_url(value) -> bool:
    return isinstance(value, str) and value.strip().lower().startswith(("http://", "https://"))


def _send_tester_welcome_email(recipient: str, name: str, app_name: str, group_url, download_url) -> None:
    """Envia ao novo testador o grupo e o link de download do app (falhas só vão para o log)."""
    import logging
    from app.services.mail_service import render_email, send_email

    first = (name or "dev").split(" ")[0]
    steps = []
    buttons = []
    if _is_http_url(group_url):
        steps.append("1. Entre no grupo de testers do app (necessário para liberar o download).")
        buttons.append(("Entrar no grupo de testers", group_url.strip()))
    if _is_http_url(download_url):
        steps.append(f"{len(steps) + 1}. Baixe e instale o app depois de entrar no grupo.")
        buttons.append(("Baixar o app", download_url.strip()))
    intro = f"Olá, {first}! Você agora é testador do app {app_name} na comunidade UpzLab."
    text = intro + "\n\n" + "\n".join(steps) + "\n\nDepois de testar, reporte bugs e sugestões no UpzLab para ganhar UpzPoints."
    plain = text + "".join(f"\n\n{label}: {url}" for label, url in buttons)
    try:
        send_email(recipient, f"Você entrou no teste de {app_name} - UpzLab", plain,
                   render_email(f"Você entrou no teste de {app_name}", text, extra_buttons=buttons))
    except Exception:
        logging.getLogger(__name__).exception("Falha ao enviar e-mail de testador para %s", recipient)

# Upload de imagens de app: allowlist + limite de 5 MB.
ALLOWED_IMAGE_EXTS = ("jpg", "jpeg", "png", "webp", "gif")
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def _save_image_upload(file, app_folder: str, prefix: str) -> str:
    """Valida extensão/tamanho, salva o arquivo e devolve o path para o banco."""
    import os
    import time

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ""
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail="Formato de imagem inválido. Use JPG, PNG, WebP ou GIF.")
    raw = file.file.read()
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Imagem muito grande (máx. 5MB).")
    os.makedirs(app_folder, exist_ok=True)
    file_name = f"{prefix}_{int(time.time())}.{ext}"
    file_path = f"{app_folder}/{file_name}"
    with open(file_path, "wb") as f:
        f.write(raw)
    return f"/{file_path}"


def _require_staff(request: Request, db: Session):
    """Exige JWT válido + perfil staff (rotas administrativas deste módulo)."""
    from app.api.dev_auth_routes import _require_staff as impl
    return impl(request, db)


@router.get("/templates")
async def get_campaign_templates(db: Session = Depends(get_db)):
    """
    Retorna a lista de templates pré-definidos para criação de campanhas.
    """
    templates = db.query(CampaignTemplate).filter(CampaignTemplate.is_active == True).all()
    return {
        "success": True,
        "data": [t.to_dict() for t in templates]
    }

@router.get("/migrate-founder")
async def run_migration(request: Request, db: Session = Depends(get_db)):
    """Migração de dados — restrita a staff."""
    _require_staff(request, db)
    from sqlalchemy import text
    try:
        db.execute(text("ALTER TABLE beta_products ADD COLUMN is_founder_app BOOLEAN DEFAULT FALSE;"))
        db.commit()
    except Exception as e:
        db.rollback()
        print("Column exists:", e)
        
    try:
        db.execute(text("UPDATE beta_products SET is_founder_app = TRUE WHERE name ILIKE '%golpe%' OR slug ILIKE '%golpe%';"))
        db.commit()
    except Exception as e:
        db.rollback()
        
    return {"success": True, "message": "Migration complete"}

@router.post("/create-app")
async def create_new_app(
    request: Request,
    nomeApp: str = Form(...),
    packageId: str = Form(...),
    descricaoApp: str = Form(...),
    versao: str = Form(...),
    categoria: str = Form(...),
    grupoGoogle: str = Form(...),
    linkDownload: str = Form(...),
    tiktokUrl: str = Form(None),
    facebookUrl: str = Form(None),
    instagramUrl: str = Form(None),
    iconeFile: UploadFile = File(None),
    capaFile: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """
    Recebe os dados do formulário do front-end e salva o App (Vitrine) no banco de dados.
    Autenticação OBRIGATÓRIA: o dono vem do JWT (nunca do formulário).
    """
    from app.api.dev_auth_routes import _get_user_id_optional

    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado. Faça login para publicar apps.")

    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev_profile:
        raise HTTPException(status_code=404, detail="Perfil de dev não encontrado. Complete seu cadastro.")

    import re
    package_id = packageId.strip()
    if len(package_id) > 120:
        raise HTTPException(status_code=422, detail="Package ID Android não pode exceder 120 caracteres.")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+", package_id):
        raise HTTPException(status_code=422, detail="Package ID Android inválido.")
    if db.query(BetaProduct).filter(BetaProduct.package_id == package_id).first():
        raise HTTPException(status_code=409, detail="Este Package ID já está cadastrado.")

    # Limpa o nome do app para usar como nome de pasta (remove espaços e caracteres especiais)
    safe_app_name = re.sub(r'[^a-zA-Z0-9_]', '_', nomeApp.lower())
    app_folder = f"uploads/apps/imagens/{safe_app_name}"
    
    # O slug deve ser o nome do app para ficar na URL (ex: e-golpe)
    app_slug = re.sub(r'[^a-zA-Z0-9]', '-', nomeApp.lower()).strip('-')
    
    # VERIFICAÇÃO DE DUPLICIDADE E DIREITOS AUTORAIS
    app_existente = db.query(BetaProduct).filter(
        (BetaProduct.slug == app_slug) | (BetaProduct.name == nomeApp)
    ).first()
    if app_existente:
        return {
            "success": False,
            "message": "Já existe um aplicativo registrado com este nome. Por questões de direitos autorais, escolha outro nome ou contate o suporte."
        }
    
    icon_url = "/placeholder-icon.png"
    if iconeFile:
        icon_url = _save_image_upload(iconeFile, app_folder, "icon")

    cover_url = "/placeholder-cover.png"
    if capaFile:
        cover_url = _save_image_upload(capaFile, app_folder, "cover")
        
    novo_app = BetaProduct(
        name=nomeApp,
        package_id=package_id,
        slug=app_slug,
        description=descricaoApp,
        version=versao,
        category=categoria,
        google_group_url=grupoGoogle,
        download_url=linkDownload,
        tiktok_url=tiktokUrl,
        facebook_url=facebookUrl,
        instagram_url=instagramUrl,
        icon_url=icon_url,
        cover_url=cover_url,
        owner_id=dev_profile.id,
        is_active=True
    )
    
    db.add(novo_app)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Package ID ou nome do app já cadastrado.") from exc
    db.refresh(novo_app)
    
    # Recompensa o Dev com pontos por publicar o app (via gamification_service — ledger + nível)
    from app.services.gamification_service import add_points_and_level_up
    from app.services.economy_rules import UpzPointsReward
    add_points_and_level_up(db, dev_profile, UpzPointsReward.APP_PUBLISHED, f"Publicou o app '{nomeApp}' na vitrine UpzLab")
    
    return {
        "success": True,
        "message": "App adicionado à vitrine com sucesso!",
        "app_id": novo_app.id
    }

@router.put("/app/{app_id}")
async def update_app(
    app_id: str,
    request: Request,
    nomeApp: str = Form(None),
    descricaoApp: str = Form(None),
    versao: str = Form(None),
    categoria: str = Form(None),
    grupoGoogle: str = Form(None),
    linkDownload: str = Form(None),
    tiktokUrl: str = Form(None),
    facebookUrl: str = Form(None),
    instagramUrl: str = Form(None),
    iconeFile: UploadFile = File(None),
    capaFile: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    from app.api.dev_auth_routes import _get_user_id_optional
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
        
    dev = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    camp = db.query(BetaProduct).filter(
        (BetaProduct.id == int(app_id)) if app_id.isdigit() else (BetaProduct.slug == app_id)
    ).first()
    
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")
        
    if camp.owner_id != dev.id and not getattr(dev, "is_staff", False):
        raise HTTPException(status_code=403, detail="Acesso negado")

    if nomeApp: camp.name = nomeApp
    if descricaoApp: camp.description = descricaoApp
    if versao: camp.version = versao
    if categoria: camp.category = categoria
    if grupoGoogle is not None: camp.google_group = grupoGoogle
    if linkDownload is not None: camp.download_url = linkDownload
    if tiktokUrl is not None: camp.tiktok_url = tiktokUrl
    if facebookUrl is not None: camp.facebook_url = facebookUrl
    if instagramUrl is not None: camp.instagram_url = instagramUrl

    import re
    safe_app_name = re.sub(r'[^a-zA-Z0-9_]', '_', camp.name.lower())
    app_folder = f"uploads/apps/imagens/{safe_app_name}"

    if iconeFile:
        camp.icon_url = _save_image_upload(iconeFile, app_folder, "icon")

    if capaFile:
        camp.cover_url = _save_image_upload(capaFile, app_folder, "cover")

    db.commit()
    return {"success": True, "message": "App atualizado com sucesso", "new_slug": camp.slug}

@router.get("/")
async def get_active_campaigns(request: Request, db: Session = Depends(get_db)):
    """
    Retorna as campanhas de teste ativas para o Dashboard.
    Inclui is_founder_app e se o usuário logado já é tester.
    """
    # Tenta identificar o usuário logado
    from app.api.beta_feedback_routes import _get_user_id_optional
    from app.models.beta_product_models import ProjectFollower
    from app.models.user_models import AppUser
    user_id = _get_user_id_optional(request)

    # Conta há quantos dias o usuário está cadastrado
    account_age_days = None
    if user_id:
        try:
            user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
            if user and user.created_at:
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                created = user.created_at.replace(tzinfo=timezone.utc) if user.created_at.tzinfo is None else user.created_at
                account_age_days = (now - created).days
        except Exception:
            pass

    campaigns = db.query(BetaProduct).filter(BetaProduct.is_active == True).all()

    # Expira boosts vencidos automaticamente
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    for camp in campaigns:
        if (camp.boost_level or 0) > 0 and camp.boost_expires_at:
            exp = camp.boost_expires_at.replace(tzinfo=timezone.utc) if camp.boost_expires_at.tzinfo is None else camp.boost_expires_at
            if exp <= now:
                camp.boost_level = 0
                camp.boost_expires_at = None
    db.commit()

    result = []
    for camp in campaigns:
        dev_name = camp.name
        if camp.owner_id:
            dev = db.query(DevProfile).filter(DevProfile.id == camp.owner_id).first()
            if dev and dev.name:
                dev_name = dev.name

        # Verifica se o usuário já é tester deste app
        is_tester = False
        if user_id:
            try:
                follower = db.query(ProjectFollower).filter(
                    ProjectFollower.product_id == camp.id,
                    ProjectFollower.dev_profile_id == int(user_id)
                ).first()
                is_tester = follower is not None
            except Exception:
                pass

        result.append({
            "id": str(camp.id),
            "slug": camp.slug,
            "owner_id": camp.owner_id,
            "name": camp.name,
            "developer": dev_name,
            "description": camp.description or "",
            "category": camp.category or "Geral",
            "reward": camp.upzpoints_budget or 500,
            "requiredLevel": camp.required_level or "Scanner",
            "slots": "Aberto",
            "tags": [camp.platform or "Android", "Beta"],
            "icon": camp.icon_url or "",
            "cover_url": camp.cover_url or "",
            "is_founder_app": getattr(camp, "is_founder_app", False) or False,
            "is_tester": is_tester,
            "account_age_days": account_age_days,
            "boost_level": camp.boost_level or 0,
            "boost_expires_at": camp.boost_expires_at.isoformat() if camp.boost_expires_at else None,
        })

    # Ordena: founder primeiro, depois por boost_level decrescente, depois por id
    result.sort(key=lambda x: (not x["is_founder_app"], -(x["boost_level"]), x["id"]))

    return {"success": True, "data": result}

from fastapi import HTTPException

@router.get("/my-apps/{dev_id}")
async def get_my_apps(dev_id: int, db: Session = Depends(get_db)):
    """
    Retorna apenas os apps que pertencem ao desenvolvedor (Studio Labs).
    """
    campaigns = db.query(BetaProduct).filter(BetaProduct.owner_id == dev_id).all()
    
    result = []
    for camp in campaigns:
        # Puxar contagem de testadores (ProjectFollower)
        from app.models.beta_product_models import ProjectFollower
        testers_count = db.query(ProjectFollower).filter(ProjectFollower.product_id == camp.id).count()

        result.append({
            "id": str(camp.id),
            "slug": camp.slug,
            "owner_id": camp.owner_id,
            "name": camp.name,
            "description": camp.description or "",
            "category": camp.category or "Geral",
            "reward": camp.upzpoints_budget or 500,
            "requiredLevel": camp.required_level or "Scanner",
            "icon": camp.icon_url or "",
            "cover_url": camp.cover_url or "",
            "testers_count": testers_count
        })

    return {"success": True, "data": result}

@router.get("/app/{slug}")
async def get_app_details(slug: str, dev_id: int = None, db: Session = Depends(get_db)):
    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()
        
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")
    
    dev_name = "Desconhecido"
    owner_user_id = None
    if camp.owner_id:
        dev = db.query(DevProfile).filter(DevProfile.id == camp.owner_id).first()
        if dev:
            dev_name = dev.name or "Desconhecido"
            owner_user_id = dev.user_id
            
    is_tester = False
    if dev_id:
        from app.models.beta_product_models import ProjectFollower
        follower = db.query(ProjectFollower).filter(
            ProjectFollower.product_id == camp.id,
            ProjectFollower.dev_profile_id == dev_id
        ).first()
        if follower:
            is_tester = True
            
    return {
        "success": True,
        "data": {
            "id": str(camp.id),
            "slug": camp.slug,
            "owner_id": camp.owner_id,
            "owner_user_id": owner_user_id,
            "name": camp.name,
            "developer": dev_name,
            "description": camp.description or "",
            "category": camp.category or "Geral",
            "reward": camp.upzpoints_budget or 500,
            "requiredLevel": camp.required_level or "Scanner",
            "slots": "Aberto",
            "tags": [camp.platform or "Android", "Beta"],
            "icon": camp.icon_url or "",
            "cover": camp.cover_url or "",
            "google_group": camp.google_group_url or "",
            "download_url": camp.download_url or "",
            "version": camp.version or "",
            "tiktok_url": camp.tiktok_url or "",
            "facebook_url": camp.facebook_url or "",
            "instagram_url": camp.instagram_url or "",
            "is_tester": is_tester
        }
    }

@router.get("/app/{slug}/dashboard")
async def get_app_dashboard(slug: str, db: Session = Depends(get_db)):
    """
    Retorna os dados analíticos do app para o Studio Labs.
    """
    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()
        
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")

    from app.models.beta_product_models import ProjectFollower
    from app.models.dev_tester_models import DevProfile
    from app.models.beta_feedback_models import BetaFeedback
    from datetime import datetime, timezone
    import json as _json

    # Testadores do app
    followers = db.query(ProjectFollower).filter(
        ProjectFollower.product_id == camp.id
    ).order_by(ProjectFollower.created_at.desc()).all()
    testers_count = len(followers)

    recent_testers = []
    for f in followers[:10]:
        dev = db.query(DevProfile).filter(DevProfile.id == f.dev_profile_id).first()
        if dev:
            try:
                certs = _json.loads(dev.certificates) if dev.certificates else []
            except Exception:
                certs = []
            recent_testers.append({
                "id": dev.id,
                "name": dev.name or "Dev Tester",
                "level": dev.egolpe_level or "Scanner",
                "badges": certs,
                "joined_at": f.created_at.isoformat() if f.created_at else None,
                "points": dev.points or 0,
            })

    # Reports vinculados ao app via implementation_id = slug do app
    app_feedbacks = db.query(BetaFeedback).filter(
        BetaFeedback.implementation_id == camp.slug
    ).order_by(BetaFeedback.created_at.desc()).all()

    bugs_count     = sum(1 for f in app_feedbacks if f.type in ("bug", "anomalia", "fraude"))
    feedback_count = sum(1 for f in app_feedbacks if f.type in ("code_fix", "publicacao"))

    recent_feedbacks_data = []
    for f in app_feedbacks[:10]:
        recent_feedbacks_data.append({
            "id": f.id,
            "title": f.title or "Sem título",
            "type": f.type,
            "status": f.status,
            "author": f.author_name,
            "created_at": f.created_at.isoformat() if f.created_at else None,
            "description": f.body,
            "deviceOs": f.device_os,
            "stepsToReproduce": f.steps_to_reproduce,
            "uxRating": f.ux_rating,
        })

    # Boost status — expira automaticamente
    boost_active = (camp.boost_level or 0) > 0
    boost_days_left = 0
    if boost_active and camp.boost_expires_at:
        now = datetime.now(timezone.utc)
        exp = camp.boost_expires_at.replace(tzinfo=timezone.utc) if camp.boost_expires_at.tzinfo is None else camp.boost_expires_at
        if exp > now:
            boost_days_left = (exp - now).days + 1
        else:
            camp.boost_level = 0
            camp.boost_expires_at = None
            db.commit()
            boost_active = False

    eng_rate = "0%" if testers_count == 0 else f"{min(testers_count * 15, 98)}%"

    return {
        "success": True,
        "data": {
            "app_name": camp.name,
            "testers_count": testers_count,
            "bugs_count": bugs_count,
            "feedback_count": feedback_count,
            "engagement_rate": eng_rate,
            "recent_testers": recent_testers,
            "recent_feedbacks": recent_feedbacks_data,
            "boost": {
                "level": camp.boost_level or 0,
                "active": boost_active,
                "days_left": boost_days_left,
                "impressions": camp.boost_impressions or 0,
                "expires_at": camp.boost_expires_at.isoformat() if camp.boost_expires_at else None,
            },
        }
    }


# ── Boost / Promoção ────────────────────────────────────────────────────────

from pydantic import BaseModel as _PydBase

BOOST_COST  = {1: 500, 2: 1000, 3: 1500}
BOOST_LABEL = {0: "Sem boost", 1: "Boost de Feed", 2: "Destaque Pinado", 3: "Campanha Elite"}
BOOST_REQUIRED_LEVEL = {1: "Scanner", 2: "Scanner", 3: "White Hat"}
LEVEL_ORDER = {"Scanner": 0, "White Hat": 1, "Bug Hunter": 2, "Cyber Ninja": 3}


class BoostPayload(_PydBase):
    boost_level: int  # 1, 2 ou 3


@router.post("/app/{slug}/boost")
async def activate_boost(slug: str, payload: BoostPayload, request: Request, db: Session = Depends(get_db)):
    """Dev gasta UpzPoints para destacar seu app no feed da comunidade."""
    from app.api.beta_feedback_routes import _get_user_id_optional
    from app.services.gamification_service import add_points_and_level_up
    from app.services.economy_rules import UpzPointsCost
    from datetime import datetime, timezone, timedelta

    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    if payload.boost_level not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="boost_level inválido. Use 1, 2 ou 3.")

    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")

    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev_profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    if camp.owner_id != dev_profile.id:
        raise HTTPException(status_code=403, detail="Você não é o dono deste app")

    # Verifica requisito de patente (Nível 3 exige White Hat+)
    required = BOOST_REQUIRED_LEVEL[payload.boost_level]
    if LEVEL_ORDER.get(dev_profile.egolpe_level, 0) < LEVEL_ORDER.get(required, 0):
        raise HTTPException(
            status_code=403,
            detail=f"Campanha Elite requer patente {required}. Sua patente: {dev_profile.egolpe_level}"
        )

    custo = BOOST_COST[payload.boost_level]
    if (dev_profile.points or 0) < custo:
        raise HTTPException(
            status_code=402,
            detail=f"Saldo insuficiente. Necessário: {custo} pts. Seu saldo: {dev_profile.points} pts"
        )

    # Debita pontos via gamification_service (registra no ledger com amount negativo)
    add_points_and_level_up(
        db, dev_profile, -custo,
        f"{BOOST_LABEL[payload.boost_level]} ativado para o app '{camp.name}'"
    )

    now = datetime.now(timezone.utc)
    camp.boost_level = payload.boost_level
    camp.boost_expires_at = now + timedelta(days=UpzPointsCost.BOOST_DURATION_DAYS)
    camp.boost_impressions = 0
    db.commit()

    return {
        "success": True,
        "message": f"{BOOST_LABEL[payload.boost_level]} ativado por {UpzPointsCost.BOOST_DURATION_DAYS} dias!",
        "boost_level": camp.boost_level,
        "expires_at": camp.boost_expires_at.isoformat(),
        "points_spent": custo,
        "new_balance": dev_profile.points,
    }


@router.delete("/app/{slug}/boost")
async def cancel_boost(slug: str, request: Request, db: Session = Depends(get_db)):
    """Cancela o boost ativo (sem reembolso)."""
    from app.api.beta_feedback_routes import _get_user_id_optional

    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")

    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev_profile or camp.owner_id != dev_profile.id:
        raise HTTPException(status_code=403, detail="Sem permissão")

    camp.boost_level = 0
    camp.boost_expires_at = None
    db.commit()
    return {"success": True, "message": "Boost cancelado. Pontos não são reembolsados."}


@router.get("/app/{slug}/boost/status")
async def get_boost_status(slug: str, db: Session = Depends(get_db)):
    """Retorna o estado atual do boost do app."""
    from datetime import datetime, timezone

    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")

    boost_active = (camp.boost_level or 0) > 0
    days_left = 0
    if boost_active and camp.boost_expires_at:
        now = datetime.now(timezone.utc)
        exp = camp.boost_expires_at.replace(tzinfo=timezone.utc) if camp.boost_expires_at.tzinfo is None else camp.boost_expires_at
        if exp > now:
            days_left = (exp - now).days + 1
        else:
            camp.boost_level = 0
            camp.boost_expires_at = None
            db.commit()
            boost_active = False

    return {
        "success": True,
        "boost": {
            "active": boost_active,
            "level": camp.boost_level or 0,
            "label": BOOST_LABEL.get(camp.boost_level or 0, "Sem boost"),
            "days_left": days_left,
            "impressions": camp.boost_impressions or 0,
            "expires_at": camp.boost_expires_at.isoformat() if camp.boost_expires_at else None,
            "costs": BOOST_COST,
        }
    }


@router.post("/app/{slug}/follow")
async def register_tester(slug: str, background_tasks: BackgroundTasks, dev_id: int = Form(...), db: Session = Depends(get_db)):
    from app.models.beta_product_models import ProjectFollower
    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()
        
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")

    # Verifica se já está seguindo
    follower = db.query(ProjectFollower).filter(
        ProjectFollower.product_id == camp.id,
        ProjectFollower.dev_profile_id == dev_id
    ).first()
    
    if follower:
        return {"success": False, "message": "Você já é um testador deste aplicativo!"}

    new_follower = ProjectFollower(product_id=camp.id, dev_profile_id=dev_id)
    db.add(new_follower)
    db.commit()

    # Premia o dev com pontos por se cadastrar como tester
    dev_profile = db.query(DevProfile).filter(DevProfile.id == dev_id).first()
    if dev_profile:
        from app.services.gamification_service import add_points_and_level_up
        from app.services.economy_rules import UpzPointsReward
        reason = f"Cadastrou-se como testador do app: {camp.name}"
        # Se for o app founder, premia com APP_FOUNDER_DOWNLOAD
        if getattr(camp, "is_founder_app", False):
            add_points_and_level_up(db, dev_profile, UpzPointsReward.APP_FOUNDER_DOWNLOAD, f"Download do App Founder: {camp.name}")
        else:
            add_points_and_level_up(db, dev_profile, UpzPointsReward.TESTER_JOIN_APP, reason)

    email_queued = False
    if dev_profile and (_is_http_url(camp.google_group_url) or _is_http_url(camp.download_url)):
        from app.models.user_models import AppUser
        app_user = db.query(AppUser).filter(AppUser.id == dev_profile.user_id).first()
        if app_user and app_user.email and app_user.email_verified and not app_user.is_seed:
            background_tasks.add_task(
                _send_tester_welcome_email, app_user.email, dev_profile.name or app_user.name,
                camp.name, camp.google_group_url, camp.download_url,
            )
            email_queued = True

    return {
        "success": True,
        "message": "Cadastro como testador realizado com sucesso!",
        "email_sent": email_queued,
        "points_awarded": UpzPointsReward.APP_FOUNDER_DOWNLOAD if getattr(camp, "is_founder_app", False) else UpzPointsReward.TESTER_JOIN_APP,
    }

@router.post("/app/{slug}/unfollow")
async def unregister_tester(slug: str, dev_id: int = Form(...), db: Session = Depends(get_db)):
    from app.models.beta_product_models import ProjectFollower
    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()
        
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")

    follower = db.query(ProjectFollower).filter(
        ProjectFollower.product_id == camp.id,
        ProjectFollower.dev_profile_id == dev_id
    ).first()
    
    if not follower:
        return {"success": False, "message": "Você não é um testador deste aplicativo."}
    db.delete(follower)
    
    # Previne farming: retira os pontos ganhos
    dev_profile = db.query(DevProfile).filter(DevProfile.id == dev_id).first()
    if dev_profile:
        from app.services.gamification_service import add_points_and_level_up
        from app.services.economy_rules import UpzPointsReward
        penalty = UpzPointsReward.APP_FOUNDER_DOWNLOAD if getattr(camp, "is_founder_app", False) else UpzPointsReward.TESTER_JOIN_APP
        add_points_and_level_up(db, dev_profile, -penalty, f"Cancelou teste do app: {camp.name} (Estorno)")

    db.commit()
    return {"success": True, "message": "Você deixou de ser testador com sucesso."}

@router.delete("/app/{slug}")
async def delete_app(slug: str, request: Request, db: Session = Depends(get_db)):
    from app.api.beta_feedback_routes import _get_user_id_optional
    
    # 1. Autenticação obrigatória
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado. Faça login para deletar.")

    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()
        
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")

    # 2. Validação de Propriedade (Apenas o dono pode deletar)
    from app.models.dev_tester_models import DevProfile
    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    
    if not dev_profile or camp.owner_id != dev_profile.id:
        raise HTTPException(status_code=403, detail="Acesso negado. Você não é o dono deste aplicativo.")

    db.delete(camp)
    db.commit()
    return {"success": True, "message": "App deletado com sucesso"}

@router.get("/admin/force-delete-founder")
async def force_delete_founder(request: Request, db: Session = Depends(get_db)):
    """Rota temporária de emergência para apagar o App Founder órfão (staff only)."""
    _require_staff(request, db)
    camp = db.query(BetaProduct).filter(BetaProduct.is_founder_app == True).first()
    if not camp:
        return {"success": False, "message": "App Founder não encontrado."}
    
    db.delete(camp)
    db.commit()
    return {"success": True, "message": "App Founder deletado com sucesso!"}

@router.put("/app/{slug}")
async def edit_app(
    request: Request,
    slug: str,
    nomeApp: str = Form(None),
    descricaoApp: str = Form(None),
    versao: str = Form(None),
    categoria: str = Form(None),
    grupoGoogle: str = Form(None),
    linkDownload: str = Form(None),
    tiktokUrl: str = Form(None),
    facebookUrl: str = Form(None),
    instagramUrl: str = Form(None),
    iconeFile: UploadFile = File(None),
    capaFile: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # Autenticação + propriedade (dono ou staff) — igual ao PUT /app/{app_id}.
    from app.api.dev_auth_routes import _get_user_id_optional
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
    dev = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    camp = None
    if slug.isdigit():
        camp = db.query(BetaProduct).filter(BetaProduct.id == int(slug)).first()
    if not camp:
        camp = db.query(BetaProduct).filter(BetaProduct.slug == slug).first()

    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")

    if camp.owner_id != dev.id and not getattr(dev, "is_staff", False):
        raise HTTPException(status_code=403, detail="Acesso negado")

    if nomeApp and nomeApp != camp.name:
        import re
        new_slug = re.sub(r'[^a-zA-Z0-9]', '-', nomeApp.lower()).strip('-')
        app_existente = db.query(BetaProduct).filter(
            (BetaProduct.id != camp.id) & ((BetaProduct.slug == new_slug) | (BetaProduct.name == nomeApp))
        ).first()
        
        if app_existente:
            return {
                "success": False,
                "message": "Já existe outro aplicativo registrado com este nome. Acesso negado."
            }
        camp.name = nomeApp
        camp.slug = new_slug
        
    if descricaoApp: camp.description = descricaoApp
    if versao: camp.version = versao
    if categoria: camp.category = categoria
    if grupoGoogle: camp.google_group_url = grupoGoogle
    if linkDownload: camp.download_url = linkDownload
    if tiktokUrl is not None: camp.tiktok_url = tiktokUrl
    if facebookUrl is not None: camp.facebook_url = facebookUrl
    if instagramUrl is not None: camp.instagram_url = instagramUrl
    
    # Atualiza as imagens se houver (com validação de extensão/tamanho)
    import re
    safe_app_name = re.sub(r'[^a-zA-Z0-9_]', '_', camp.name.lower())
    app_folder = f"uploads/apps/imagens/{safe_app_name}"
    
    if iconeFile:
        camp.icon_url = _save_image_upload(iconeFile, app_folder, "icon")
        
    if capaFile:
        camp.cover_url = _save_image_upload(capaFile, app_folder, "cover")

    db.commit()
    db.refresh(camp)
    
    return {
        "success": True,
        "message": "Aplicativo atualizado com sucesso!",
        "new_slug": camp.slug
    }

@router.get("/meus-apps")
async def get_meus_apps(dev_id: int = Query(...), db: Session = Depends(get_db)):
    """Retorna a lista de apps que o tester está participando."""
    from app.models.beta_product_models import ProjectFollower
    
    followers = db.query(ProjectFollower).filter(ProjectFollower.dev_profile_id == dev_id).all()
    apps_ids = [f.product_id for f in followers]
    
    if not apps_ids:
        return {"success": True, "data": []}
        
    apps = db.query(BetaProduct).filter(BetaProduct.id.in_(apps_ids)).all()
    
    apps_data = []
    for app in apps:
        app_dict = app.to_dict()
        app_dict["is_tester"] = True
        apps_data.append(app_dict)
        
    return {
        "success": True,
        "data": apps_data
    }

class BoostPayload(BaseModel):
    boost_level: int

@router.post("/app/{app_id}/boost")
async def activate_boost(
    app_id: str,
    payload: BoostPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    from app.api.dev_auth_routes import _get_user_id_optional
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
        
    dev = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    camp = db.query(BetaProduct).filter(
        (BetaProduct.id == int(app_id)) if app_id.isdigit() else (BetaProduct.slug == app_id)
    ).first()
    
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")
        
    if camp.owner_id != dev.id and not getattr(dev, "is_staff", False):
        raise HTTPException(status_code=403, detail="Apenas o dono do App pode ativar o boost")

    costs = {1: 500, 2: 1500, 3: 5000}
    impressions_map = {1: 1000, 2: 5000, 3: 20000}
    
    if payload.boost_level not in costs:
        raise HTTPException(status_code=400, detail="Nível de boost inválido")
        
    cost = costs[payload.boost_level]
    impressions = impressions_map[payload.boost_level]

    if not getattr(dev, "is_staff", False):
        if (dev.points or 0) < cost:
            raise HTTPException(status_code=402, detail=f"Saldo insuficiente. Você precisa de {cost} UpzPoints.")
        
        from app.services.gamification_service import add_points_and_level_up
        add_points_and_level_up(db, dev, -cost, f"Ativou o Boost Nível {payload.boost_level} para o App {camp.name}")

    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    camp.boost_level = payload.boost_level
    camp.boost_impressions = (camp.boost_impressions or 0) + impressions
    camp.boost_expires_at = now + timedelta(days=7)
    
    db.commit()
    
    return {"success": True, "message": f"Boost ativado por 7 dias! Você ganhou {impressions} impressões."}

@router.delete("/app/{app_id}/boost")
async def cancel_boost(
    app_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    from app.api.dev_auth_routes import _get_user_id_optional
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
        
    dev = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    camp = db.query(BetaProduct).filter(
        (BetaProduct.id == int(app_id)) if app_id.isdigit() else (BetaProduct.slug == app_id)
    ).first()
    
    if not camp:
        raise HTTPException(status_code=404, detail="App não encontrado")
        
    if camp.owner_id != dev.id and not getattr(dev, "is_staff", False):
        raise HTTPException(status_code=403, detail="Acesso negado")

    camp.boost_level = 0
    camp.boost_expires_at = None
    
    db.commit()
    
    return {"success": True, "message": "Boost cancelado com sucesso."}
