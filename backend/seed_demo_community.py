"""Create and remove a reversible demo population for the UpzLab community.

Usage:
    python3 seed_demo_community.py seed
    python3 seed_demo_community.py clean

The records are explicitly marked with ``is_seed`` and are never presented as
real community activity by this script. No artificial likes or comments are
created.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.passwords import hash_password
from app.models.beta_feedback_models import BetaFeedback, BetaFeedbackComment
from app.models.beta_product_models import BetaProduct, ProjectFollower
from app.models.dev_tester_models import DevProfile, UpzPointsLedger
from app.models.user_models import AppUser
from database.database import Base, SessionLocal, engine
from migrate_daily_checkin import migrate


SEED_EMAIL_PREFIX = "seed.community."
SEED_USERNAME_PREFIX = "seed_"
SEED_SLUG_PREFIX = "seed-"
SEED_POST_PREFIX = "[DEMO]"
DEMO_PASSWORD = os.getenv("UPZLAB_SEED_PASSWORD", "DemoOnly-UpzLab-2026!")

FIRST_NAMES = [
    "Ana", "Bruno", "Camila", "Daniel", "Elisa", "Felipe", "Gabriela",
    "Henrique", "Isabela", "Joao", "Karina", "Lucas", "Marina", "Nicolas",
    "Olivia", "Paulo", "Renata", "Sofia", "Thiago", "Valentina",
]
LAST_NAMES = [
    "Almeida", "Barros", "Cardoso", "Dias", "Esteves", "Ferreira",
    "Gomes", "Henriques", "Lima", "Mendes", "Nogueira", "Oliveira",
    "Pereira", "Ramos", "Santos", "Teixeira", "Vargas", "Xavier",
]
LANGUAGES = ["TypeScript", "Python", "Kotlin", "Go", "Rust", "Swift", "Java"]
ROLES = [
    "Frontend Developer", "Backend Developer", "Mobile Developer",
    "QA Engineer", "Security Researcher", "Product Designer",
]
TOPICS = [
    ("Como organizar um monorepo sem perder velocidade", "publicacao"),
    ("Validacao de formularios no frontend", "suggestion"),
    ("Observabilidade desde o primeiro deploy", "code_fix"),
    ("Testes de contrato para APIs", "publicacao"),
    ("Acessibilidade como parte da definicao de pronto", "suggestion"),
    ("Cache HTTP: quando usar e quando evitar", "code_fix"),
    ("Autenticacao segura em aplicativos mobile", "fraude"),
    ("Como documentar uma decisao tecnica", "publicacao"),
    ("Melhorando o tempo de carregamento percebido", "code_fix"),
    ("Checklist para revisar um pull request", "publicacao"),
    ("Tratando erros sem esconder falhas", "bug"),
    ("Design system pequeno que realmente escala", "suggestion"),
]
APP_TEMPLATES = [
    ("Nuvem Clara", "Organizacao pessoal", "Uma agenda leve para organizar tarefas e rotinas.", "Web"),
    ("Foco Sprint", "Produtividade", "Timer colaborativo para equipes que trabalham em ciclos curtos.", "Web"),
    ("Mapa Local", "Comunidade", "Descubra iniciativas e projetos independentes perto de voce.", "Android"),
    ("Sinal Verde", "Sustentabilidade", "Acompanhe habitos sustentaveis com metas praticas.", "Android"),
    ("Nota Aberta", "Educacao", "Caderno de estudos com revisao espacada e exportacao simples.", "Web"),
    ("FinanSimples", "Financas", "Visao clara de pequenos objetivos financeiros sem complicacao.", "iOS"),
    ("Pulso API", "Desenvolvimento", "Painel para acompanhar latencia e disponibilidade de endpoints.", "Web"),
    ("Trilha Dev", "Educacao", "Trilhas curtas para praticar fundamentos de engenharia.", "Android"),
]


def seed_community() -> None:
    migrate()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(AppUser).filter(AppUser.is_seed.is_(True)).count()
        if existing:
            print(f"Lote demo ja existe ({existing} usuarios). Nenhuma alteracao feita.")
            return

        password_hash = hash_password(DEMO_PASSWORD)
        users: list[AppUser] = []
        profiles: list[DevProfile] = []
        now = datetime.utcnow()

        for index in range(500):
            first = FIRST_NAMES[index % len(FIRST_NAMES)]
            last = LAST_NAMES[(index * 7) % len(LAST_NAMES)]
            name = f"{first} {last}"
            username = f"{SEED_USERNAME_PREFIX}{index + 1:04d}"
            user = AppUser(
                name=name,
                email=f"{SEED_EMAIL_PREFIX}{index + 1:04d}@upzlab.local",
                password_hash=password_hash,
                email_verified=True,
                is_active=True,
                is_seed=True,
                created_at=now - timedelta(days=180 - (index % 180)),
            )
            db.add(user)
            users.append(user)
        db.flush()

        for index, user in enumerate(users):
            profile = DevProfile(
                user_id=user.id,
                username=f"{SEED_USERNAME_PREFIX}{index + 1:04d}",
                github_username=f"{SEED_USERNAME_PREFIX}{index + 1:04d}",
                name=user.name,
                avatar_url=f"https://ui-avatars.com/api/?name={user.name.replace(' ', '+')}&background=334155&color=fff",
                top_languages=", ".join(LANGUAGES[index % len(LANGUAGES):][:3]),
                bio=f"{ROLES[index % len(ROLES)]} explorando boas praticas e projetos colaborativos.",
                github_account_age_days=120 + (index % 1200),
                github_total_repos=2 + (index % 18),
                github_score=20 + (index % 80),
                points=0,
                egolpe_level="Scanner",
                status="ACTIVE",
                is_staff=False,
                is_seed=True,
                created_at=user.created_at,
            )
            db.add(profile)
            profiles.append(profile)
        db.flush()

        for index in range(24):
            name, category, description, platform = APP_TEMPLATES[index % len(APP_TEMPLATES)]
            suffix = index // len(APP_TEMPLATES) + 1
            app = BetaProduct(
                slug=f"{SEED_SLUG_PREFIX}{index + 1:03d}",
                owner_id=profiles[(index * 19) % len(profiles)].id,
                name=f"{name} {suffix}",
                package_id=f"com.upzlab.demo.{index + 1:03d}",
                tagline=description[:120],
                description=description + " Projeto demonstrativo da comunidade UpzLab.",
                phase="Beta Aberto",
                version="0.1.0-demo",
                platform=platform,
                category=category,
                upzpoints_budget=0,
                required_level="Scanner",
                is_founder_app=False,
                is_active=True,
                is_seed=True,
                created_at=now - timedelta(days=index % 90),
            )
            db.add(app)

        for index in range(300):
            topic, post_type = TOPICS[index % len(TOPICS)]
            author = profiles[(index * 13) % len(profiles)]
            body = (
                f"{topic}. Este e um post demonstrativo para apresentar o tipo de conversa "
                "que a comunidade pode manter. Compartilhe contexto, alternativas consideradas "
                "e o que voce aprendeu durante a implementacao."
            )
            post = BetaFeedback(
                user_id=author.user_id,
                author_name=author.name,
                author_role=ROLES[index % len(ROLES)],
                type=post_type,
                title=f"{SEED_POST_PREFIX} {topic}",
                body=body,
                status="approved",
                likes=0,
                images=json.dumps([]),
                is_seed=True,
                created_at=now - timedelta(days=120 - (index % 120)),
            )
            db.add(post)

        db.commit()
        print("Lote demo criado: 500 usuarios, 24 apps e 300 posts.")
        print("Para remover: python3 seed_demo_community.py clean")
        print(f"Senha demo compartilhada: {DEMO_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def clean_community() -> None:
    db = SessionLocal()
    try:
        seed_users = [user.id for user in db.query(AppUser.id).filter(AppUser.is_seed.is_(True)).all()]
        seed_profiles = [profile.id for profile in db.query(DevProfile.id).filter(DevProfile.is_seed.is_(True)).all()]
        seed_posts = [post.id for post in db.query(BetaFeedback.id).filter(BetaFeedback.is_seed.is_(True)).all()]

        if seed_posts:
            db.query(BetaFeedbackComment).filter(BetaFeedbackComment.feedback_id.in_(seed_posts)).delete(
                synchronize_session=False
            )
        if seed_profiles:
            db.query(ProjectFollower).filter(ProjectFollower.dev_profile_id.in_(seed_profiles)).delete(
                synchronize_session=False
            )
            db.query(BetaProduct).filter(BetaProduct.is_seed.is_(True)).delete(synchronize_session=False)
            db.query(UpzPointsLedger).filter(UpzPointsLedger.dev_profile_id.in_(seed_profiles)).delete(
                synchronize_session=False
            )
        if seed_posts:
            db.query(BetaFeedback).filter(BetaFeedback.id.in_(seed_posts)).delete(synchronize_session=False)
        if seed_profiles:
            db.query(DevProfile).filter(DevProfile.id.in_(seed_profiles)).delete(synchronize_session=False)
        if seed_users:
            db.query(AppUser).filter(AppUser.id.in_(seed_users)).delete(synchronize_session=False)
        db.commit()
        print(f"Lote demo removido: {len(seed_users)} usuarios, {len(seed_posts)} posts.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {"seed", "clean"}:
        raise SystemExit("Uso: python3 seed_demo_community.py [seed|clean]")
    clean_community() if sys.argv[1] == "clean" else seed_community()
