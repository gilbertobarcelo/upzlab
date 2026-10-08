from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, Base

# Importar modelos para registro no SQLAlchemy
import app.models.dev_tester_models
import app.models.beta_product_models
import app.models.beta_feedback_models
import app.models.user_models
import app.models.config_models
import app.models.email_models
import app.models.faq_models
import app.models.auto_docs_models

# Criar tabelas automaticamente
Base.metadata.create_all(bind=engine)

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

api_v1 = APIRouter(prefix="/api/v1")

# Rotas de comunidade (UpzLab)
app.include_router(dev_tester_router, prefix="/api/upzlab")
app.include_router(beta_product_router, prefix="/api/upzlab")
app.include_router(beta_feedback_router, prefix="/api")
app.include_router(beta_updates_router, prefix="/api")
app.include_router(mentions_router, prefix="/api/upzlab")
app.include_router(ai_support_router, prefix="/api/ai")
app.include_router(docs_router, prefix="/api/docs")
app.include_router(auto_docs_router, prefix="/api/auto-docs")

# Rotas de Auth Dev
app.include_router(dev_auth_router)  # Incluído diretamente na raiz para manter o prefixo /api/dev/auth 
# Para manter a consistência, incluiremos diretamente na root.

app.include_router(api_v1)
