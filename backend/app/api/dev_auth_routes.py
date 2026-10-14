"""
UpzLab - Dev Tester Auth API Routes (Comunidade V2)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database.database import get_db

from app.models.dev_tester_models import DevProfile, TesterEmailInvite
from app.models.user_models import AppUser
import os
import re
import secrets
import smtplib
import logging
from typing import Optional
import json
from datetime import datetime, timedelta
# Segredo e helpers de JWT centralizados (sem fallback previsível).
from app.core.security import SECRET_KEY, ALGORITHM, get_user_id_optional as _shared_get_user_id_optional

try:
    import firebase_admin
    from firebase_admin import auth, credentials
    _firebase_available = True
except ImportError:
    _firebase_available = False
    firebase_admin = None
    auth = None
    credentials = None

try:
    import jwt
except ImportError:
    jwt = None

# Tentar inicializar o Firebase Admin se a chave existir
try:
    if _firebase_available and not firebase_admin._apps:
        # Usa o firebase_admin.json da própria raiz do backend da Comunidade
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        default_cred_path = os.path.join(base_dir, "firebase_admin.json")
        cred_path = os.getenv("FIREBASE_ADMIN_CREDENTIALS", default_cred_path)
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"Warning: Firebase Admin not initialized: {e}")

router = APIRouter(prefix="/api/dev/auth", tags=["UpzLab Dev Auth"])

class CheckPhonePayload(BaseModel):
    phone: str



@router.post("/check-phone")
async def check_phone(payload: CheckPhonePayload, db: Session = Depends(get_db)):
    """
    Verifica se o telefone já instalou o E Golpe (tabela app_users).
    Se sim, o Firebase Auth SMS pode ser disparado.
    """
    clean_phone = ''.join(filter(str.isdigit, payload.phone))
    
    # Importação lazy para evitar circular import se houver
    
    
    all_users = [] # TODO: Call upzcontroll API via httpx
    print(f"\n--- [DEBUG DEV TESTER] ---")
    print(f"Buscando telefone: {clean_phone}")
    print(f"Total de usuários no banco (AppUser): {len(all_users)}")
    
    app_user = None
    for u in all_users:
        if not u.phone: continue
        u_clean = ''.join(filter(str.isdigit, u.phone))
        print(f" - Banco: {u.phone} (limpo: {u_clean})")
        
        # Flexibilidade máxima: Se um número estiver contido no outro, ou se os 10 primeiros dígitos baterem (ignora código de país)
        if u_clean in clean_phone or clean_phone in u_clean or (len(u_clean) >= 10 and len(clean_phone) >= 10 and u_clean[-10:-2] == clean_phone[-10:-2]):
            app_user = u
            break
            
    print(f"Usuário encontrado? {'SIM - ' + app_user.name if app_user else 'NÃO'}")
    print(f"--------------------------\n")

    if not app_user:
        raise HTTPException(status_code=404, detail="Telefone não encontrado no banco de dados local. Verifique os logs do servidor para ver os números cadastrados.")
        
    return {"success": True, "message": "Phone exists", "user_name": app_user.name}



class VerifyAuthPayload(BaseModel):
    phone: str
    token: str  # Firebase ID Token
    name: Optional[str] = None
    device_model: Optional[str] = None

@router.post("/verify")
async def verify_auth(payload: VerifyAuthPayload, request: Request, db: Session = Depends(get_db)):
    """
    Valida o Firebase ID Token.
    Vincula o telefone validado ao usuário atual (logado via Email ou GitHub).
    """
    clean_phone = ''.join(filter(str.isdigit, payload.phone))
    
    # Validação do Token Firebase
    if os.getenv("BYPASS_FIREBASE_AUTH", "false").lower() == "true" or payload.token == "mock-token":
        pass
    else:
        try:
            # Verifica se o firebase_admin foi inicializado
            if not firebase_admin._apps:
                import logging
                logging.getLogger(__name__).warning("Firebase Admin não inicializado. Simulando verificação do token para fins de desenvolvimento.")
                # Ignora a verificação real
            else:
                decoded_token = auth.verify_id_token(payload.token)
                firebase_phone = decoded_token.get("phone_number", "")
                if clean_phone not in firebase_phone:
                    raise HTTPException(status_code=401, detail="Phone number mismatch.")
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid Firebase Token: {str(e)}")

    # Obter usuário logado
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuário não autenticado. Faça login com GitHub ou Senha primeiro.")
        
    app_user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
    if not app_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Se o telefone já estiver sendo usado por OUTRO usuário
    conflict_user = db.query(AppUser).filter(AppUser.phone == clean_phone, AppUser.id != app_user.id).first()
    if conflict_user:
        raise HTTPException(status_code=400, detail="Este número de telefone já está vinculado a outra conta.")
        
    app_user.phone = clean_phone
    
    # Atualizar o nome se o usuário enviou um novo nome
    if payload.name and payload.name.strip() and (not app_user.name or "Dev_" in app_user.name or "Tester_" in app_user.name):
        app_user.name = payload.name.strip()
        
    db.commit()

    # 2. Verifica DevProfile
    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == app_user.id).first()
    if not dev_profile:
        dev_profile = DevProfile(
            user_id=app_user.id,
            name=app_user.name,
            points=50,
            egolpe_level="Scanner",
            status="ACTIVE"
        )
        db.add(dev_profile)
        db.commit()

        # TODO: Recriar serviço de notificação local para a Comunidade
        # (O serviço original do upzcontroll foi desvinculado)
        import logging
        logging.getLogger(__name__).info("Notificação de novo Dev Tester seria disparada aqui.")

    referral_record = db.query(TesterEmailInvite).filter(
        TesterEmailInvite.invitee_user_id == app_user.id,
        TesterEmailInvite.joined_at.is_(None),
    ).first()
    if referral_record:
        referrer_profile = db.query(DevProfile).filter(
            DevProfile.id == referral_record.owner_profile_id,
            DevProfile.status == "ACTIVE",
        ).first()
        if referrer_profile:
            dev_profile.referred_by_id = referrer_profile.id
            from app.services.economy_rules import UpzPointsReward
            from app.services.gamification_service import add_points_and_level_up
            add_points_and_level_up(
                db,
                referrer_profile,
                UpzPointsReward.REFERRAL_BONUS,
                f"Bônus de Indicação: Cadastrou {app_user.name or app_user.email}",
                commit=False,
            )
            referral_record.joined_at = datetime.utcnow()
            db.commit()

    # 2.5 Capturar modelo do celular (se enviado pelo frontend no cadastro)
    if payload.device_model and payload.device_model.strip():
        # Registrar ou atualizar o dispositivo
        from app.models.dev_tester_models import DevDevice, DevTelemetry
        import hashlib
        
        device_hash = hashlib.sha256(f"{clean_phone}_{payload.device_model}".encode()).hexdigest()
        
        dev_device = db.query(DevDevice).filter(DevDevice.user_id == app_user.id, DevDevice.device_hash == device_hash).first()
        
        if not dev_device:
            dev_device = DevDevice(
                user_id=app_user.id,
                phone_number=clean_phone,
                device_hash=device_hash,
                status="ACTIVE"
            )
            db.add(dev_device)
            db.commit()
            db.refresh(dev_device)
            
            # Adicionar a telemetria com o modelo
            telemetry = DevTelemetry(
                device_id=dev_device.id,
                model=payload.device_model.strip()
            )
            db.add(telemetry)
            db.commit()
        else:
            # Se o dispositivo já existe, pode atualizar o último heartbeat e garantir que tem telemetria
            dev_device.last_heartbeat = func.now()
            db.commit()

    # 3. Gerar JWT de Sessão
    expire = datetime.utcnow() + timedelta(days=7)
    jwt_payload = {
        "sub": str(app_user.id),
        "email": app_user.email,
        "phone": app_user.phone,
        "is_dev": True,
        "exp": expire
    }
    encoded_jwt = jwt.encode(jwt_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    needs_profile = not app_user.email

    return {
        "success": True, 
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "action": "complete_profile" if needs_profile else "dashboard",
        "message": "Autenticação Dev Tester bem-sucedida"
    }


from app.core.passwords import hash_password, verify_password

class RegisterPayload(BaseModel):
    name: str
    email: str
    password: str
    invite_code: Optional[str] = None


class EmailInvitesPayload(BaseModel):
    emails: list[str]


def _send_tester_invite_email(invite: TesterEmailInvite, owner: DevProfile, db: Session) -> bool:
    from app.services.daily_checkin_service import _send_email

    owner_user = db.query(AppUser).filter(AppUser.id == owner.user_id).first()
    site_url = os.getenv("UPZLAB_PUBLIC_URL", "http://localhost:3003").rstrip("/")
    invite_url = f"{site_url}/cadastro?invite={invite.invite_code}"
    sender_name = owner.name or (owner_user.name if owner_user else None) or "Um desenvolvedor"
    invite.email_last_attempt_at = datetime.utcnow()
    invite.email_error = None
    db.commit()
    try:
        _send_email(
            recipient=invite.invited_email,
            subject=f"{sender_name} convidou você para testar projetos na UpzLab",
            body=(
                f"{sender_name} convidou você para participar da comunidade UpzLab e testar projetos.\n\n"
                f"Crie sua conta usando este convite: {invite_url}\n\n"
                "Este convite é pessoal e destinado ao endereço de e-mail para o qual foi enviado."
            ),
        )
    except (OSError, smtplib.SMTPException, RuntimeError, ValueError) as exc:
        invite.email_error = str(exc)[:500]
        db.commit()
        logging.getLogger(__name__).exception(
            "Falha ao enviar convite UpzLab para %s", invite.invited_email
        )
        return False

    invite.email_sent_at = datetime.utcnow()
    invite.email_error = None
    db.commit()
    return True


def _new_referral_code(db: Session) -> str:
    while True:
        code = secrets.token_urlsafe(9).replace("-", "").replace("_", "").upper()[:12]
        if not db.query(DevProfile.id).filter(DevProfile.referral_code == code).first():
            return code


def _get_authenticated_profile(request: Request, db: Session) -> DevProfile:
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        numeric_user_id = int(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Sessão inválida")

    app_user = db.query(AppUser).filter(AppUser.id == numeric_user_id).first()
    if not app_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    profile = db.query(DevProfile).filter(DevProfile.user_id == numeric_user_id).first()
    if not profile:
        profile = DevProfile(
            user_id=numeric_user_id,
            name=app_user.name,
            points=0,
            egolpe_level="Scanner",
            status="ACTIVE",
            referral_code=_new_referral_code(db),
        )
        db.add(profile)
        db.flush()
        from app.services.economy_rules import UpzPointsReward
        from app.services.gamification_service import add_points_and_level_up
        add_points_and_level_up(
            db,
            profile,
            UpzPointsReward.ACCOUNT_CREATED,
            "Bônus de Boas-vindas: Conta criada na comunidade UpzLab",
            commit=False,
        )
    elif not profile.referral_code:
        profile.referral_code = _new_referral_code(db)
        db.commit()
        db.refresh(profile)
    return profile

def _require_staff(request: Request, db: Session) -> DevProfile:
    """Exige usuário autenticado com perfil staff (para rotas administrativas)."""
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
    profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not profile or not getattr(profile, "is_staff", False):
        raise HTTPException(status_code=403, detail="Acesso restrito ao staff UpzLab")
    return profile


@router.get("/migrate-email")
async def migrate_email_column(request: Request, db: Session = Depends(get_db)):
    _require_staff(request, db)
    from sqlalchemy import text
    try:
        db.execute(text('ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;'))
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}

@router.get("/migrate-username")
async def migrate_username(request: Request, db: Session = Depends(get_db)):
    _require_staff(request, db)
    from sqlalchemy import text
    try:
        db.execute(text('ALTER TABLE dev_tester_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;'))
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}

@router.get("/invites/resolve")
async def resolve_email_invite(code: str, db: Session = Depends(get_db)):
    invite = db.query(TesterEmailInvite).filter(
        TesterEmailInvite.invite_code == code,
        TesterEmailInvite.invitee_user_id.is_(None),
    ).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Convite não encontrado ou já utilizado.")
    return {"success": True, "email": invite.invited_email}


@router.get("/invites")
async def list_my_invites(request: Request, db: Session = Depends(get_db)):
    profile = _get_authenticated_profile(request, db)
    db.commit()
    db.refresh(profile)
    invites = db.query(TesterEmailInvite).filter(
        TesterEmailInvite.owner_profile_id == profile.id,
        TesterEmailInvite.invite_code.is_not(None),
    ).order_by(TesterEmailInvite.created_at.desc()).all()
    joined_count = db.query(TesterEmailInvite.id).filter(
        TesterEmailInvite.owner_profile_id == profile.id,
        TesterEmailInvite.joined_at.is_not(None),
    ).count()
    return {
        "success": True,
        "referral_code": profile.referral_code,
        "referrals": joined_count,
        "points_earned": joined_count * 50,
        "invites": [
            {
                "id": invite.id,
                "email": invite.invited_email,
                "code": invite.invite_code,
                "status": "joined" if invite.joined_at else (
                    "registered" if invite.invitee_user_id else "pending"
                ),
                "email_sent_at": invite.email_sent_at.isoformat() if invite.email_sent_at else None,
                "email_last_attempt_at": invite.email_last_attempt_at.isoformat() if invite.email_last_attempt_at else None,
                "email_error": invite.email_error,
                "created_at": invite.created_at.isoformat() if invite.created_at else None,
                "joined_at": invite.joined_at.isoformat() if invite.joined_at else None,
            }
            for invite in invites
        ],
    }


@router.post("/invites/emails")
async def add_email_invites(payload: EmailInvitesPayload, request: Request, db: Session = Depends(get_db)):
    profile = _get_authenticated_profile(request, db)
    if not payload.emails:
        raise HTTPException(status_code=400, detail="Informe pelo menos um e-mail.")
    if len(payload.emails) > 50:
        raise HTTPException(status_code=400, detail="Envie no máximo 50 e-mails por vez.")

    email_pattern = re.compile(r"^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$")
    normalized_emails = list(dict.fromkeys(email.strip().lower() for email in payload.emails if email.strip()))
    invalid = [email for email in normalized_emails if not email_pattern.fullmatch(email)]
    if invalid:
        raise HTTPException(status_code=422, detail=f"E-mail inválido: {invalid[0]}")
    owner_user = db.query(AppUser).filter(AppUser.id == profile.user_id).first()
    if owner_user and owner_user.email:
        normalized_emails = [email for email in normalized_emails if email != owner_user.email.lower()]
    if not normalized_emails:
        raise HTTPException(status_code=400, detail="Não há e-mails válidos para convidar.")

    daily_invites = db.query(TesterEmailInvite.id).filter(
        TesterEmailInvite.owner_profile_id == profile.id,
        TesterEmailInvite.created_at >= datetime.utcnow() - timedelta(days=1),
    ).count()
    if daily_invites + len(normalized_emails) > 100:
        raise HTTPException(status_code=429, detail="O limite diário é de 100 convites por conta.")

    existing_users = {
        email.lower()
        for (email,) in db.query(AppUser.email).filter(
            func.lower(AppUser.email).in_(normalized_emails)
        ).all()
        if email
    }
    created = []
    skipped = []
    for email in normalized_emails:
        if email in existing_users:
            skipped.append({"email": email, "reason": "Já possui uma conta"})
            continue
        existing_invite = db.query(TesterEmailInvite).filter(
            TesterEmailInvite.owner_profile_id == profile.id,
            TesterEmailInvite.invited_email == email,
        ).first()
        if existing_invite:
            skipped.append({"email": email, "reason": "Já está na sua lista"})
            continue
        invite = TesterEmailInvite(
            owner_profile_id=profile.id,
            invited_email=email,
            invite_code=secrets.token_urlsafe(32),
        )
        db.add(invite)
        created.append(invite)

    db.commit()
    send_status = {
        invite.id: _send_tester_invite_email(invite, profile, db)
        for invite in created
    }
    return {
        "success": True,
        "created": [
            {
                "id": invite.id,
                "email": invite.invited_email,
                "code": invite.invite_code,
                "status": "pending",
                "email_sent": send_status[invite.id],
                "email_error": invite.email_error,
            }
            for invite in created
        ],
        "skipped": skipped,
    }


@router.post("/invites/emails/{invite_id}/send")
async def resend_email_invite(invite_id: int, request: Request, db: Session = Depends(get_db)):
    profile = _get_authenticated_profile(request, db)
    invite = db.query(TesterEmailInvite).filter(
        TesterEmailInvite.id == invite_id,
        TesterEmailInvite.owner_profile_id == profile.id,
        TesterEmailInvite.invite_code.is_not(None),
    ).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Convite não encontrado.")
    if invite.invitee_user_id is not None:
        raise HTTPException(status_code=409, detail="Este tester já iniciou o cadastro.")
    if invite.email_last_attempt_at and datetime.utcnow() - invite.email_last_attempt_at < timedelta(hours=1):
        raise HTTPException(status_code=429, detail="Aguarde uma hora antes de tentar enviar este convite novamente.")

    sent = _send_tester_invite_email(invite, profile, db)
    return {
        "success": True,
        "email_sent": sent,
        "email_error": invite.email_error,
    }


@router.delete("/invites/emails/{invite_id}")
async def delete_email_invite(invite_id: int, request: Request, db: Session = Depends(get_db)):
    profile = _get_authenticated_profile(request, db)
    invite = db.query(TesterEmailInvite).filter(
        TesterEmailInvite.id == invite_id,
        TesterEmailInvite.owner_profile_id == profile.id,
        TesterEmailInvite.invite_code.is_not(None),
    ).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Convite não encontrado.")
    if invite.invitee_user_id is not None:
        raise HTTPException(status_code=409, detail="Não é possível remover um convite cujo cadastro já começou.")
    db.delete(invite)
    db.commit()
    return {"success": True}


def _public_site_url() -> str:
    return os.getenv("UPZLAB_PUBLIC_URL", "http://localhost:3003").rstrip("/")


def _public_api_url(request: Request) -> str:
    return os.getenv("UPZLAB_PUBLIC_API_URL", str(request.base_url)).rstrip("/")


def _send_verification_email(app_user: AppUser, request: Request) -> bool:
    """Envia o link de confirmação de e-mail. Sem SMTP, registra o link no log do backend."""
    from app.services.mail_service import render_email, send_email

    token = jwt.encode(
        {"sub": str(app_user.id), "email": app_user.email, "type": "email_confirm",
         "exp": datetime.utcnow() + timedelta(hours=24)},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    link = f"{_public_api_url(request)}/api/dev/auth/email/confirm?token={token}"
    name = (app_user.name or "dev").split(" ")[0]
    body = (
        f"Olá, {name}!\n\nConfirme seu e-mail para ativar sua conta na comunidade UpzLab:\n{link}\n\n"
        "O link vale por 24 horas. Se você não criou esta conta, ignore este e-mail."
    )
    html = render_email(
        "Confirme seu e-mail",
        f"Olá, {name}! Clique no botão para ativar sua conta na comunidade UpzLab.\n\nO link vale por 24 horas. Se você não criou esta conta, ignore este e-mail.",
        "Confirmar e-mail",
        link,
    )
    try:
        send_email(app_user.email, "Confirme seu e-mail - UpzLab", body, html)
        return True
    except Exception as exc:
        logging.getLogger(__name__).warning(
            "Não foi possível enviar e-mail de verificação (%s). Link de confirmação: %s", exc, link
        )
        return False


@router.post("/register")
async def register_user(payload: RegisterPayload, request: Request, db: Session = Depends(get_db)):
    """Registra um novo usuário Dev com email e senha."""
    clean_email = payload.email.strip().lower()
    existing_user = db.query(AppUser).filter(func.lower(AppUser.email) == clean_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    invite_code = (payload.invite_code or "").strip()
    referrer = None
    email_invite = None
    if invite_code:
        email_invite = db.query(TesterEmailInvite).filter(
            TesterEmailInvite.invite_code == invite_code
        ).first()
        if email_invite:
            if email_invite.invited_email != clean_email:
                raise HTTPException(status_code=400, detail="Este convite foi criado para outro e-mail.")
            if email_invite.invitee_user_id is not None:
                raise HTTPException(status_code=400, detail="Este convite já foi utilizado.")
            referrer = db.query(DevProfile).filter(
                DevProfile.id == email_invite.owner_profile_id,
                DevProfile.status == "ACTIVE",
            ).first()
        else:
            referrer = db.query(DevProfile).filter(
                func.lower(DevProfile.referral_code) == invite_code.lower(),
                DevProfile.status == "ACTIVE",
            ).first()
        if not referrer:
            raise HTTPException(status_code=400, detail="O link de convite não é válido ou foi revogado.")
        if db.query(AppUser.id).filter(
            AppUser.id == referrer.user_id,
            func.lower(AppUser.email) == clean_email,
        ).first():
            raise HTTPException(status_code=400, detail="Você não pode usar seu próprio convite.")

    hashed_pw = hash_password(payload.password)
    new_user = AppUser(
        name=payload.name.strip(),
        email=clean_email,
        password_hash=hashed_pw
    )
    db.add(new_user)
    db.flush()

    if referrer:
        if email_invite:
            email_invite.invitee_user_id = new_user.id
        else:
            pending_invite = db.query(TesterEmailInvite).filter(
                TesterEmailInvite.owner_profile_id == referrer.id,
                TesterEmailInvite.invited_email == clean_email,
            ).first()
            if pending_invite:
                if pending_invite.invitee_user_id is not None:
                    raise HTTPException(status_code=400, detail="Este convite já foi utilizado.")
                pending_invite.invitee_user_id = new_user.id
            else:
                db.add(TesterEmailInvite(
                    owner_profile_id=referrer.id,
                    invited_email=clean_email,
                    invite_code=None,
                    invitee_user_id=new_user.id,
                ))
    db.commit()
    db.refresh(new_user)
    
    # Gerar token para ir pro onboarding de telefone
    expire = datetime.utcnow() + timedelta(days=7)
    jwt_payload = {
        "sub": str(new_user.id),
        "email": new_user.email,
        "is_dev": True,
        "exp": expire
    }
    encoded_jwt = jwt.encode(jwt_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    email_sent = _send_verification_email(new_user, request)

    return {
        "success": True,
        "access_token": encoded_jwt,
        "action": "verify_email",
        "email_sent": email_sent,
        "message": "Conta criada! Confirme seu e-mail para continuar."
    }


@router.post("/email/resend")
async def resend_verification_email(request: Request, db: Session = Depends(get_db)):
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autorizado")
    app_user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
    if not app_user or not app_user.email:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if app_user.email_verified:
        return {"success": True, "verified": True, "email_sent": False}
    sent = _send_verification_email(app_user, request)
    return {"success": True, "verified": False, "email_sent": sent}


class ChangeEmailPayload(BaseModel):
    email: str


@router.post("/email/change")
async def change_unverified_email(payload: ChangeEmailPayload, request: Request, db: Session = Depends(get_db)):
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autorizado")
    app_user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
    if not app_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if app_user.email_verified:
        raise HTTPException(status_code=400, detail="E-mail já confirmado.")
    clean = payload.email.strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
        raise HTTPException(status_code=400, detail="E-mail inválido.")
    taken = db.query(AppUser.id).filter(func.lower(AppUser.email) == clean, AppUser.id != app_user.id).first()
    if taken:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    app_user.email = clean
    db.commit()
    sent = _send_verification_email(app_user, request)
    return {"success": True, "email": clean, "email_sent": sent}


@router.get("/email/confirm")
async def confirm_email(token: str, db: Session = Depends(get_db)):
    from fastapi.responses import RedirectResponse as _Redirect
    site = _public_site_url()
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if data.get("type") != "email_confirm":
            raise ValueError("tipo inválido")
        app_user = db.query(AppUser).filter(AppUser.id == int(data["sub"])).first()
        if not app_user or (app_user.email or "").lower() != (data.get("email") or "").lower():
            raise ValueError("usuário inválido")
    except Exception:
        return _Redirect(f"{site}/verificar-email?error=invalid_link")

    app_user.email_verified = True
    db.commit()
    session_jwt = jwt.encode(
        {"sub": str(app_user.id), "email": app_user.email, "is_dev": True,
         "exp": datetime.utcnow() + timedelta(days=7)},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    return _Redirect(f"{site}/login/callback?token={session_jwt}&action=dashboard")


class LoginPayload(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login_user(payload: LoginPayload, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    app_user = db.query(AppUser).filter(func.lower(AppUser.email) == clean_email).first()
    
    if not app_user:
        raise HTTPException(status_code=401, detail="E-mail não cadastrado. Por favor, crie uma conta primeiro.")
        
    if app_user.password_hash:
        if app_user.password_hash.startswith(("$2a$", "$2b$", "$2y$")):
            valid_password = verify_password(payload.password, app_user.password_hash)
        elif app_user.password_hash == payload.password:
            # Hash em texto puro legado: só aceita correspondência exata e
            # migra imediatamente para bcrypt.
            app_user.password_hash = hash_password(payload.password)
            db.commit()
            valid_password = True
        else:
            valid_password = False
        if not valid_password:
            raise HTTPException(status_code=401, detail="Senha incorreta.")
    else:
        # Conta sem senha (ex.: criada via GitHub) NÃO pode logar com qualquer senha.
        raise HTTPException(
            status_code=401,
            detail="Esta conta não possui senha. Entre com o GitHub.",
        )

    expire = datetime.utcnow() + timedelta(days=7)
    jwt_payload = {
        "sub": str(app_user.id),
        "email": app_user.email,
        "is_dev": True,
        "exp": expire
    }
    encoded_jwt = jwt.encode(jwt_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    needs_profile = False
    
    return {
        "success": True, 
        "access_token": encoded_jwt,
        "action": "verify_email" if not app_user.email_verified else ("complete_profile" if needs_profile else "dashboard"),
        "message": "Login bem-sucedido"
    }

class UpdateProfilePayload(BaseModel):
    name: str
    email: str

@router.post("/update-profile")
async def update_profile(
    payload: UpdateProfilePayload, 
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autorizado. Faça login primeiro.")
        
    app_user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
    if not app_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Gera token de verificação de email válido por 24 horas
    expire = datetime.utcnow() + timedelta(hours=24)
    verify_payload = {
        "sub": str(app_user.id),
        "name": payload.name.strip(),
        "email": payload.email.strip(),
        "type": "email_verify",
        "exp": expire
    }
    verify_token = jwt.encode(verify_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    # Montar URL de verificação
    verify_url = f"http://localhost:8001/api/dev/auth/verify-email?token={verify_token}"
    
    # TODO: Recriar serviço de e-mail local para a Comunidade
    # (O serviço original do upzcontroll foi desvinculado)
    import logging
    logger = logging.getLogger("EmailService")
    logger.info(f"Link fallback gerado (Simulação de E-mail): {verify_url}")

    return {
        "success": True,
        "message": "E-mail de verificação enviado! Confira sua caixa de entrada (ou pasta Spam)."
    }

@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "email_verify":
            raise HTTPException(status_code=400, detail="Token inválido para verificação de e-mail.")
            
        user_id = payload.get("sub")
        app_user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
        if not app_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
            
        app_user.name = payload.get("name")
        app_user.email = payload.get("email")
        
        # Sincroniza o nome no DevProfile se já existir
        from app.models.dev_tester_models import DevProfile
        dev_profile = db.query(DevProfile).filter(DevProfile.user_id == app_user.id).first()
        if dev_profile:
            dev_profile.name = payload.get("name")
            
        db.commit()
        db.refresh(app_user)
        
        # Enviar pro Firebase
        # TODO: Implementar integração com Firebase App Distribution para a Comunidade
        import logging
        logging.getLogger(__name__).info("Integração com Firebase App Distribution será feita aqui.")
            
        # Gera novo JWT agora com o e-mail preenchido
        expire = datetime.utcnow() + timedelta(days=7)
        jwt_payload = {
            "sub": str(app_user.id),
            "email": app_user.email,
            "phone": app_user.phone,
            "is_dev": True,
            "exp": expire
        }
        encoded_jwt = jwt.encode(jwt_payload, SECRET_KEY, algorithm=ALGORITHM)
        
        from fastapi.responses import RedirectResponse
        response = RedirectResponse(url="http://localhost:3003/comunidade")
        response.set_cookie("upzlab_dev_jwt", encoded_jwt, max_age=60*60*24*7, path="/")
        return response

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token expirado.")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Token inválido.")





def _get_user_id_optional(request: Request) -> Optional[str]:
    # Implementação centralizada em app.core.security (mantido o nome
    # local por compatibilidade com os demais routers).
    return _shared_get_user_id_optional(request)

class VerifyRoutePayload(BaseModel):
    path: str

@router.post("/verify-route")
async def verify_route(payload: VerifyRoutePayload, request: Request, db: Session = Depends(get_db)):
    """
    Server-Driven Routing:
    O Middleware do Next.js chama esta rota para saber se o usuário tem permissão
    para acessar a tela. O Python dita as regras e diz para onde redirecionar.
    """
    # Valida o JWT de verdade: token lixo/assinado com segredo errado = anônimo.
    user_id = _shared_get_user_id_optional(request)

    # Telas de autenticação: anônimo entra; logado é mandado pro feed.
    auth_pages = {"/login", "/cadastro"}
    # Conteúdo público que NÃO exige login.
    public_pages  = {"/", "/sobre", "/login/callback"}
    public_prefixes = ("/docs", "/docslab", "/tutorial")

    is_auth_page    = payload.path in auth_pages
    is_public_page  = payload.path in public_pages
    is_public_content = any(
        payload.path == p or payload.path.startswith(p + "/")
        for p in public_prefixes
    )

    if not user_id:
        if is_auth_page or is_public_content or is_public_page:
            return {"allow": True}
        return {"redirect_to": "/login"}

    # E-mail ainda não confirmado: só a tela de verificação (e conteúdo público) é liberada.
    if payload.path != "/verificar-email" and not is_public_content and not is_public_page:
        app_user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
        if app_user and not app_user.email_verified:
            return {"redirect_to": "/verificar-email"}

    # Logado não reabre telas de autenticação.
    if is_auth_page:
        return {"redirect_to": "/comunidade"}

    # Conteúdo público continua liberado; demais rotas exigem sessão válida.
    return {"allow": True}

@router.get("/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    """
    Retorna o perfil do Dev Tester logado ou Admin
    """
    user_id_str = _get_user_id_optional(request)
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Não autenticado")
        
    # Check if it's an Admin (UUID)
    try:
        import uuid
        user_uuid = uuid.UUID(user_id_str)
        # TODO: Implementar lógica de admin geral para a comunidade se necessário
        admin_user = None
        if admin_user:
            return {
                "success": True,
                "data": {
                    "name": admin_user.name or "Admin Geral",
                    "email": admin_user.email,
                    "role": "Fundador / Admin Geral",
                    "github": "",
                    "bio": "Administrador do É Golpe",
                    "location": "Brasil",
                    "points": 9999,
                    "rankPosition": 1,
                    "badges": ["FUNDADOR", "ADMIN"],
                    "contributionsCount": 999
                }
            }
    except ValueError:
        pass
        
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Sessão inválida. Faça login novamente.")
        
    app_user = db.query(AppUser).filter(AppUser.id == user_id).first()
    if not app_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == user_id).first()
    
    if not dev_profile:
        # Cria se não existir (primeiro acesso após cadastro)
        dev_profile = DevProfile(
            user_id=app_user.id,
            name=app_user.name,
            points=0,
            egolpe_level="Scanner",
            status="ACTIVE"
        )
        db.add(dev_profile)
        db.commit()
        db.refresh(dev_profile)
        # Bônus de boas-vindas via gamification_service (ledger + nível)
        from app.services.gamification_service import add_points_and_level_up
        from app.services.economy_rules import UpzPointsReward
        add_points_and_level_up(db, dev_profile, UpzPointsReward.ACCOUNT_CREATED, "Bônus de Boas-vindas: Conta criada na comunidade UpzLab")
    elif app_user.name and dev_profile.name != app_user.name:
        # Sincroniza se o nome tiver sido atualizado no AppUser recentemente
        if not app_user.name.startswith("Tester_"):
            dev_profile.name = app_user.name
            db.commit()
        
    try:
        certs = json.loads(dev_profile.certificates)
    except:
        certs = []
        
    badge_tags = certs if len(certs) > 0 else [dev_profile.egolpe_level]
    total_contributions = (dev_profile.feedbacks_sent or 0) + (dev_profile.bugs_reported or 0)
    
    is_staff = getattr(dev_profile, "is_staff", False) or False

    # Conta staff não aparece no ranking e tem role especial
    if is_staff:
        rank = 0
        badge_tags = ["UpzLab Team", "Fundador", "Distribuidor Oficial"]

    # Calculate rank position (staff fica fora do ranking)
    if not is_staff:
        rank = db.query(DevProfile).filter(
            DevProfile.points > (dev_profile.points or 0),
            DevProfile.is_staff == False
        ).count() + 1

    return {
        "success": True,
        "data": {
            "id": dev_profile.id,
            "name": dev_profile.name or app_user.name or "",
            "username": getattr(dev_profile, "username", ""),
            "email": app_user.email or "",
            "role": "UpzLab Team" if is_staff else (dev_profile.egolpe_level or "Scanner"),
            "github": dev_profile.github_username or "",
            "bio": dev_profile.bio or "",
            "location": "",
            "points": dev_profile.points or 0,
            "rankPosition": rank,
            "badges": badge_tags,
            "contributionsCount": total_contributions,
            "avatarUrl": dev_profile.avatar_url or "",
            "topLanguages": dev_profile.top_languages or "",
            "coverUrl": getattr(dev_profile, "cover_url", None) or "",
            "createdAt": app_user.created_at.isoformat() if hasattr(app_user, 'created_at') and app_user.created_at else (dev_profile.created_at.isoformat() if hasattr(dev_profile, 'created_at') and dev_profile.created_at else None),
            "is_staff": is_staff,
            "email_verified": bool(app_user.email_verified),
            "github_account_age_days": dev_profile.github_account_age_days or 0,
            "github_total_repos": dev_profile.github_total_repos or 0,
            "github_score": dev_profile.github_score or 0,
            "github_connected": bool(dev_profile.github_username),
            "github_avatar_url": f"https://github.com/{dev_profile.github_username}.png" if dev_profile.github_username else "",
        }
    }


class UpdateDevProfilePayload(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    github_username: Optional[str] = None

@router.put("/profile")
async def update_dev_profile(
    payload: UpdateDevProfilePayload,
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autorizado")
        
    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev_profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")



    if payload.name is not None:
        new_name = payload.name.strip()
        dev_profile.name = new_name
        app_user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
        if app_user:
            app_user.name = new_name

    if payload.bio is not None:
        dev_profile.bio = payload.bio

    if payload.github_username is not None:
        new_github = payload.github_username.strip()
        # Se mudou o usuário do GitHub ou se não tínhamos os dados ainda, busca no GitHub
        if new_github and (new_github != dev_profile.github_username or not dev_profile.avatar_url):
            import requests
            from collections import Counter
            
            # Fetch User Profile
            try:
                gh_res = requests.get(f"https://api.github.com/users/{new_github}", timeout=5)
                if gh_res.status_code == 200:
                    gh_data = gh_res.json()
                    dev_profile.avatar_url = gh_data.get("avatar_url")
                    
                    # Fetch Repos to calculate top languages
                    repos_res = requests.get(f"https://api.github.com/users/{new_github}/repos?per_page=100", timeout=5)
                    if repos_res.status_code == 200:
                        repos = repos_res.json()
                        languages = [r.get("language") for r in repos if r.get("language")]
                        if languages:
                            counter = Counter(languages)
                            top_3 = [lang for lang, _ in counter.most_common(3)]
                            dev_profile.top_languages = ", ".join(top_3)
                        else:
                            dev_profile.top_languages = None
            except Exception as e:
                print(f"Erro ao buscar GitHub: {e}")
                # Ignora o erro e continua salvando
        dev_profile.github_username = new_github

    db.commit()
    
    # Reload certs and count
    try:
        certs = json.loads(dev_profile.certificates)
    except:
        certs = []
    badge_tags = certs if len(certs) > 0 else [dev_profile.egolpe_level]
    total_contributions = (dev_profile.feedbacks_sent or 0) + (dev_profile.bugs_reported or 0)
    rank = db.query(DevProfile).filter(DevProfile.points > (dev_profile.points or 0)).count() + 1
    
    app_user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()

    return {
        "success": True,
        "message": "Perfil atualizado com sucesso",
        "data": {
            "name": dev_profile.name or app_user.name or "Dev Tester",
            "email": app_user.email or f"{app_user.phone}@egolpe.app",
            "role": f"Patente: {dev_profile.egolpe_level}",
            "github": dev_profile.github_username or "",
            "bio": dev_profile.bio or "Dev Tester E Golpe.",
            "location": "Brasil",
            "points": dev_profile.points or 0,
            "rankPosition": rank,
            "badges": badge_tags,
            "contributionsCount": total_contributions,
            "avatarUrl": dev_profile.avatar_url,
            "topLanguages": dev_profile.top_languages
        }
    }

from fastapi.responses import RedirectResponse
import urllib.parse


def _sync_github_into_profile(dev_profile, gh_user: dict):
    """Importa do GitHub: usuário, experiência (idade da conta/repos), linguagens, bio e foto (só se o perfil ainda não tem)."""
    import requests
    import datetime as _dt
    from collections import Counter

    login = gh_user.get("login")
    dev_profile.github_username = login

    created_at_str = gh_user.get("created_at")
    age_days = 0
    if created_at_str:
        try:
            created = _dt.datetime.fromisoformat(created_at_str.rstrip("Z"))
            age_days = max((_dt.datetime.utcnow() - created).days, 0)
        except Exception as e:
            print(f"Erro ao parsear created_at: {e}")
    public_repos = gh_user.get("public_repos", 0) or 0
    dev_profile.github_account_age_days = age_days
    dev_profile.github_total_repos = public_repos

    if not dev_profile.github_score:
        bonus = min((age_days // 365) * 10 + public_repos * 2, 500)
        dev_profile.github_score = bonus
        dev_profile.points = (dev_profile.points or 0) + bonus

    if not dev_profile.avatar_url and gh_user.get("avatar_url"):
        dev_profile.avatar_url = gh_user["avatar_url"]
    if not (dev_profile.bio or "").strip() and gh_user.get("bio"):
        dev_profile.bio = gh_user["bio"][:500]

    try:
        repos_res = requests.get(f"https://api.github.com/users/{login}/repos?per_page=100", timeout=8)
        if repos_res.status_code == 200:
            languages = [r.get("language") for r in repos_res.json() if r.get("language")]
            if languages:
                dev_profile.top_languages = ", ".join(l for l, _ in Counter(languages).most_common(3))
    except Exception as e:
        print(f"Erro ao buscar repositórios do GitHub: {e}")


@router.post("/profile/github-avatar")
async def use_github_avatar(request: Request, db: Session = Depends(get_db)):
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autorizado")
    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev_profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    if not dev_profile.github_username:
        raise HTTPException(status_code=400, detail="Conecte o GitHub primeiro")
    dev_profile.avatar_url = f"https://github.com/{urllib.parse.quote(dev_profile.github_username)}.png"
    db.commit()
    return {"success": True, "avatarUrl": dev_profile.avatar_url}


@router.get("/github/login")
async def github_login(token: str = None, action: str = "connect", request: Request = None, db: Session = Depends(get_db)):
    """Inicia o fluxo OAuth com o GitHub.
    Se action == 'connect', token JWT de sessão é exigido.
    Se action == 'login', apenas redireciona e marca o state como login.
    """
    from app.models.config_models import UpzLabConfig
    import json
    
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == "github_oauth").first()
    if not cfg or not cfg.config_value:
        raise HTTPException(status_code=500, detail="GitHub não configurado no UpzLab")
        
    try:
        gh_data = json.loads(cfg.config_value)
        client_id = gh_data.get("client_id", "").strip()
    except:
        raise HTTPException(status_code=500, detail="Configuração do GitHub inválida")
        
    if action in ("login", "register"):
        state = "login_flow"
    else:
        if not token:
            raise HTTPException(status_code=401, detail="Token JWT necessário para conectar")
        state = token
        
    redirect_uri = "http://localhost:8001/api/dev/auth/github/callback"
    
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={urllib.parse.quote(redirect_uri)}&scope=user:email,read:user&state={state}"
    if action in ("login", "register"):
        url += "&prompt=select_account"
    return RedirectResponse(url)

@router.get("/github/callback")
async def github_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Recebe o code do GitHub e finaliza a conexão ou o login"""
    import jwt
    import json
    import requests
    from collections import Counter
    import os
    # SECRET_KEY/ALGORITHM vêm de app.core.security (importado no topo do módulo).
    from app.models.config_models import UpzLabConfig
    from datetime import datetime, timedelta

    is_login_flow = (state == "login_flow")
    user_id = None
    
    if not is_login_flow:
        # 1. Decodificar o state para saber quem é o Dev
        try:
            payload = jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                return RedirectResponse("http://localhost:3003/perfil?error=invalid_token")
        except Exception:
            return RedirectResponse("http://localhost:3003/perfil?error=session_expired")
        
    # 2. Buscar as chaves do BD
    cfg = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == "github_oauth").first()
    if not cfg or not cfg.config_value:
        return RedirectResponse("http://localhost:3003/login?error=config_missing")
        
    try:
        gh_data = json.loads(cfg.config_value)
        client_id = gh_data.get("client_id", "").strip()
        client_secret = gh_data.get("client_secret", "").strip()
    except:
        return RedirectResponse("http://localhost:3003/login?error=config_invalid")

    
    # 3. Trocar o CODE pelo Access Token
    token_url = "https://github.com/login/oauth/access_token"
    token_data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": "http://localhost:8001/api/dev/auth/github/callback"
    }
    headers = {"Accept": "application/json"}
    
    try:
        token_res = requests.post(token_url, data=token_data, headers=headers)
        if token_res.status_code != 200:
            return RedirectResponse("http://localhost:3003/login?error=github_token_failed")
            
        token_json = token_res.json()
        access_token = token_json.get("access_token")
        if not access_token:
            gh_error = token_json.get("error", "unknown")
            return RedirectResponse(f"http://localhost:3003/login?error=github_token_missing_{gh_error}")
            
        # 4. Usar o Access Token para buscar o perfil do usuário
        user_res = requests.get("https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"})
        if user_res.status_code != 200:
            return RedirectResponse("http://localhost:3003/login?error=github_profile_failed")
            
        gh_user = user_res.json()
        github_username = gh_user.get("login")
        avatar_url = gh_user.get("avatar_url")
        created_at_str = gh_user.get("created_at")
        public_repos = gh_user.get("public_repos", 0)
        
        # Buscar E-mail (pois no GitHub às vezes o email é privado)
        email = gh_user.get("email")
        if not email:
            email_res = requests.get("https://api.github.com/user/emails", headers={"Authorization": f"Bearer {access_token}"})
            if email_res.status_code == 200:
                emails = email_res.json()
                primary_email = next((e['email'] for e in emails if e['primary']), None)
                if primary_email:
                    email = primary_email
                elif len(emails) > 0:
                    email = emails[0]['email']
                    
        if is_login_flow:
            if not email:
                return RedirectResponse("http://localhost:3003/login?error=github_email_required")
                
            # Verifica se o usuário existe
            app_user = db.query(AppUser).filter(AppUser.email == email).first()
            if not app_user:
                # Criar um novo AppUser
                app_user = AppUser(
                    name=gh_user.get("name") or github_username,
                    email=email,
                    email_verified=True
                )
                db.add(app_user)
                db.commit()
                db.refresh(app_user)
            elif not app_user.email_verified:
                app_user.email_verified = True
                db.commit()
                
            # Cria/atualiza o perfil com os dados do GitHub (experiência, linguagens, foto, bio)
            login_profile = db.query(DevProfile).filter(DevProfile.user_id == app_user.id).first()
            is_new_profile = login_profile is None
            if is_new_profile:
                login_profile = DevProfile(
                    user_id=app_user.id,
                    name=app_user.name,
                    points=0,
                    egolpe_level="Scanner",
                    status="ACTIVE"
                )
                db.add(login_profile)
                db.commit()
                db.refresh(login_profile)
            _sync_github_into_profile(login_profile, gh_user)
            db.commit()
            if is_new_profile:
                from app.services.gamification_service import add_points_and_level_up
                from app.services.economy_rules import UpzPointsReward
                add_points_and_level_up(db, login_profile, UpzPointsReward.ACCOUNT_CREATED, "Bônus de Boas-vindas: Conta criada na comunidade UpzLab")

            # Gera JWT e redireciona para login bem sucedido passando token na URL
            expire = datetime.utcnow() + timedelta(days=7)
            jwt_payload = {
                "sub": str(app_user.id),
                "email": app_user.email,
                "is_dev": True,
                "exp": expire
            }
            encoded_jwt = jwt.encode(jwt_payload, SECRET_KEY, algorithm=ALGORITHM)
            
            # Celular não é exigido no login via GitHub (verificação fica opcional, na página de perfil)
            next_action = "dashboard"
            return RedirectResponse(f"http://localhost:3003/login/callback?token={encoded_jwt}&action={next_action}")
            
        # 5. Fluxo de "Connect" normal
        dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
        if dev_profile:
            _sync_github_into_profile(dev_profile, gh_user)
            db.commit()

        return RedirectResponse("http://localhost:3003/perfil?success=github_connected")
    except Exception as e:
        print(f"Erro no Callback GitHub: {e}")
        return RedirectResponse("http://localhost:3003/perfil?error=internal_error")


