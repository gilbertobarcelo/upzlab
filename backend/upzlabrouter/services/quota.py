"""
Controle de cota por provedor.
Incrementa uso diário, reseta à meia-noite UTC e verifica disponibilidade.
"""
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from upzlabrouter.models.router_models import RouterProviderStatus
from upzlabrouter.core.config import PROVIDER_DAILY_LIMITS


def get_or_create_status(provider: str, db: Session) -> RouterProviderStatus:
    status = db.query(RouterProviderStatus).filter(
        RouterProviderStatus.provider == provider
    ).first()
    if not status:
        status = RouterProviderStatus(
            provider=provider,
            daily_used=0,
            daily_limit=PROVIDER_DAILY_LIMITS.get(provider, 1000),
            is_active=True,
        )
        db.add(status)
        db.commit()
        db.refresh(status)
    return status


def reset_if_new_day(status: RouterProviderStatus, db: Session) -> RouterProviderStatus:
    """Reseta o contador diário se já passou da meia-noite UTC."""
    if not status.last_reset:
        return status
    last = status.last_reset if status.last_reset.tzinfo else status.last_reset.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if last.date() < now.date():
        status.daily_used = 0
        status.last_reset = now
        db.commit()
    return status


def can_use(provider: str, db: Session) -> bool:
    """Retorna True se o provedor ainda tem cota disponível hoje."""
    status = get_or_create_status(provider, db)
    status = reset_if_new_day(status, db)
    if not status.is_active:
        return False
    return status.daily_used < status.daily_limit


def increment(provider: str, db: Session):
    """Incrementa o contador de uso do provedor."""
    status = get_or_create_status(provider, db)
    reset_if_new_day(status, db)
    status.daily_used = (status.daily_used or 0) + 1
    db.commit()


def get_all_status(db: Session) -> list[dict]:
    """Retorna status de todos os provedores para o dashboard."""
    statuses = db.query(RouterProviderStatus).all()
    result = []
    for s in statuses:
        reset_if_new_day(s, db)
        result.append({
            "provider": s.provider,
            "daily_used": s.daily_used,
            "daily_limit": s.daily_limit,
            "remaining": max(0, s.daily_limit - (s.daily_used or 0)),
            "is_active": s.is_active,
            "last_reset": s.last_reset.isoformat() if s.last_reset else None,
        })
    return result
