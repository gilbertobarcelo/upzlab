"""
UpzLabRouter — Configuração central.
Single source of truth para aliases de modelos, provedores e limites.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / "novita.env")

# ── Prefixo das chaves UpzLab ──────────────────────────────────────────────────
KEY_PREFIX = "Lab_"
LEGACY_KEY_PREFIXES = ("upzlk_",)
KEY_PREFIXES = (KEY_PREFIX, *LEGACY_KEY_PREFIXES)

# ── Modelos expostos no MVP (Cohere + Apodex) ─────────────────────────────────
#  alias UpzLabRouter → (provider_id, model_id_no_provedor, custo_pts_por_1k_tokens)
MODEL_CATALOG: dict[str, dict] = {
    # Gratuitos
    "upzlab/code": {
        "provider": "cohere",
        "model": "north-mini-code-1.0",
        "tier": "free",
        "pts_per_1k": 0,
        "description": "Cohere North Mini Code — especializado em código e tarefas agênticas",
        "context_window": 32768,
    },
    "upzlab/research": {
        "provider": "apodex",
        "model": "apodex-1.1-mini",
        "tier": "free",
        "pts_per_1k": 0,
        "description": "Apodex 1.1 Mini — raciocínio e pesquisa de longo horizonte",
        "context_window": 131072,
    },
    "upzlab/openrouter": {
        "provider": "openrouter",
        "model": os.getenv("OPENROUTER_MODEL", "cohere/north-mini-code:free"),
        "tier": "free",
        "pts_per_1k": 0,
        "description": "OpenRouter — modelo gratuito de uso geral",
        "context_window": 65536,
    },
    "upzlab/huggingface": {
        "provider": "huggingface",
        "model": os.getenv("HF_MODEL", "meta-llama/Llama-3.3-70B-Instruct"),
        "tier": "free",
        "pts_per_1k": 0,
        "description": "Hugging Face Inference Providers — uso geral",
        "context_window": 65536,
    },
    "upzlab/groq": {
        "provider": "groq",
        "model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
        "tier": "free",
        "pts_per_1k": 0,
        "description": "Groq — inferência ultrarrápida",
        "context_window": 131072,
    },
    # Alias automático — roteador escolhe pelo menor custo/maior disponibilidade
    "auto": {
        "provider": "auto",
        "model": "auto",
        "tier": "free",
        "pts_per_1k": 0,
        "description": "Roteamento automático — escolhe o melhor modelo disponível",
        "context_window": 32768,
    },
}

# ── Chaves dos provedores ──────────────────────────────────────────────────────
PROVIDER_KEYS: dict[str, str] = {
    "cohere": os.getenv("COHERE_API_KEY", ""),
    "apodex": os.getenv("APODEX_API_KEY", ""),
    "novita": os.getenv("NOVITA_API_KEY", ""),
    "openrouter": os.getenv("OPENROUTER_API_KEY", ""),
    "huggingface": os.getenv("HF_API_KEY", ""),
    "groq": os.getenv("GROQ_API_KEY", ""),
}

# ── Endpoints dos provedores ───────────────────────────────────────────────────
PROVIDER_ENDPOINTS: dict[str, str] = {
    "cohere": "https://api.cohere.com/v2/chat",
    "apodex": "https://api.apodex.com/v1/chat/completions",
    "novita": "https://api.novita.ai/openai",
    "openrouter": "https://openrouter.ai/api/v1/chat/completions",
    "huggingface": "https://router.huggingface.co/v1/chat/completions",
    "groq": "https://api.groq.com/openai/v1/chat/completions",
}

# ── Limites de rate por provedor (estimativa — ajustar conforme docs) ──────────
PROVIDER_DAILY_LIMITS: dict[str, int] = {
    "cohere": 1000,   # trial key — produção tem mais
    "apodex": 500,    # promoção de lançamento
    "openrouter": 200,  # modelos :free têm limite diário baixo
    "huggingface": 500,
    "groq": 1000,
}

# ── Ordem de fallback quando provider = "auto" ─────────────────────────────────
FALLBACK_ORDER = ["cohere", "apodex", "groq", "openrouter", "huggingface"]

# ── Conta staff — sem limite de uso ───────────────────────────────────────────
STAFF_USER_ID = 1