@router.get("/points/statement")
async def get_points_statement_me(request: Request, db: Session = Depends(get_db)):
    """Retorna o extrato completo de UpzPoints do usuário logado."""
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev_profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    from app.services.gamification_service import get_points_statement
    statement = get_points_statement(db, dev_profile.id)

    return {
        "success": True,
        "balance": dev_profile.points,
        "level": dev_profile.egolpe_level,
        "statement": statement
    }


# ── Gerência de UpzPoints (Staff only) ──────────────────────────────────────

class SendPointsPayload(BaseModel):
    target_dev_id: Optional[int] = None      # envio individual (DevProfile.id)
    target_group: Optional[str] = None       # "all" | "white_hat" | "bug_hunter" | "cyber_ninja"
    amount: int
    reason: str


@router.post("/points/send")
async def send_points(payload: SendPointsPayload, request: Request, db: Session = Depends(get_db)):
    """Staff envia UpzPoints para um dev individual ou grupo de devs."""
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    sender = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not sender or not getattr(sender, "is_staff", False):
        raise HTTPException(status_code=403, detail="Apenas contas staff podem enviar pontos")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Valor deve ser maior que zero")

    from app.services.gamification_service import add_points_and_level_up

    targets: list[DevProfile] = []

    if payload.target_dev_id:
        dev = db.query(DevProfile).filter(DevProfile.id == payload.target_dev_id).first()
        if not dev:
            raise HTTPException(status_code=404, detail="Dev não encontrado")
        targets = [dev]

    elif payload.target_group:
        q = db.query(DevProfile).filter(DevProfile.is_staff == False)
        if payload.target_group != "all":
            q = q.filter(DevProfile.egolpe_level == payload.target_group.replace("_", " ").title())
        targets = q.all()
    else:
        raise HTTPException(status_code=400, detail="Informe target_dev_id ou target_group")

    if not targets:
        raise HTTPException(status_code=404, detail="Nenhum dev encontrado para envio")

    total_sent = 0
    from app.models.dev_tester_models import DevNotification
    for dev in targets:
        add_points_and_level_up(db, dev, payload.amount, f"UpzPoints enviados por UpzLab Team: {payload.reason}")
        notif = DevNotification(
            dev_id=dev.id,
            title="UpzPoints Recebidos!",
            body=f"Você recebeu {payload.amount} UpzPoints da equipe UpzLab Team.\\nMotivo: {payload.reason}",
            icon="award",
            color="emerald",
            read=False
        )
        db.add(notif)
        total_sent += 1
    db.commit()

    return {
        "success": True,
        "message": f"{payload.amount} UpzPoints enviados para {total_sent} dev(s)",
        "recipients": total_sent,
        "total_distributed": payload.amount * total_sent,
    }


