"""
Billing de UpzPoints para chamadas ao UpzLabRouter.
Modelos free = 0 pts. Modelos pagos = X pts por 1K tokens.
Staff (STAFF_USER_ID) é sempre isento.
"""
from sqlalchemy.orm import Session
from upzlabrouter.core.config import MODEL_CATALOG, STAFF_USER_ID
from upzlabrouter.core.exceptions import RouterQuotaError
from app.models.dev_tester_models import DevProfile


def calculate_cost(model_alias: str, total_tokens: int) -> int:
    """Retorna o custo em UpzPoints para a chamada. 0 para modelos free."""
    spec = MODEL_CATALOG.get(model_alias, {})
    pts_per_1k = spec.get("pts_per_1k", 0)
    if pts_per_1k == 0:
        return 0
    return max(1, round(total_tokens * pts_per_1k / 1000))


def check_and_debit(dev_id: int, model_alias: str, total_tokens: int, db: Session) -> int:
    """
    Verifica saldo e debita UpzPoints.
    Retorna o custo debitado (0 para modelos free).
    Levanta RouterQuotaError se saldo insuficiente.
    """
    cost = calculate_cost(model_alias, total_tokens)
    if cost == 0 or dev_id == STAFF_USER_ID:
        return 0

    profile = db.query(DevProfile).filter(DevProfile.user_id == dev_id).first()
    if not profile:
        raise RouterQuotaError("Perfil não encontrado.")
    if (profile.points or 0) < cost:
        raise RouterQuotaError(
            f"Saldo insuficiente. Necessário: {cost} pts. Seu saldo: {profile.points} pts."
        )

    from app.services.gamification_service import add_points_and_level_up
    add_points_and_level_up(db, profile, -cost, f"UpzLabRouter: uso do modelo {model_alias}")
    return cost
