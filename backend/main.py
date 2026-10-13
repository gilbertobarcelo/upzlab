from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from migrate_daily_checkin import migrate

# Importar modelos para registro no SQLAlchemy
import app.models.dev_tester_models
import app.models.beta_product_models
import app.models.beta_feedback_models
import app.models.user_models
import app.models.config_models
import app.models.email_models
import app.models.faq_models
import app.models.forum_models
import app.models.bounty_models
import app.models.job_models
import app.models.course_models
import app.models.auto_docs_models
import upzlabrouter.models.router_models

# create_all não atualiza tabelas antigas; aplique também as migrações aditivas.
migrate()

app = FastAPI(
    title="UpzLab Community API",
    description="API Standalone para gerenciamento da comunidade B2B/B2C, aplicativos, economia e testes.",
    version="1.0.0"
)

import os as _os

# Origens permitidas: explícitas + extras via env (ex.: https://upzlab.com)
_extra_origins = [
    o.strip()
    for o in _os.getenv("UPZLAB_ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost",
    "https://localhost",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3003",
] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi.staticfiles import StaticFiles
import os

# Diretório base absoluto do backend — funciona independente de onde o uvicorn é iniciado
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Cria os diretórios de uploads se não existirem
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(os.path.join(UPLOADS_DIR, "apps"), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "posts"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "UpzLab Community API is running"}

# Registrar rotas
from fastapi import APIRouter
from app.api.dev_tester_routes import router as dev_tester_router
from app.api.beta_product_routes import router as beta_product_router
from app.api.dev_auth_routes import router as dev_auth_router
from app.api.beta_feedback_routes import router as beta_feedback_router
from app.api.beta_feedback_routes import updates_router as beta_updates_router
from app.api.mentions_routes import router as mentions_router
from app.ai.routes import router as ai_support_router
from app.api.docs_routes import router as docs_router
from app.api.auto_docs_routes import router as auto_docs_router
from app.api.sdk_routes import router as sdk_router
from app.api.forum_routes import router as forum_router
from app.api.bounty_routes import router as bounty_router
from app.api.job_routes import router as job_router
from app.api.course_routes import router as course_router
from app.api.distribution_routes import router as distribution_router
from app.api.admin_routes import router as upzcontroll_admin_router
from upzlabrouter.api.chat import router as upzlabrouter_chat_router
from upzlabrouter.api.keys import router as upzlabrouter_keys_router
from upzlabrouter.api.models import router as upzlabrouter_models_router
from upzlabrouter.api.dashboard import router as upzlabrouter_dashboard_router

api_v1 = APIRouter(prefix="/api/v1")
upzlabrouter_api = APIRouter(prefix="/api/upzlabrouter", tags=["UpzLabRouter"])

# Rotas de comunidade (UpzLab)
app.include_router(dev_tester_router, prefix="/api/upzlab")
app.include_router(beta_product_router, prefix="/api/upzlab")
app.include_router(beta_feedback_router, prefix="/api")
app.include_router(beta_updates_router, prefix="/api")
app.include_router(mentions_router, prefix="/api/upzlab")
app.include_router(ai_support_router, prefix="/api/ai")
app.include_router(docs_router, prefix="/api/docs")
app.include_router(auto_docs_router, prefix="/api/auto-docs")
app.include_router(sdk_router, prefix="/api/upzlab")
app.include_router(forum_router, prefix="/api/upzlab")
app.include_router(bounty_router, prefix="/api/upzlab")
app.include_router(job_router, prefix="/api/upzlab")
app.include_router(course_router, prefix="/api/upzlab")
app.include_router(distribution_router)
app.include_router(upzcontroll_admin_router, prefix="/api")
upzlabrouter_api.include_router(upzlabrouter_keys_router)
upzlabrouter_api.include_router(upzlabrouter_models_router)
upzlabrouter_api.include_router(upzlabrouter_dashboard_router)
upzlabrouter_api.include_router(upzlabrouter_chat_router)
app.include_router(upzlabrouter_api)

# Rotas de Auth Dev
app.include_router(dev_auth_router)  # Incluído diretamente na raiz para manter o prefixo /api/dev/auth 
# Para manter a consistência, incluiremos diretamente na root.

app.include_router(api_v1)