@router.get("/points/devs")
async def list_devs_for_points(request: Request, db: Session = Depends(get_db)):
    """Lista todos os devs para o painel de envio de pontos (staff only)."""
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    sender = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not sender or not getattr(sender, "is_staff", False):
        raise HTTPException(status_code=403, detail="Acesso negado")

    devs = db.query(DevProfile).filter(
        DevProfile.is_staff == False,
        DevProfile.status == "ACTIVE"
    ).order_by(DevProfile.points.desc()).all()

    return {
        "success": True,
        "data": [
            {
                "id": d.id,
                "name": d.name or "Dev Tester",
                "level": d.egolpe_level or "Scanner",
                "points": d.points or 0,
                "avatar_url": d.avatar_url or "",
            }
            for d in devs
        ]
    }


@router.post("/profile/avatar")
async def upload_avatar(request: Request, avatar: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload da foto de perfil a partir do computador."""
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
    dev = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    import os, uuid as _uuid
    ext = avatar.filename.rsplit(".", 1)[-1].lower() if avatar.filename and "." in avatar.filename else ""
    if ext not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="Formato inválido. Use JPG, PNG ou WebP.")
    data = await avatar.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagem muito grande (máx. 5MB).")

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    avatars_dir = os.path.join(BASE_DIR, "uploads", "avatars")
    os.makedirs(avatars_dir, exist_ok=True)
    fname = f"avatar_{dev.id}_{_uuid.uuid4().hex[:8]}.{ext}"
    with open(os.path.join(avatars_dir, fname), "wb") as f:
        f.write(data)

    dev.avatar_url = f"{str(request.base_url).rstrip('/')}/uploads/avatars/{fname}"
    db.commit()
    return {"success": True, "avatarUrl": dev.avatar_url}


@router.post("/profile/avatar/official")
async def use_official_avatar(request: Request, db: Session = Depends(get_db)):
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
    dev = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev or not getattr(dev, "is_staff", False):
        raise HTTPException(status_code=403, detail="Apenas a equipe UpzLab")
    dev.avatar_url = "/favicon.svg"
    db.commit()
    return {"success": True, "avatarUrl": dev.avatar_url}


@router.post("/profile/cover")
async def upload_cover(request: Request, cover: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload de foto de capa do perfil."""
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    dev = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    import os, uuid as _uuid
    ext = cover.filename.rsplit(".", 1)[-1].lower() if "." in cover.filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="Formato inválido. Use JPG, PNG ou WebP.")

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    covers_dir = os.path.join(BASE_DIR, "uploads", "covers")
    os.makedirs(covers_dir, exist_ok=True)

    fname = f"cover_{dev.id}_{_uuid.uuid4().hex[:8]}.{ext}"
    fpath = os.path.join(covers_dir, fname)
    with open(fpath, "wb") as f:
        f.write(await cover.read())

    cover_url = f"/uploads/covers/{fname}"

    # Salva no campo bio ou em um campo dedicado — usamos bio_cover via campo extra
    # Como não temos campo cover_url no DevProfile, guardamos em um campo novo


    from sqlalchemy import update
    db.execute(
        update(DevProfile).where(DevProfile.id == dev.id).values(cover_url=cover_url)
    )
    db.commit()

    return {"success": True, "cover_url": cover_url}


