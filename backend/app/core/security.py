"""
Módulo central de autenticação JWT do backend UpzLab.

- Mantém o segredo em um único lugar, SEM fallback previsível:
  se JWT_SECRET_KEY não estiver configurada, o servidor não sobe.
- Expõe helpers compartilhados para ler o token a partir do cookie
  ou do header Authorization, evitando cópias duplicadas nos routers.
"""
import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY não configurada. Gere uma com: "
        "python3 -c \"import secrets; print(secrets.token_hex(32))\" "
        "e adicione JWT_SECRET_KEY=<valor> ao backend/.env"
    )

ALGORITHM = "HS256"

import jwt  # PyJWT
from fastapi import Request


def get_token_from_request(request: Request) -> Optional[str]:
    """Lê o JWT do cookie da comunidade ou do header Authorization."""
    token = request.cookies.get("upzlab_dev_jwt")
    if not token:
        token = request.cookies.get("auth_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
    return token or None


def decode_token(token: str) -> Optional[dict]:
    """Decodifica/valida o JWT. Retorna None se inválido ou expirado."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None


def get_user_id_optional(request: Request) -> Optional[str]:
    """Retorna o `sub` (AppUser.id) do token presente na requisição, ou None."""
    token = get_token_from_request(request)
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None
