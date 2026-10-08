import sys
import os

# Ajustar o path para poder importar módulos do backend corretamente
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from passlib.context import CryptContext
from database.database import SessionLocal, engine, Base
from app.models.user_models import AppUser
from app.models.dev_tester_models import DevProfile

# Inicializar passlib context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PASSWORD = "senha123"
HASHED_PASSWORD = pwd_context.hash(DEFAULT_PASSWORD)

# Certifique-se de criar as tabelas caso não existam
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("Iniciando seed de usuários de teste...")

test_users_data = [
    {
        "id": 1,
        "name": "Dev Tester",
        "email": "devtester@upzlab.com",
        "phone": "+5511999990001",
        "github": "devtester",
        "bio": "Desenvolvedor e Testador Principal da Plataforma É Golpe.",
        "level": "Scanner Alpha",
        "points": 500
    },
    {
        "id": 2,
        "name": "Testador 2",
        "email": "testador2@upzlab.com",
        "phone": "+5511999990002",
        "github": "testador2dev",
        "bio": "Especialista em testes de segurança em chamadas telefônicas.",
        "level": "Shield Hunter",
        "points": 400
    },
    {
        "id": 3,
        "name": "Testador 3",
        "email": "testador3@upzlab.com",
        "phone": "+5511999990003",
        "github": "testador3dev",
        "bio": "Analista de engenharia reversa de chamadas VoIP e anomalias de rede.",
        "level": "Bug Hunter",
        "points": 300
    },
    {
        "id": 4,
        "name": "Testador 4",
        "email": "testador4@upzlab.com",
        "phone": "+5511999990004",
        "github": "testador4dev",
        "bio": "Entusiasta de segurança cibernética e detecção de spoofing.",
        "level": "Code Expert",
        "points": 200
    },
    {
        "id": 5,
        "name": "Testador 5",
        "email": "testador5@upzlab.com",
        "phone": "+5511999990005",
        "github": "testador5dev",
        "bio": "Testador beta focado em validação de chamadas falsas.",
        "level": "Scanner",
        "points": 100
    }
]

try:
    for udata in test_users_data:
        email = udata["email"]
        name = udata["name"]
        
        # 1. Verificar/Atualizar AppUser
        user = db.query(AppUser).filter(AppUser.email == email).first()
        if not user:
            user = AppUser(
                name=name,
                email=email,
                phone=udata["phone"],
                password_hash=HASHED_PASSWORD,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Criado AppUser: {user.name} ({user.email})")
        else:
            user.name = name
            user.password_hash = HASHED_PASSWORD
            user.is_active = True
            db.commit()
            print(f"Atualizado AppUser: {user.name} ({user.email})")

        # 2. Verificar/Atualizar DevProfile
        profile = db.query(DevProfile).filter(DevProfile.user_id == user.id).first()
        if not profile:
            profile = DevProfile(
                user_id=user.id,
                github_username=udata["github"],
                name=name,
                avatar_url=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=0D9488&color=fff",
                top_languages="Python, TypeScript",
                bio=udata["bio"],
                github_account_age_days=365,
                points=udata["points"],
                egolpe_level=udata["level"],
                status="ACTIVE"
            )
            db.add(profile)
            db.commit()
            print(f"  -> Perfil Dev criado para: {profile.name}")
        else:
            profile.name = name
            profile.github_username = udata["github"]
            profile.points = udata["points"]
            profile.egolpe_level = udata["level"]
            profile.status = "ACTIVE"
            db.commit()
            print(f"  -> Perfil Dev atualizado para: {profile.name}")

    print("\nUsuários de teste atualizados/gerados com sucesso!")

except Exception as e:
    print(f"Erro ao semear banco de dados: {e}")
finally:
    db.close()