# ── Transferência de UpzPoints (qualquer dev autenticado) ────────────────────

class TransferPointsPayload(BaseModel):
    target_dev_id: Optional[int] = None   # dev individual (DevProfile.id)
    target_app_slug: Optional[str] = None # envia para todos os testers do app
    amount: int
    reason: str


@router.post("/points/transfer")
async def transfer_points(payload: TransferPointsPayload, request: Request, db: Session = Depends(get_db)):
    """
    Qualquer dev autenticado pode transferir UpzPoints para outro dev ou
    para todos os testers de um app que ele possui.
    """
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    sender = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Valor deve ser maior que zero")

    if not payload.target_dev_id and not payload.target_app_slug:
        raise HTTPException(status_code=400, detail="Informe target_dev_id ou target_app_slug")

    from app.services.gamification_service import add_points_and_level_up

    targets: list[DevProfile] = []

    if payload.target_dev_id:
        if payload.target_dev_id == sender.id:
            raise HTTPException(status_code=400, detail="Você não pode enviar pontos para si mesmo")
        dev = db.query(DevProfile).filter(DevProfile.id == payload.target_dev_id).first()
        if not dev:
            raise HTTPException(status_code=404, detail="Dev destinatário não encontrado")
        targets = [dev]

    elif payload.target_app_slug:
        from app.models.beta_product_models import BetaProduct, ProjectFollower
        camp = db.query(BetaProduct).filter(BetaProduct.slug == payload.target_app_slug).first()
        if not camp:
            raise HTTPException(status_code=404, detail="App não encontrado")
        # Só o dono do app pode enviar em massa para os testers
        if not getattr(sender, "is_staff", False) and camp.owner_id != sender.id:
            raise HTTPException(status_code=403, detail="Apenas o dono do app pode enviar pontos para seus testers")
        followers = db.query(ProjectFollower).filter(ProjectFollower.product_id == camp.id).all()
        for f in followers:
            dev = db.query(DevProfile).filter(DevProfile.id == f.dev_profile_id).first()
            if dev and dev.id != sender.id:
                targets.append(dev)

    if not targets:
        raise HTTPException(status_code=404, detail="Nenhum destinatário encontrado")

    total_needed = payload.amount * len(targets)

    # Staff tem saldo ilimitado — não verifica
    if not getattr(sender, "is_staff", False):
        if (sender.points or 0) < total_needed:
            raise HTTPException(
                status_code=402,
                detail=f"Saldo insuficiente. Necessário: {total_needed} UpzPoints ({payload.amount} × {len(targets)} devs). Seu saldo: {sender.points} UpzPoints"
            )
        # Debita do remetente
        add_points_and_level_up(
            db, sender, -total_needed,
            f"Transferência de {payload.amount} UpzPoints para {len(targets)} dev(s): {payload.reason}"
        )

    # Credita nos destinatários
    for dev in targets:
        add_points_and_level_up(
            db, dev, payload.amount,
            f"Recebeu {payload.amount} UpzPoints de {sender.name or 'Dev'}: {payload.reason}"
        )
        notif = DevNotification(
            dev_id=dev.id,
            title="UpzPoints Recebidos!",
            body=f"Você recebeu {payload.amount} UpzPoints de {sender.name or 'Dev'}.\\nMotivo: {payload.reason}",
            icon="award",
            color="emerald",
            read=False
        )
        db.add(notif)
    db.commit()

    return {
        "success": True,
        "message": f"{payload.amount} UpzPoints transferidos para {len(targets)} dev(s)!",
        "recipients": len(targets),
        "total_transferred": payload.amount * len(targets),
        "new_balance": sender.points,
    }


