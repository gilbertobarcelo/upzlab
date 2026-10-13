"""
UpzLab - Dev Tester & Community Models
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.database import Base

class DevDevice(Base):
    """
    Representa o vínculo físico de um dispositivo mobile a um Desenvolvedor/Tester.
    Utilizado para garantir telemetria real e pareamento gamificado na Comunidade V2.
    """
    __tablename__ = "dev_tester_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    phone_number = Column(String(20), nullable=False, index=True)
    
    # Hash seguro gerado a partir do ANDROID_ID
    device_hash = Column(String(255), nullable=False, unique=True, index=True)
    
    # ACTIVE, INACTIVE, UNINSTALLED
    status = Column(String(20), default="ACTIVE", nullable=False)
    
    last_heartbeat = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    # Relacionamentos
    telemetry = relationship("DevTelemetry", back_populates="device", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "phone_number": self.phone_number,
            "device_hash": self.device_hash,
            "status": self.status,
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DevTelemetry(Base):
    """
    Armazena métricas pontuais de saúde do aparelho e execução do aplicativo.
    Coletado via Heartbeat/Ping da Comunidade.
    """
    __tablename__ = "dev_tester_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("dev_tester_devices.id"), nullable=False, index=True)
    
    # Ex: Android 13, Android 14
    os_version = Column(String(50))
    
    # Ex: Samsung Galaxy S23, Xiaomi POCO F3
    model = Column(String(100))
    
    # Tempo em milissegundos da inferência local de IA no aparelho
    inference_latency_ms = Column(Integer, nullable=True)
    
    # True se a ROM do fabricante (ex: MIUI) restringiu o app em segundo plano
    battery_optimization_restricted = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now())

    # Relacionamentos
    device = relationship("DevDevice", back_populates="telemetry")

    def to_dict(self):
        return {
            "id": self.id,
            "device_id": self.device_id,
            "os_version": self.os_version,
            "model": self.model,
            "inference_latency_ms": self.inference_latency_ms,
            "battery_optimization_restricted": self.battery_optimization_restricted,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class DevProfile(Base):
    """
    Armazena o Portfólio Técnico (GitHub) e a Evolução (Ranking E Golpe) do testador.
    Vinculado diretamente à conta de usuário principal.
    """
    __tablename__ = "dev_tester_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False, index=True)
    
    # --- Perfil e Identificação ---
    username = Column(String(50), unique=True, index=True, nullable=True)
    github_username = Column(String(100), nullable=True)
    name = Column(String(150), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    top_languages = Column(String(500), nullable=True) # Ex: "Python, Kotlin, HTML"
    bio = Column(String(500), nullable=True)
    
    # Análise Github
    github_account_age_days = Column(Integer, default=0)
    github_total_repos = Column(Integer, default=0)
    github_score = Column(Integer, default=0)
    
    # --- Evolução E Golpe ---
    points = Column(Integer, default=0)
    feedbacks_sent = Column(Integer, default=0)
    bugs_reported = Column(Integer, default=0)
    egolpe_level = Column(String(50), default="Scanner") # Scanner, White Hat, Bug Hunter, Cyber Ninja
    certificates = Column(String(1000), default="[]") # JSON list de nomes de certificados obtidos
    
    # --- Afiliados / Referral ---
    referral_code = Column(String(20), unique=True, index=True, nullable=True)
    referred_by_id = Column(Integer, ForeignKey("dev_tester_profiles.id"), nullable=True)
    
    # --- Moderação Administrativa ---
    status = Column(String(20), default="ACTIVE")   # ACTIVE, BANNED
    is_staff = Column(Boolean, default=False)        # conta oficial UpzLab
    is_seed = Column(Boolean, default=False, nullable=False, index=True)
    cover_url = Column(String(500), nullable=True)   # foto de capa do perfil
    timezone = Column(String(80), nullable=False, default="America/Sao_Paulo")
    
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now())

    def to_dict(self):
        import json
        try:
            certs = json.loads(self.certificates)
        except:
            certs = []

        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "github_username": self.github_username,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "top_languages": self.top_languages,
            "github_account_age_days": self.github_account_age_days,
            "github_total_repos": self.github_total_repos,
            "github_score": self.github_score,
            "points": self.points,
            "feedbacks_sent": self.feedbacks_sent,
            "bugs_reported": self.bugs_reported,
            "egolpe_level": self.egolpe_level,
            "certificates": certs,
            "referral_code": self.referral_code,
            "referred_by_id": self.referred_by_id,
            "status": self.status,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class UpzPointsLedger(Base):
    """
    Tabela de Auditoria (Extrato) de UpzPoints.
    Registra cada transação de pontos (entrada ou saída) do desenvolvedor.
    """
    __tablename__ = "upzpoints_ledger"

    id = Column(Integer, primary_key=True, index=True)
    dev_profile_id = Column(Integer, ForeignKey("dev_tester_profiles.id"), nullable=False, index=True)
    
    amount = Column(Integer, nullable=False) # Positivo (ganhou) ou Negativo (gastou)
    reason = Column(String(255), nullable=False) # Ex: "App Founder Download", "Bug Critical Approved"
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relacionamento
    dev_profile = relationship("DevProfile", backref="ledger_entries")
    
    def to_dict(self):
        return {
            "id": self.id,
            "dev_profile_id": self.dev_profile_id,
            "amount": self.amount,
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class TesterEmailInvite(Base):
    """Email invitation owned by the developer who uploaded or entered it."""
    __tablename__ = "dev_tester_email_invites"
    __table_args__ = (
        UniqueConstraint("owner_profile_id", "invited_email", name="uq_tester_invite_owner_email"),
        UniqueConstraint("invite_code", name="uq_tester_invite_code"),
        UniqueConstraint("invitee_user_id", name="uq_tester_invite_invitee"),
    )

    id = Column(Integer, primary_key=True, index=True)
    owner_profile_id = Column(Integer, ForeignKey("dev_tester_profiles.id"), nullable=False, index=True)
    invited_email = Column(String(255), nullable=False)
    invite_code = Column(String(64), nullable=True)
    invitee_user_id = Column(Integer, ForeignKey("app_users.id"), nullable=True)
    email_sent_at = Column(DateTime, nullable=True)
    email_last_attempt_at = Column(DateTime, nullable=True)
    email_error = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    joined_at = Column(DateTime, nullable=True)


class DevNotification(Base):
    """
    Notificações pessoais do DevTester.
    """
    __tablename__ = "dev_notifications"

    id = Column(Integer, primary_key=True, index=True)
    dev_id = Column(Integer, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(String(500), nullable=False)
    icon = Column(String(50), default="bell") # bell, award, bug, check
    color = Column(String(20), default="blue") # indigo, rose, amber, emerald, blue
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.body,
            "time": self.created_at.isoformat() if self.created_at else None,
            "read": self.read,
            "icon": self.icon,
            "color": self.color
        }


class DailyCheckin(Base):
    """
    Registro de abertura diária do app do desenvolvedor para validar uso e liberar pontos.
    """
    __tablename__ = "dev_daily_checkins"
    __table_args__ = (
        UniqueConstraint("dev_profile_id", "opened_day", name="uq_daily_checkin_profile_day"),
    )

    id = Column(Integer, primary_key=True, index=True)
    dev_profile_id = Column(Integer, ForeignKey("dev_tester_profiles.id"), nullable=False, index=True)
    app_id = Column(String(120), nullable=False, index=True, default="upzlab-community")
    platform = Column(String(40), nullable=False, default="unknown")
    session_id = Column(String(255), nullable=True)
    timezone = Column(String(80), nullable=False, default="UTC")
    opened_at = Column(DateTime, nullable=False, server_default=func.now())
    opened_day = Column(String(20), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="approved")
    points_awarded = Column(Integer, default=0)
    alert_sent = Column(Boolean, default=False)
    last_seen_at = Column(DateTime, nullable=False, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    dev_profile = relationship("DevProfile", backref="daily_checkins")

    def to_dict(self):
        return {
            "id": self.id,
            "dev_profile_id": self.dev_profile_id,
            "app_id": self.app_id,
            "platform": self.platform,
            "session_id": self.session_id,
            "timezone": self.timezone,
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
            "opened_day": self.opened_day,
            "status": self.status,
            "points_awarded": self.points_awarded,
            "alert_sent": self.alert_sent,
            "last_seen_at": self.last_seen_at.isoformat() if self.last_seen_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DailyCheckinAlert(Base):
    """
    Alertas de compliance diário enviados ao dev quando ele não abriu o app na janela esperada.
    """
    __tablename__ = "dev_daily_checkin_alerts"
    __table_args__ = (
        UniqueConstraint("dev_profile_id", "alert_day", name="uq_daily_alert_profile_day"),
    )

    id = Column(Integer, primary_key=True, index=True)
    dev_profile_id = Column(Integer, ForeignKey("dev_tester_profiles.id"), nullable=False, index=True)
    app_id = Column(String(120), nullable=False, default="upzlab-community")
    alert_day = Column(String(20), nullable=False, index=True)
    alert_type = Column(String(30), nullable=False, default="warning")
    message = Column(String(500), nullable=False)
    is_resolved = Column(Boolean, default=False)
    email_last_attempt_at = Column(DateTime, nullable=True)
    email_sent_at = Column(DateTime, nullable=True)
    email_error = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)

    dev_profile = relationship("DevProfile", backref="daily_checkin_alerts")

    def to_dict(self):
        return {
            "id": self.id,
            "dev_profile_id": self.dev_profile_id,
            "app_id": self.app_id,
            "alert_type": self.alert_type,
            "message": self.message,
            "is_resolved": self.is_resolved,
            "email_sent_at": self.email_sent_at.isoformat() if self.email_sent_at else None,
            "email_error": self.email_error,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class SdkAppCheckin(Base):
    """App-specific foreground activity, separate from the account's daily reward."""
    __tablename__ = "dev_sdk_app_checkins"
    __table_args__ = (
        UniqueConstraint(
            "dev_profile_id",
            "app_id",
            "opened_day",
            name="uq_sdk_app_checkin_profile_app_day",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    dev_profile_id = Column(Integer, ForeignKey("dev_tester_profiles.id"), nullable=False, index=True)
    app_id = Column(String(255), nullable=False, index=True)
    platform = Column(String(40), nullable=False, default="unknown")
    session_id = Column(String(255), nullable=True)
    timezone = Column(String(80), nullable=False, default="UTC")
    opened_at = Column(DateTime, nullable=False, server_default=func.now())
    opened_day = Column(String(20), nullable=False, index=True)
    points_awarded = Column(Integer, nullable=False, default=0)
    last_seen_at = Column(DateTime, nullable=False, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
