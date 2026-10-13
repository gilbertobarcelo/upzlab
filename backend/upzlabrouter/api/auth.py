"""Autenticação compartilhada das rotas que usam uma UPZLAB_KEY."""
import hashlib
from datetime import datetime, timezone

from fastapi import Request
from sqlalchemy.orm import Session

from upzlabrouter.core.config import KEY_PREFIXES
from upzlabrouter.core.exceptions import RouterAuthError
from upzlabrouter.models.router_models import RouterApiKey


def authenticate_api_key(request: Request, db: Session) -> tuple[int, int]:
    authorization = request.headers.get("Authorization", "")
    scheme, _, raw_key = authorization.partition(" ")
    raw_key = raw_key.strip()
    if scheme.lower() != "bearer" or not raw_key.startswith(KEY_PREFIXES):
        raise RouterAuthError("Header Authorization ausente ou malformado.")

    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_record = (
        db.query(RouterApiKey)
        .filter(
            RouterApiKey.key_hash == key_hash,
            RouterApiKey.is_active.is_(True),
        )
        .first()
    )
    if key_record is None:
        raise RouterAuthError("UPZLAB_KEY inválida ou revogada.")

    key_record.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return key_record.dev_id, key_record.id