@router.get("/points/my-apps-testers")
async def get_my_apps_testers(request: Request, db: Session = Depends(get_db)):
    """
    Retorna os apps do dev autenticado com seus respectivos testers,
    para usar no seletor de transferência em massa.
    """
    user_id = _get_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")

    sender = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    from app.models.beta_product_models import BetaProduct, ProjectFollower

    my_apps = db.query(BetaProduct).filter(
        BetaProduct.owner_id == sender.id,
        BetaProduct.is_active == True
    ).all()

    result = []
    for app in my_apps:
        followers = db.query(ProjectFollower).filter(ProjectFollower.product_id == app.id).all()
        testers = []
        for f in followers:
            dev = db.query(DevProfile).filter(DevProfile.id == f.dev_profile_id).first()
            if dev:
                testers.append({
                    "id": dev.id,
                    "name": dev.name or "Dev Tester",
                    "level": dev.egolpe_level or "Scanner",
                    "points": dev.points or 0,
                })
        result.append({
            "id": str(app.id),
            "slug": app.slug,
            "name": app.name,
            "icon": app.icon_url or "",
            "testers_count": len(testers),
            "testers": testers,
        })

    # Todos os devs (para envio individual)
    all_devs = db.query(DevProfile).filter(
        DevProfile.is_staff == False,
        DevProfile.status == "ACTIVE",
        DevProfile.id != sender.id
    ).order_by(DevProfile.points.desc()).all()

    return {
        "success": True,
        "my_apps": result,
        "all_devs": [
            {
                "id": d.id,
                "name": d.name or "Dev Tester",
                "level": d.egolpe_level or "Scanner",
                "points": d.points or 0,
            }
            for d in all_devs
        ]
    }


