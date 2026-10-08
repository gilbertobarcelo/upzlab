"""
UpzLab - Beta Feedback & Updates Routes com Suporte a Comunidade Dev Tester
"""
import json
import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.database import get_db
from app.models.beta_feedback_models import BetaFeedback, BetaUpdate
# Segredo e helpers de JWT centralizados (sem fallback previsível).
from app.core.security import SECRET_KEY, ALGORITHM, get_user_id_optional as _shared_get_user_id_optional

router = APIRouter(prefix="/upzlab/beta-feedback", tags=["UpzLab Beta Feedback"])
updates_router = APIRouter(prefix="/upzlab/beta-updates", tags=["UpzLab Beta Updates"])

# Diretório backend/ — sobe 2 níveis a partir de app/api/
_BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(_BASE, "uploads", "posts")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Upload de imagens: allowlist + limite de 5 MB por arquivo.
ALLOWED_IMAGE_EXTS = ("jpg", "jpeg", "png", "gif", "webp")
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def _get_user_id_optional(request: Request) -> Optional[str]:
    # Implementação centralizada em app.core.security.
    return _shared_get_user_id_optional(request)


def _get_user_id(request: Request) -> int:
    uid = _get_user_id_optional(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return uid


def _seed_initial_feedbacks_if_empty(db: Session):
    """Semeia relatos iniciais no banco de dados se a tabela estiver vazia"""
    count = db.query(BetaFeedback).count()
    if count == 0:
        from app.models.user_models import AppUser
        first_user = db.query(AppUser).first()
        if not first_user:
            return  # Sem usuário cadastrado, não injeta dados falsos
        uid = first_user.id
        
        f1 = BetaFeedback(
            user_id=uid,
            author_name="Gabriel Martins",
            author_role="Android & Security Dev",
            type="anomalia",
            title="Race condition na gravação paralela do banco SQLite local",
            body="Identifiquei uma concorrência de escritas no banco local durante o recebimento de chamadas simultâneas. Sugiro o uso de Coroutine Mutex no repositório de dados.",
            code_snippet="""// Trecho em CallRepository.kt
private val mutex = Mutex()

suspend fun saveCallRecord(record: CallRecord) = mutex.withLock {
    db.callRecordDao().insert(record)
}""",
            status="approved",
            award_points=300,
            badge_type="visao_de_aguia",
            admin_comment="Excelente visão técnica! A correção com Mutex foi validada e integrada ao app Android.",
            likes=24,
        )
        f2 = BetaFeedback(
            user_id=uid,
            author_name="Carolina Silva",
            author_role="Full Stack & QA Specialist",
            type="code_fix",
            title="Otimização de carregamento de imagens com WebP e lazy loading",
            body="Convertemos todos os assets estáticos do site para WebP 80x80px com dimensões explícitas. Economia de 91% de banda no Lighthouse.",
            status="approved",
            award_points=300,
            badge_type="code_expert",
            admin_comment="Refatoração perfeita de frontend! Aplicamos em todas as rotas do egolpe_web.",
            likes=19,
        )
        db.add_all([f1, f2])
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[SEED ERROR] Falha ao injetar feedbacks falsos: {e}")


# ── Comunidade Dev Tester Endpoints ──────────────────────────────────────────

@router.get("/comunidade/feed/me")
async def get_meus_relatos(dev_id: int = Query(...), db: Session = Depends(get_db)):
    """Retorna os relatos enviados pelo próprio tester/usuário logado."""
    items = db.query(BetaFeedback).filter(BetaFeedback.user_id == dev_id).order_by(BetaFeedback.created_at.desc()).all()
    merged_items = []
    
    for item in items:
        badge_label = None
        if item.badge_type == "visao_de_aguia": badge_label = "VISÃO DE ÁGUIA"
        elif item.badge_type == "code_expert": badge_label = "CODE EXPERT"
        elif item.badge_type == "shield_hunter": badge_label = "SHIELD HUNTER"
        elif item.badge_type == "bug_hunter": badge_label = "BUG HUNTER"

        img_url = None
        if item.images and item.images != "[]":
            try:
                import json
                parsed_imgs = json.loads(item.images)
                if isinstance(parsed_imgs, list) and len(parsed_imgs) > 0:
                    img_url = parsed_imgs[0]
                elif isinstance(parsed_imgs, str):
                    img_url = parsed_imgs
            except Exception:
                img_url = item.images

        merged_items.append({
            "id": f"fb-{item.id}",
            "db_id": item.id,
            "type": item.type,
            "title": item.title,
            "description": item.body,
            "author": item.author_name,
            "role": item.author_role,
            "time": item.created_at.strftime("%d/%m/%Y") if item.created_at else "Agora",
            "likes": item.likes,
            "tags": [badge_label] if badge_label else [item.status.upper()],
            "reward": item.award_points,
            "status": item.status,
            "admin_comment": item.admin_comment,
            "hasImage": bool(img_url),
            "imageUrl": img_url,
            "codeSnippet": item.code_snippet
        })
        
    return {"success": True, "data": merged_items}

@router.get("/comunidade/feed")
async def get_comunidade_feed(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retorna todas as anomalias, feedbacks e atualizações do UpzLab na comunidade"""
    
    merged_items = []
    offset = (page - 1) * limit

    # 1. Fetch Feedbacks
    query = db.query(BetaFeedback)
    if category and category != "all":
        query = query.filter(BetaFeedback.type == category)
    items = query.order_by(BetaFeedback.created_at.desc()).offset(offset).limit(limit).all()
    
    from app.models.beta_feedback_models import BetaFeedbackComment
    from app.models.dev_tester_models import DevProfile

    user_ids = [item.user_id for item in items if item.user_id]
    devs = db.query(DevProfile).filter(DevProfile.id.in_(user_ids)).all() if user_ids else []
    dev_map = {d.id: d.username or (d.name.replace(" ", "").lower() if d.name else "dev") for d in devs}

    for item in items:
        badge_label = None
        if item.badge_type == "visao_de_aguia":
            badge_label = "VISÃO DE ÁGUIA"
        elif item.badge_type == "code_expert":
            badge_label = "CODE EXPERT"
        elif item.badge_type == "shield_hunter":
            badge_label = "SHIELD HUNTER"
        elif item.badge_type == "bug_hunter":
            badge_label = "BUG HUNTER"
        elif item.badge_type:
            badge_label = item.badge_type.upper().replace("_", " ")

        img_url = None
        if item.images and item.images != "[]":
            try:
                parsed_imgs = json.loads(item.images)
                if isinstance(parsed_imgs, list) and len(parsed_imgs) > 0:
                    img_url = parsed_imgs[0]
                elif isinstance(parsed_imgs, str):
                    img_url = parsed_imgs
            except Exception:
                img_url = item.images

        # Fetch comments for this post
        comments = db.query(BetaFeedbackComment).filter(BetaFeedbackComment.feedback_id == item.id).order_by(BetaFeedbackComment.created_at.desc()).all()
        comments_count = len(comments)
        last_comment = None
        if comments_count > 0:
            last_comment = {
                "authorName": comments[0].author_name,
                "body": comments[0].body
            }

        merged_items.append({
            "sort_date": item.created_at,
            "data": {
                "id": f"post-{item.id}",
                "db_id": item.id,
                "authorName": item.author_name or "Dev Tester",
                "authorUsername": dev_map.get(item.user_id, "dev"),
                "authorRole": item.author_role or "Security & Code Tester",
                "authorAvatarBg": "from-[#00FF87] to-emerald-600",
                "category": item.type or "anomalia",
                "title": item.title or "Anomalia sem título",
                "description": item.body,
                "codeSnippet": item.code_snippet,
                "deviceOs": item.device_os,
                "stepsToReproduce": item.steps_to_reproduce,
                "uxRating": item.ux_rating,
                "hasImage": bool(img_url),
                "imageUrl": img_url,
                "status": item.status or "open",
                "badgeAwarded": badge_label,
                "pointsAwarded": item.award_points or 0,
                "adminComment": item.admin_comment,
                "likes": item.likes or 0,
                "date": item.created_at.strftime("%d/%m/%Y") if item.created_at else "Hoje",
                "user_id": item.user_id,
                "commentsCount": comments_count,
                "lastComment": last_comment,
            }
        })

    # 2. Fetch Updates
    updates_query = db.query(BetaUpdate).filter(BetaUpdate.is_published == True)
    if category and category != "all":
        updates_query = updates_query.filter(BetaUpdate.type == category)
    updates = updates_query.order_by(BetaUpdate.created_at.desc()).offset(offset).limit(limit).all()
    
    for u in updates:
        merged_items.append({
            "sort_date": u.created_at,
            "data": {
                "id": f"update-{u.id}",
                "db_id": u.id,
                "authorName": "UpzLab Team",
                "authorUsername": "upzlabteam",
                "authorRole": "Admin & Product",
                "authorAvatarBg": "from-emerald-500 to-teal-700",
                "category": "update",  # Normalize to show in the Atualizações tab
                "title": f"[{u.version or 'Geral'}] {u.title}",
                "description": u.body,
                "codeSnippet": None,
                "hasImage": False,
                "imageUrl": None,
                "status": "approved",
                "badgeAwarded": "ATUALIZAÇÃO OFICIAL",
                "pointsAwarded": u.points_reward or 0,
                "adminComment": None,
                "likes": 0,
                "date": u.created_at.strftime("%d/%m/%Y") if u.created_at else "Hoje",
            }
        })
        
    # Sort by date descending
    merged_items.sort(key=lambda x: x["sort_date"].timestamp() if x["sort_date"] else 0, reverse=True)
    
    feed_data = [item["data"] for item in merged_items]

    return {"success": True, "data": feed_data}


@router.get("/comunidade/campaigns")
async def get_comunidade_campaigns(db: Session = Depends(get_db)):
    """Retorna missões (implementações ativas) para os Dev Testers testarem"""
    from app.models import Implementation
    
    campaigns = (
        db.query(Implementation)
        .filter(
            Implementation.is_test_campaign == True,
            Implementation.status == "in_testing"
        )
        .order_by(Implementation.created_at.desc())
        .all()
    )
    
    data = []
    for c in campaigns:
        data.append({
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "required_level": c.required_level,
            "points_reward": c.points_reward,
            "created_at": c.created_at.strftime("%d/%m/%Y") if c.created_at else ""
        })
        
    return {"success": True, "data": data}


class CreateAnomalyPayload(BaseModel):
    title: str
    category: str = "anomalia"
    description: str
    code_snippet: Optional[str] = None
    author_name: Optional[str] = "Gabriel Martins"
    author_role: Optional[str] = "Android & Security Developer"
    implementation_id: Optional[str] = None


@router.post("/comunidade/post")
async def create_comunidade_post(
    request: Request,
    db: Session = Depends(get_db),
):
    """Cria uma nova anomalia/bug/discussão no banco de dados SQLite/PostgreSQL"""
    user_id = _get_user_id_optional(request)
    form = await request.form()
    
    title = form.get("title", "Nova Publicação")
    category = form.get("category", "anomalia")
    description = form.get("description", "")
    code_snippet = form.get("code_snippet")
    device_os = form.get("device_os")
    steps_to_reproduce = form.get("steps_to_reproduce")
    ux_rating_raw = form.get("ux_rating")
    author_name = form.get("author_name", "Dev")
    author_role = form.get("author_role", "Developer")
    implementation_id = form.get("implementation_id")
    images = form.getlist("images")

    ux_rating = None
    if ux_rating_raw and ux_rating_raw.isdigit():
        ux_rating = int(ux_rating_raw)

    saved_paths = []
    if images:
        for img in images:
            if img.filename:
                ext = img.filename.rsplit(".", 1)[-1].lower()
                if ext in ("jpg", "jpeg", "png", "gif", "webp", "txt", "log"):
                    fname = f"{uuid.uuid4().hex}.{ext}"
                    fpath = os.path.join(UPLOAD_DIR, fname)
                    with open(fpath, "wb") as f:
                        f.write(await img.read())
                    saved_paths.append(f"/uploads/posts/{fname}")

    # Support saving user_id as an integer if it's an AppUser, else None for Global Admins
    db_user_id = None
    try:
        db_user_id = int(user_id) if user_id else None
    except ValueError:
        db_user_id = None

    fb = BetaFeedback(
        user_id=db_user_id,
        author_name=author_name or "Dev UpzLab",
        author_role=author_role or "Developer",
        type=category,
        title=title,
        body=description,
        code_snippet=code_snippet,
        device_os=device_os,
        steps_to_reproduce=steps_to_reproduce,
        ux_rating=ux_rating,
        implementation_id=implementation_id,
        images=json.dumps(saved_paths),
        status="open",
        likes=0,
    )
    db.add(fb)
    
    if db_user_id:
        from app.models.dev_tester_models import DevProfile
        from app.services.gamification_service import add_points_and_level_up
        from app.services.economy_rules import UpzPointsReward
        dev_profile = db.query(DevProfile).filter(DevProfile.user_id == db_user_id).first()
        if dev_profile:
            dev_profile.feedbacks_sent = (dev_profile.feedbacks_sent or 0) + 1
            add_points_and_level_up(db, dev_profile, UpzPointsReward.POST_CREATED, f"Publicou no feed da comunidade: {title[:50]}")
    db.commit()
    db.refresh(fb)

    # Processar menções na descrição do post
    from app.services.mentions_service import process_mentions_and_notify
    author_name = "Alguém"
    if db_user_id and dev_profile:
        author_name = dev_profile.username or dev_profile.name or "Alguém"
    process_mentions_and_notify(db, description, author_name, f"/comunidade/post/{fb.id}", fb.title[:30])

    db.commit()

    return {"success": True, "data": fb.to_dict()}


@router.put("/comunidade/post/{feedback_id}")
async def edit_comunidade_post(
    feedback_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Edita título e descrição de um post existente"""
    user_id = _get_user_id_optional(request)
    form = await request.form()

    fb = db.query(BetaFeedback).filter(BetaFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Post não encontrado")

    # Só o autor pode editar
    if user_id and fb.user_id and str(fb.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Sem permissão para editar este post")

    title = form.get("title")
    description = form.get("description")
    code_snippet = form.get("code_snippet")

    if title is not None:
        fb.title = title
    if description is not None:
        fb.body = description
    if code_snippet is not None:
        fb.code_snippet = code_snippet

    db.commit()
    db.refresh(fb)
    return {"success": True, "data": fb.to_dict()}


@router.delete("/comunidade/post/{feedback_id}")
async def delete_comunidade_post(
    feedback_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Deleta um post da comunidade"""
    user_id = _get_user_id_optional(request)

    fb = db.query(BetaFeedback).filter(BetaFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Post não encontrado")

    # Só o autor pode deletar
    if user_id and fb.user_id and str(fb.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Sem permissão para deletar este post")

    # Remove imagens físicas se existirem
    if fb.images:
        try:
            imgs = json.loads(fb.images) if isinstance(fb.images, str) else fb.images
            for img_path in imgs:
                if img_path.startswith('/uploads/posts/'):
                    fname = img_path.split('/')[-1]
                    full_path = os.path.join(UPLOAD_DIR, fname)
                    if os.path.exists(full_path):
                        os.remove(full_path)
        except Exception:
            pass

    db.delete(fb)
    db.commit()
    return {"success": True, "message": "Post deletado com sucesso"}


class ReviewPostPayload(BaseModel):
    status: str  # "approved" | "reviewed" | "rejected"
    admin_comment: Optional[str] = None
    badge_type: Optional[str] = None  # visao_de_aguia | code_expert | shield_hunter | bug_hunter


# Mapa de pontos por severidade — admin escolhe qual
REVIEW_POINTS_MAP = {
    # bugs
    "bug_minor":    ("BUG_MINOR_APPROVED",    100,   "Bug menor aprovado"),
    "bug_major":    ("BUG_MAJOR_APPROVED",    500,   "Bug grave aprovado"),
    "bug_critical": ("BUG_CRITICAL_APPROVED", 1000,  "Bug crítico aprovado"),
    # anomalias / code_fix / fraude
    "ux":           ("FEEDBACK_UX_APPROVED",  50,    "Sugestão de melhoria aprovada"),
    "anomalia":     ("BUG_MINOR_APPROVED",    100,   "Anomalia técnica aprovada"),
    "fraude":       ("BUG_MAJOR_APPROVED",    500,   "Padrão de fraude reportado e aprovado"),
    "code_fix":     ("FEEDBACK_UX_APPROVED",  50,    "Sugestão de fix aprovada"),
}


@router.patch("/comunidade/post/{feedback_id}/review")
async def review_comunidade_post(
    feedback_id: int,
    payload: ReviewPostPayload,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Admin aprova ou rejeita um report de bug/anomalia e concede UpzPoints automaticamente.
    Requer cookie/header com JWT de admin (sub UUID) ou any JWT para desenvolvimento.
    """
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
        
    from app.models.dev_tester_models import DevProfile
    dev_admin = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev_admin:
        raise HTTPException(status_code=401, detail="Perfil não encontrado")

    fb = db.query(BetaFeedback).filter(BetaFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Post não encontrado")

    is_owner = False
    app = None
    if fb.implementation_id:
        from app.models.beta_product_models import BetaProduct
        app = db.query(BetaProduct).filter(
            (BetaProduct.id == int(fb.implementation_id)) if fb.implementation_id.isdigit() else (BetaProduct.slug == fb.implementation_id)
        ).first()
        if app and app.owner_id == dev_admin.id:
            is_owner = True

    if not dev_admin.is_staff and not is_owner:
        raise HTTPException(status_code=403, detail="Acesso negado: apenas staff ou o dono do aplicativo podem aprovar reports de bugs.")

    if payload.status not in ("approved", "reviewed", "rejected"):
        raise HTTPException(status_code=400, detail="Status inválido. Use: approved, reviewed, rejected")

    fb.status = payload.status
    if payload.admin_comment:
        fb.admin_comment = payload.admin_comment
    if payload.badge_type:
        fb.badge_type = payload.badge_type

    # Só concede pontos ao aprovar
    if payload.status == "approved" and fb.user_id:
        from app.models.dev_tester_models import DevProfile
        from app.services.gamification_service import add_points_and_level_up

        dev_profile = db.query(DevProfile).filter(DevProfile.user_id == fb.user_id).first()
        if dev_profile:
            # Determina a quantidade de pontos pelo tipo do post
            tipo = fb.type or "anomalia"
            if tipo == "bug":
                severity_key = "bug_minor"      # padrão bug → menor
                points = 100
                reason = f"Bug reportado aprovado: {fb.title}"
            elif tipo == "anomalia":
                severity_key = "anomalia"
                points = 100
                reason = f"Anomalia técnica aprovada: {fb.title}"
            elif tipo == "code_fix":
                severity_key = "code_fix"
                points = 50
                reason = f"Sugestão de fix aprovada: {fb.title}"
            elif tipo == "fraude":
                severity_key = "fraude"
                points = 500
                reason = f"Padrão de fraude aprovado: {fb.title}"
            else:
                points = 50
                reason = f"Contribuição aprovada: {fb.title}"

            # Admin pode sobrescrever os pontos via badge_type (badge = severidade)
            if payload.badge_type == "bug_hunter":
                points = 100
                reason = f"Bug reportado aprovado (Bug Hunter): {fb.title}"
            elif payload.badge_type == "shield_hunter":
                points = 500
                reason = f"Fraude/anomalia crítica aprovada (Shield Hunter): {fb.title}"
            elif payload.badge_type == "visao_de_aguia":
                points = 300
                reason = f"Visão técnica aprovada (Visão de Águia): {fb.title}"
            elif payload.badge_type == "code_expert":
                points = 300
                reason = f"Fix de código aprovado (Code Expert): {fb.title}"

            fb.award_points = points
            add_points_and_level_up(db, dev_profile, points, reason)

            # Deduct points from App budget if it's an app
            if app and not dev_admin.is_staff:
                if app.upzpoints_budget and app.upzpoints_budget >= points:
                    app.upzpoints_budget -= points
                else:
                    app.upzpoints_budget = 0 # Prevent negative balance

            # [Plano Item 4] Incrementar estatísticas
            if tipo in ("bug", "code_fix", "fraude", "anomalia"):
                dev_profile.bugs_reported = (dev_profile.bugs_reported or 0) + 1
            else:
                dev_profile.feedbacks_sent = (dev_profile.feedbacks_sent or 0) + 1

            # [Plano Item 3] Badge dinâmica ao Perfil
            if payload.badge_type:
                import json
                try:
                    certs = json.loads(dev_profile.certificates) if dev_profile.certificates else []
                    if not isinstance(certs, list):
                        certs = []
                except:
                    certs = []
                if payload.badge_type not in certs:
                    certs.append(payload.badge_type)
                    dev_profile.certificates = json.dumps(certs)

            # [Plano Item 2] Notificações Pessoais
            from app.models.dev_tester_models import DevNotification
            icon_map = {"bug_hunter": "bug", "shield_hunter": "shield", "code_expert": "code", "visao_de_aguia": "eye"}
            n_icon = icon_map.get(payload.badge_type, "award") if payload.badge_type else "check"
            n_color = "emerald" if points > 100 else "blue"
            
            notif = DevNotification(
                dev_id=dev_profile.user_id,
                title="Relato Aprovado!",
                body=f"Seu reporte '{fb.title[:30]}...' foi aprovado e você ganhou {points} UpzPoints!",
                icon=n_icon,
                color=n_color
            )
            db.add(notif)

    db.commit()
    db.refresh(fb)
    return {
        "success": True,
        "message": f"Post {'aprovado' if payload.status == 'approved' else 'atualizado'} com sucesso",
        "data": fb.to_dict(),
        "points_awarded": fb.award_points if payload.status == "approved" else 0
    }


@router.get("/comunidade/admin/pendentes")
async def get_posts_pendentes(
    request: Request,
    db: Session = Depends(get_db),
):
    """Lista todos os posts aguardando revisão (status=open), para o painel admin."""
    # Simulação básica de verificação de proteção: garante que pelo menos não é público se houver auth
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Não autorizado")
    items = (
        db.query(BetaFeedback)
        .filter(BetaFeedback.type.in_(["bug", "anomalia", "code_fix", "fraude"]))
        .filter(BetaFeedback.status == "open")
        .order_by(BetaFeedback.created_at.desc())
        .all()
    )
    return {
        "success": True,
        "total": len(items),
        "data": [i.to_dict() for i in items]
    }


@router.post("/comunidade/like/{feedback_id}")
async def like_comunidade_post(
    feedback_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Incrementa curtidas/votos úteis e impede duplicidade.
    A identidade vem SEMPRE do JWT autenticado (nunca de query param forjável)."""
    from app.models.beta_feedback_models import BetaFeedbackLike
    from app.models.dev_tester_models import DevProfile

    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Faça login para curtir.")

    profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    fb = db.query(BetaFeedback).filter(BetaFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Relato não encontrado")

    existing_like = db.query(BetaFeedbackLike).filter(
        BetaFeedbackLike.feedback_id == feedback_id,
        BetaFeedbackLike.dev_id == profile.id
    ).first()
    if existing_like:
        return {"success": False, "message": "Você já curtiu este relato."}

    db.add(BetaFeedbackLike(feedback_id=feedback_id, dev_id=profile.id))
    fb.likes = (fb.likes or 0) + 1
    db.commit()
    return {"success": True, "likes": fb.likes}


class CreateCommentPayload(BaseModel):
    body: str
    parent_comment_id: Optional[int] = None
    author_name: Optional[str] = "Dev Tester"
    author_role: Optional[str] = "Developer"

@router.post("/comunidade/post/{feedback_id}/comments")
async def add_comunidade_comment(
    feedback_id: int,
    payload: CreateCommentPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    """Adiciona um comentário a um post da comunidade"""
    from app.models.beta_feedback_models import BetaFeedbackComment
    
    user_id_str = _get_user_id_optional(request)
    user_id = int(user_id_str) if user_id_str and user_id_str.isdigit() else None
    
    fb = db.query(BetaFeedback).filter(BetaFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Relato não encontrado")
        
    comment = BetaFeedbackComment(
        feedback_id=feedback_id,
        user_id=user_id,
        parent_comment_id=payload.parent_comment_id,
        author_name=payload.author_name,
        author_role=payload.author_role,
        body=payload.body,
        is_admin_reply=False # Poderíamos setar True se o auth fosse de admin
    )
    db.add(comment)
    
    # Notificar dono do post
    if fb.user_id and str(fb.user_id) != str(user_id):
        from app.models.dev_tester_models import DevNotification
        notif = DevNotification(
            dev_id=fb.user_id,
            title="Novo Comentário!",
            body=f"{payload.author_name} comentou no seu post '{fb.title[:30]}...'",
            icon="message-circle",
            color="blue"
        )
        db.add(notif)
        
    # Processar menções
    from app.services.mentions_service import process_mentions_and_notify
    process_mentions_and_notify(db, payload.body, payload.author_name, f"/comunidade/post/{fb.id}", fb.title[:30])
        
    db.commit()
    db.refresh(comment)
    
    return {"success": True, "data": comment.to_dict()}


@router.get("/comunidade/post/{feedback_id}/comments")
async def get_comunidade_comments(
    feedback_id: int,
    db: Session = Depends(get_db)
):
    """Lista todos os comentários de um post (retorna lista plana que pode ser construída em árvore no front)"""
    from app.models.beta_feedback_models import BetaFeedbackComment
    
    comments = db.query(BetaFeedbackComment).filter(BetaFeedbackComment.feedback_id == feedback_id).order_by(BetaFeedbackComment.created_at.asc()).all()
    
    return {"success": True, "data": [c.to_dict() for c in comments]}



@router.get("/comunidade/ranking")
async def get_comunidade_ranking(db: Session = Depends(get_db)):
    """Retorna o ranking de desenvolvedores ordenado pelos pontos no banco de dados"""
    from app.models.dev_tester_models import DevProfile
    import json

    # Consulta perfis reais do banco — exclui contas staff do ranking público
    profiles = (
        db.query(DevProfile)
        .filter(DevProfile.is_staff == False)
        .order_by(DevProfile.points.desc())
        .limit(50)
        .all()
    )

    ranking_list = []
    for idx, dev in enumerate(profiles, start=1):
        # Transforma o JSON de certificados em um array de badges (tags visuais)
        try:
            certs = json.loads(dev.certificates)
        except:
            certs = []
            
        badge_tags = certs if len(certs) > 0 else [dev.egolpe_level]
        
        # Pega a soma de contribuições
        total_contributions = (dev.feedbacks_sent or 0) + (dev.bugs_reported or 0)

        ranking_list.append({
            "id": str(dev.id),
            "name": dev.name or "Dev Tester",
            "role": f"Patente: {dev.egolpe_level}",
            "egolpeLevel": dev.egolpe_level,
            "points": dev.points or 0,
            "badges": badge_tags,
            "avatarBg": "from-[#00FF87] to-emerald-600" if idx == 1 else "from-slate-600 to-slate-800",
            "github": dev.github_username or "",
            "location": "Brasil",
            "contributionsCount": total_contributions,
        })

    return {"success": True, "data": ranking_list}


@router.get("/comunidade/notificacoes")
async def get_comunidade_notificacoes(request: Request, dev_id: int = Query(None), db: Session = Depends(get_db)):
    """Retorna notificações pessoais do DevTester"""
    # Identidade autenticada (JWT) tem prioridade sobre o query param.
    user_id = _get_user_id_optional(request)
    if user_id:
        from app.models.dev_tester_models import DevProfile
        profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
        if profile:
            dev_id = profile.id
    if not dev_id:
        return {"success": True, "data": []}

    from app.models.dev_tester_models import DevNotification
    notifs = db.query(DevNotification).filter(DevNotification.dev_id == dev_id).order_by(DevNotification.created_at.desc()).limit(20).all()
    
    return {"success": True, "data": [n.to_dict() for n in notifs]}

@router.put("/comunidade/notificacoes/{notif_id}/read")
async def mark_notification_read(notif_id: int, request: Request, db: Session = Depends(get_db)):
    """Marca a notificação como lida — apenas o dono (via JWT) pode fazê-lo."""
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    from app.models.dev_tester_models import DevNotification, DevProfile
    profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    # Aceita tanto AppUser.id quanto DevProfile.id (semânticas legadas do banco).
    allowed_ids = {int(user_id)}
    if profile:
        allowed_ids.add(profile.id)

    n = db.query(DevNotification).filter(DevNotification.id == notif_id).first()
    if not n or n.dev_id not in allowed_ids:
        # Idempotente e sem vazar existência de notificações alheias.
        return {"success": True}
    n.read = True
    db.commit()
    return {"success": True}


@router.get("/comunidade/version")
async def get_comunidade_version(
    db: Session = Depends(get_db)
):
    """
    Retorna a versão atual do app registrada no painel admin (BetaProduct).
    """
    from app.models.beta_product_models import BetaProduct
    product = db.query(BetaProduct).filter(BetaProduct.slug == "egolpe-beta").first()
    
    return {
        "success": True,
        "version": product.version if product and product.version else "1.0.0"
    }


# ── Feedback Padrão Beta ──────────────────────────────────────────────────────

@router.post("")
async def create_feedback(
    request: Request,
    product_slug: str = Form(...),
    type: str = Form("general"),
    title: str = Form(""),
    body: str = Form(...),
    update_id: Optional[int] = Form(None),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    user_id = _get_user_id(request)

    saved_paths = []
    for img in images:
        if img.filename:
            ext = img.filename.rsplit(".", 1)[-1].lower()
            if ext not in ALLOWED_IMAGE_EXTS:
                continue
            raw = await img.read()
            if len(raw) > MAX_IMAGE_BYTES:
                raise HTTPException(status_code=413, detail="Imagem muito grande (máx. 5MB).")
            fname = f"{uuid.uuid4().hex}.{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            with open(fpath, "wb") as f:
                f.write(raw)
            saved_paths.append(f"/uploads/posts/{fname}")

    fb = BetaFeedback(
        user_id=user_id,
        product_slug=product_slug,
        update_id=update_id,
        type=type,
        title=title or None,
        body=body,
        images=json.dumps(saved_paths),
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"success": True, "data": fb.to_dict()}


@router.get("/{product_slug}")
async def list_my_feedbacks(
    product_slug: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = _get_user_id(request)
    items = (
        db.query(BetaFeedback)
        .filter(BetaFeedback.user_id == user_id, BetaFeedback.product_slug == product_slug)
        .order_by(BetaFeedback.created_at.desc())
        .all()
    )
    return {"success": True, "data": [i.to_dict() for i in items]}


# ── Updates ──────────────────────────────────────────────────────────────────

@updates_router.get("")
async def list_all_updates(
    request: Request,
    db: Session = Depends(get_db),
):
    items = (
        db.query(BetaUpdate)
        .filter(BetaUpdate.is_published == True)
        .order_by(BetaUpdate.created_at.desc())
        .all()
    )
    return {"success": True, "data": [i.to_dict() for i in items]}

@updates_router.get("/{product_slug}")
async def list_updates(
    product_slug: str,
    request: Request,
    db: Session = Depends(get_db),
):
    items = (
        db.query(BetaUpdate)
        .filter(BetaUpdate.product_slug == product_slug, BetaUpdate.is_published == True)
        .order_by(BetaUpdate.created_at.desc())
        .all()
    )
    return {"success": True, "data": [i.to_dict() for i in items]}
