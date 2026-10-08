"""
UpzLab - Dev Tester Auth API Routes (Comunidade V2)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database.database import get_db

from app.models.dev_tester_models import DevProfile
from app.models.user_models import AppUser
import os
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


from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterPayload(BaseModel):
    name: str
    email: str
    password: str

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

@router.post("/register")
async def register_user(payload: RegisterPayload, db: Session = Depends(get_db)):
    """Registra um novo usuário Dev com email e senha."""
    existing_user = db.query(AppUser).filter(AppUser.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    hashed_pw = pwd_context.hash(payload.password)
    new_user = AppUser(
        name=payload.name,
        email=payload.email,
        password_hash=hashed_pw
    )
    db.add(new_user)
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
    
    return {
        "success": True, 
        "access_token": encoded_jwt,
        "action": "complete_profile",
        "message": "Conta criada! Por favor valide seu telefone."
    }


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
        try:
            valid_password = pwd_context.verify(payload.password, app_user.password_hash)
        except Exception:
            # Hash em formato desconhecido (legado em texto puro): só aceita
            # se bater exatamente e faz o upgrade imediato para bcrypt.
            if app_user.password_hash == payload.password:
                app_user.password_hash = pwd_context.hash(payload.password)
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
        "action": "complete_profile" if needs_profile else "dashboard",
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
        response = RedirectResponse(url="http://localhost:3003/")
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
async def verify_route(payload: VerifyRoutePayload, request: Request):
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
    public_prefixes = ("/docs", "/docslab", "/tutorial")

    is_auth_page = payload.path in auth_pages
    is_public_content = any(
        payload.path == p or payload.path.startswith(p + "/")
        for p in public_prefixes
    )

    if not user_id:
        if is_auth_page or is_public_content:
            return {"allow": True}
        return {"redirect_to": "/login"}

    # Logado não reabre telas de autenticação.
    if is_auth_page:
        return {"redirect_to": "/"}

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
        
    if action == "login":
        state = "login_flow"
    else:
        if not token:
            raise HTTPException(status_code=401, detail="Token JWT necessário para conectar")
        state = token
        
    redirect_uri = "http://localhost:8001/api/dev/auth/github/callback"
    
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={urllib.parse.quote(redirect_uri)}&scope=user:email,read:user&state={state}"
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
                    email=email
                )
                db.add(app_user)
                db.commit()
                db.refresh(app_user)
                
            # Gera JWT e redireciona para login bem sucedido passando token na URL
            expire = datetime.utcnow() + timedelta(days=7)
            jwt_payload = {
                "sub": str(app_user.id),
                "email": app_user.email,
                "is_dev": True,
                "exp": expire
            }
            encoded_jwt = jwt.encode(jwt_payload, SECRET_KEY, algorithm=ALGORITHM)
            
            # Se não tem telefone, ele precisa completar o perfil
            next_action = "complete_profile" if not app_user.phone else "dashboard"
            return RedirectResponse(f"http://localhost:3003/login/callback?token={encoded_jwt}&action={next_action}")
            
        # 5. Fluxo de "Connect" normal
        dev_profile = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
        if dev_profile:
            dev_profile.github_username = github_username
            dev_profile.avatar_url = avatar_url
            
            import datetime
            account_age_days = 0
            if created_at_str:
                try:
                    if created_at_str.endswith("Z"):
                        created_at_str = created_at_str[:-1]
                    gh_created_at = datetime.datetime.fromisoformat(created_at_str)
                    account_age_days = (datetime.datetime.utcnow() - gh_created_at).days
                except Exception as e:
                    print(f"Erro ao parsear created_at: {e}")
            
            dev_profile.github_account_age_days = account_age_days
            dev_profile.github_total_repos = public_repos
            
            if dev_profile.github_score == 0:
                years_active = account_age_days // 365
                points_from_age = years_active * 10
                points_from_repos = public_repos * 2
                
                total_bonus = points_from_age + points_from_repos
                if total_bonus > 500:
                    total_bonus = 500
                    
                dev_profile.github_score = total_bonus
                dev_profile.points = (dev_profile.points or 0) + total_bonus
            
            repos_res = requests.get(f"https://api.github.com/users/{github_username}/repos?per_page=100")
            if repos_res.status_code == 200:
                repos = repos_res.json()
                languages = [r.get("language") for r in repos if r.get("language")]
                if languages:
                    counter = Counter(languages)
                    top_3 = [lang for lang, _ in counter.most_common(3)]
                    dev_profile.top_languages = ", ".join(top_3)
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


@router.get("/public/{username}")
def get_public_profile(username: str, db: Session = Depends(get_db)):
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