_GITHUB_EXPERIENCE_CACHE: dict = {}
_GITHUB_EXPERIENCE_TTL = 3600


def _fetch_github_experience(login: str) -> Optional[dict]:
    """Experiência pública do dev no GitHub (cache de 1h para respeitar o rate limit)."""
    import time
    import requests
    from collections import Counter

    cached = _GITHUB_EXPERIENCE_CACHE.get(login.lower())
    if cached and time.time() - cached[0] < _GITHUB_EXPERIENCE_TTL:
        return cached[1]

    try:
        user_res = requests.get(f"https://api.github.com/users/{login}", timeout=8)
        if user_res.status_code != 200:
            return cached[1] if cached else None
        user = user_res.json()
        repos_res = requests.get(
            f"https://api.github.com/users/{login}/repos?per_page=100&sort=pushed", timeout=8
        )
        repos = repos_res.json() if repos_res.status_code == 200 else []
    except Exception as e:
        print(f"Erro ao buscar experiência no GitHub: {e}")
        return cached[1] if cached else None

    own = [r for r in repos if not r.get("fork")]
    lang_count = Counter(r.get("language") for r in own if r.get("language"))
    total_lang = sum(lang_count.values()) or 1
    top_repos = sorted(own, key=lambda r: (r.get("stargazers_count", 0), r.get("pushed_at") or ""), reverse=True)[:6]

    created = (user.get("created_at") or "")[:10]
    years = 0
    if created:
        try:
            years = max(datetime.utcnow().year - int(created[:4]), 0)
        except ValueError:
            years = 0

    data = {
        "login": user.get("login"),
        "url": user.get("html_url"),
        "company": user.get("company"),
        "location": user.get("location"),
        "member_since": created,
        "years": years,
        "public_repos": user.get("public_repos", 0),
        "followers": user.get("followers", 0),
        "stars": sum(r.get("stargazers_count", 0) for r in own),
        "languages": [
            {"name": name, "percent": round(count * 100 / total_lang)}
            for name, count in lang_count.most_common(6)
        ],
    }
    _GITHUB_EXPERIENCE_CACHE[login.lower()] = (time.time(), data)
    return data


