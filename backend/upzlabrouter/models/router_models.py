"""
UpzLabRouter — Modelos de banco de dados.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from database.database import Base


class RouterApiKey(Base):
    """
    Chaves UPZLAB_KEY geradas pelos devs para usar o roteador nos projetos.
    O valor real da chave nunca é armazenado — apenas o hash SHA-256.
    """
    __tablename__ = "router_api_keys"

    id          = Column(Integer, primary_key=True, index=True)
    dev_id      = Column(Integer, nullable=False, index=True)   # DevProfile.user_id (AppUser.id)
    key_hash    = Column(String(64), nullable=False, unique=True, index=True)  # SHA-256 hex
    key_prefix  = Column(String(16), nullable=False)            # ex: "upzlk_a1b2c3d4"
    name        = Column(String(100), nullable=False, default="Minha chave")
    is_active   = Column(Boolean, default=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class RouterUsageLog(Base):
    """
    Log imutável de cada chamada ao roteador.
    Usado para billing, analytics e detecção de abuso.
    """
    __tablename__ = "router_usage_log"

    id                 = Column(Integer, primary_key=True, index=True)
    dev_id             = Column(Integer, nullable=False, index=True)
    api_key_id         = Column(Integer, ForeignKey("router_api_keys.id"), nullable=True)
    provider           = Column(String(50), nullable=False)    # cohere | apodex | ...
    model_alias        = Column(String(100), nullable=False)   # upzlab/code | upzlab/research
    model_real         = Column(String(150), nullable=False)   # nome real no provedor
    prompt_tokens      = Column(Integer, default=0)
    completion_tokens  = Column(Integer, default=0)
    upzpoints_charged  = Column(Integer, default=0)
    latency_ms         = Column(Integer, default=0)
    status             = Column(String(20), default="success") # success | error | rate_limited
    error_detail       = Column(Text, nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())


class RouterProviderStatus(Base):
    """
    Status em tempo real de cada provedor.
    O serviço de quota atualiza `daily_used` a cada chamada.
    """
    __tablename__ = "router_provider_status"

    id           = Column(Integer, primary_key=True, index=True)
    provider     = Column(String(50), nullable=False, unique=True, index=True)
    daily_used   = Column(Integer, default=0)
    daily_limit  = Column(Integer, default=1000)
    is_active    = Column(Boolean, default=True)
    last_reset   = Column(DateTime(timezone=True), server_default=func.now())  # data do último reset diário
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())
