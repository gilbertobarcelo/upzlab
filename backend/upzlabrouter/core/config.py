"""
UpzLabRouter — Configuração central.
Single source of truth para aliases de modelos, provedores e limites.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Prefixo das chaves UpzLab ──────────────────────────────────────────────────
KEY_PREFIX = "upzlk_"

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

# ── Chaves dos provedores (lidas do .env) ──────────────────────────────────────
PROVIDER_KEYS: dict[str, str] = {
    "cohere": os.getenv("COHERE_API_KEY", ""),
    "apodex": os.getenv("APODEX_API_KEY", ""),
}

# ── Endpoints dos provedores ───────────────────────────────────────────────────
PROVIDER_ENDPOINTS: dict[str, str] = {
    "cohere": "https://api.cohere.com/v2/chat",
    "apodex": "https://api.apodex.com/v1/chat/completions",
}

# ── Limites de rate por provedor (estimativa — ajustar conforme docs) ──────────
PROVIDER_DAILY_LIMITS: dict[str, int] = {
    "cohere": 1000,   # trial key — produção tem mais
    "apodex": 500,    # promoção de lançamento
}

# ── Ordem de fallback quando provider = "auto" ─────────────────────────────────
FALLBACK_ORDER = ["cohere", "apodex"]

# ── Conta staff — sem limite de uso ───────────────────────────────────────────
STAFF_USER_ID = 1