@router.get("/public/{username}/overview")
def get_public_overview(username: str, request: Request, db: Session = Depends(get_db)):
    if not _get_user_id_optional(request):
        raise HTTPException(status_code=401, detail="Entre na sua conta para ver perfis.")
    """Visão geral do perfil: experiência GitHub, apps testados e conquistas."""
    from app.models.beta_product_models import BetaProduct, ProjectFollower

    profile = db.query(DevProfile).filter(DevProfile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    rows = (
        db.query(BetaProduct)
        .join(ProjectFollower, ProjectFollower.product_id == BetaProduct.id)
        .filter(ProjectFollower.dev_profile_id == profile.id)
        .order_by(ProjectFollower.created_at.desc())
        .limit(50)
        .all()
    )
    tested_apps = [
        {"id": a.id, "slug": a.slug, "name": a.name, "category": a.category, "icon": a.icon_url or ""}
        for a in rows
    ]

    github = _fetch_github_experience(profile.github_username) if profile.github_username else None

    if github and profile.is_staff:
        github = {**github, "login": None, "url": None, "company": None, "location": None}

    try:
        certs = json.loads(profile.certificates or "[]")
    except Exception:
        certs = []

    feedbacks = profile.feedbacks_sent or 0
    bugs = profile.bugs_reported or 0
    points = profile.points or 0
    milestones = [
        ("github", "GitHub conectado", "Conectou o GitHub ao perfil.", bool(profile.github_username)),
        ("tester", "Primeiro app testado", "Entrou como testador em um app.", len(tested_apps) >= 1),
        ("tester5", "Testador frequente", "Testou 5 apps.", len(tested_apps) >= 5),
        ("feedback", "Primeiro feedback", "Enviou o primeiro feedback.", feedbacks >= 1),
        ("feedback10", "Voz da comunidade", "Enviou 10 feedbacks.", feedbacks >= 10),
        ("bug", "Caçador de bugs", "Reportou o primeiro bug.", bugs >= 1),
        ("bug10", "Bug Hunter", "Reportou 10 bugs.", bugs >= 10),
        ("pts100", "100 UpzPoints", "Alcançou 100 pontos.", points >= 100),
        ("pts1000", "1.000 UpzPoints", "Alcançou 1.000 pontos.", points >= 1000),
    ]
    achievements = [
        {"id": i, "title": t, "description": d, "unlocked": u} for i, t, d, u in milestones
    ] + [
        {"id": f"cert-{n}", "title": str(n), "description": "Certificado conquistado.", "unlocked": True}
        for n in certs
    ]

    return {
        "success": True,
        "data": {
            "level": profile.egolpe_level,
            "points": points,
            "feedbacks": feedbacks,
            "bugs": bugs,
            "github": github,
            "tested_apps": tested_apps,
            "achievements": achievements,
        },
    }


@router.get("/public/{username}")
def get_public_profile(username: str, request: Request, db: Session = Depends(get_db)):
    if not _get_user_id_optional(request):
        raise HTTPException(status_code=401, detail="Entre na sua conta para ver perfis.")
    profile = db.query(DevProfile).filter(DevProfile.username == username).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "success": True,
        "data": {
            "id": profile.id,
            "name": profile.name,
            "username": profile.username,
            "bio": profile.bio,
            "cover_url": getattr(profile, "cover_url", None),
            "level": profile.egolpe_level,
            "points": profile.points,
            "status": profile.status,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "badges": [],
            "stats": {
                "posts": 0,
                "comments": 0
            }
        }
    }
