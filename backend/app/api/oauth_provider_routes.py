"""
UpzLab como provedor de login (OAuth 2.0 authorization code) para ferramentas internas,
como o Postiz (POSTIZ_GENERIC_OAUTH).

Configuração (backend/.env):
  POSTIZ_OAUTH_CLIENT_ID, POSTIZ_OAUTH_CLIENT_SECRET
  POSTIZ_OAUTH_REDIRECT_URIS   (separados por vírgula; padrão http://localhost:4007/settings)
  POSTIZ_OAUTH_ALLOWED_EMAILS  (opcional; além do staff UpzLab)
"""
import hmac
import html
import os
import secrets
import time
import urllib.parse
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.passwords import verify_password
from app.core.security import ALGORITHM, SECRET_KEY, get_user_id_optional
from app.models.dev_tester_models import DevProfile
from app.models.user_models import AppUser
from database.database import get_db

# Chave própria: tokens OAuth nunca podem ser aceitos como sessão do UpzLab.
_KEY = hmac.new(SECRET_KEY.encode(), b"upzlab-oauth-provider", "sha256").hexdigest()


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, _KEY, algorithms=[ALGORITHM])
    except Exception:
        return None


router = APIRouter(prefix="/oauth", tags=["oauth-provider"])

CODE_TTL = 300
ACCESS_TTL = 3600
MAX_FAILS = 5
FAIL_WINDOW = 600

_used_codes: dict = {}
_fails: dict = {}


def _client() -> tuple:
    cid = os.getenv("POSTIZ_OAUTH_CLIENT_ID", "").strip()
    secret = os.getenv("POSTIZ_OAUTH_CLIENT_SECRET", "").strip()
    if not cid or not secret:
        raise HTTPException(status_code=503, detail="OAuth não configurado")
    return cid, secret


def _redirect_uris() -> list:
    raw = os.getenv("POSTIZ_OAUTH_REDIRECT_URIS", "http://localhost:4007/settings")
    return [u.strip() for u in raw.split(",") if u.strip()]


def _is_allowed(user: AppUser, db: Session) -> bool:
    if not user or not user.is_active or not user.email:
        return False
    allowed = {e.strip().lower() for e in os.getenv("POSTIZ_OAUTH_ALLOWED_EMAILS", "").split(",") if e.strip()}
    if user.email.lower() in allowed:
        return True
    profile = db.query(DevProfile).filter(DevProfile.user_id == user.id).first()
    return bool(profile and getattr(profile, "is_staff", False))


def _validate_params(client_id: str, redirect_uri: str, response_type: str) -> None:
    cid, _ = _client()
    if not hmac.compare_digest(client_id or "", cid):
        raise HTTPException(status_code=400, detail="client_id inválido")
    if redirect_uri not in _redirect_uris():
        raise HTTPException(status_code=400, detail="redirect_uri não autorizado")
    if response_type != "code":
        raise HTTPException(status_code=400, detail="response_type não suportado")


def _issue_code(user: AppUser, client_id: str, redirect_uri: str) -> str:
    now = datetime.utcnow()
    return jwt.encode(
        {
            "typ": "oauth_code",
            "sub": str(user.id),
            "cid": client_id,
            "ru": redirect_uri,
            "jti": secrets.token_urlsafe(16),
            "exp": now + timedelta(seconds=CODE_TTL),
        },
        _KEY,
        algorithm=ALGORITHM,
    )


def _finish(user: AppUser, client_id: str, redirect_uri: str, state: str) -> RedirectResponse:
    params = {"code": _issue_code(user, client_id, redirect_uri)}
    if state:
        params["state"] = state
    sep = "&" if "?" in redirect_uri else "?"
    return RedirectResponse(f"{redirect_uri}{sep}{urllib.parse.urlencode(params)}", status_code=302)


def _form_page(params: dict, error: str = "") -> HTMLResponse:
    hidden = "".join(
        f'<input type="hidden" name="{html.escape(k)}" value="{html.escape(v or "")}">' for k, v in params.items()
    )
    err = f'<p class="err">{html.escape(error)}</p>' if error else ""
    page = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Entrar com UpzLab</title>
<style>
body{{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0f;color:#fff;font-family:system-ui,sans-serif}}
form{{width:340px;padding:32px;border:1px solid #2a2a35;border-radius:16px;background:#12121a}}
h1{{font-size:20px;margin:0 0 6px}} p.sub{{color:#9a9aa8;font-size:13px;margin:0 0 20px}}
input[type=email],input[type=password]{{width:100%;box-sizing:border-box;padding:12px;margin-bottom:12px;border-radius:10px;border:1px solid #2a2a35;background:#0a0a0f;color:#fff}}
button{{width:100%;padding:12px;border:0;border-radius:10px;background:#fff;color:#000;font-weight:700;cursor:pointer}}
.err{{color:#ff6b6b;font-size:13px}}
</style></head><body>
<form method="post" action="">
<h1>Entrar com UpzLab</h1><p class="sub">Use a sua conta UpzLab (acesso restrito à equipe).</p>
{err}{hidden}
<input type="email" name="email" placeholder="E-mail" required autofocus>
<input type="password" name="password" placeholder="Senha" required>
<button type="submit">Entrar</button>
</form></body></html>"""
    return HTMLResponse(page, headers={"Cache-Control": "no-store", "X-Frame-Options": "DENY"})


_PARAM_KEYS = ("client_id", "redirect_uri", "response_type", "state", "scope")


@router.get("/authorize")
async def authorize(request: Request, db: Session = Depends(get_db)):
    q = request.query_params
    params = {k: q.get(k, "") for k in _PARAM_KEYS}
    _validate_params(params["client_id"], params["redirect_uri"], params["response_type"])

    user_id = get_user_id_optional(request)
    if user_id and user_id.isdigit():
        user = db.query(AppUser).filter(AppUser.id == int(user_id)).first()
        if _is_allowed(user, db):
            return _finish(user, params["client_id"], params["redirect_uri"], params["state"])
    return _form_page(params)


@router.post("/authorize")
async def authorize_submit(request: Request, db: Session = Depends(get_db)):
    body = urllib.parse.parse_qs((await request.body()).decode("utf-8", "ignore"))
    get = lambda k: (body.get(k) or [""])[0]
    params = {k: get(k) for k in _PARAM_KEYS}
    _validate_params(params["client_id"], params["redirect_uri"], params["response_type"])

    ip = request.client.host if request.client else "?"
    now = time.time()
    attempts = [t for t in _fails.get(ip, []) if now - t < FAIL_WINDOW]
    if len(attempts) >= MAX_FAILS:
        return _form_page(params, "Muitas tentativas. Aguarde alguns minutos.")

    email = get("email").strip().lower()
    password = get("password")
    user = db.query(AppUser).filter(func.lower(AppUser.email) == email).first() if email else None
    valid = bool(
        user
        and user.password_hash
        and user.password_hash.startswith(("$2a$", "$2b$", "$2y$"))
        and verify_password(password, user.password_hash)
    )
    if not valid or not _is_allowed(user, db):
        attempts.append(now)
        _fails[ip] = attempts
        return _form_page(params, "Credenciais inválidas ou sem permissão.")

    _fails.pop(ip, None)
    return _finish(user, params["client_id"], params["redirect_uri"], params["state"])


@router.post("/token")
async def token(request: Request):
    body = urllib.parse.parse_qs((await request.body()).decode("utf-8", "ignore"))
    get = lambda k: (body.get(k) or [""])[0]
    cid, secret = _client()

    if get("grant_type") != "authorization_code":
        return JSONResponse({"error": "unsupported_grant_type"}, status_code=400)
    if not (hmac.compare_digest(get("client_id"), cid) and hmac.compare_digest(get("client_secret"), secret)):
        return JSONResponse({"error": "invalid_client"}, status_code=401)

    payload = decode_token(get("code"))
    now = time.time()
    for jti in [j for j, exp in _used_codes.items() if exp < now]:
        _used_codes.pop(jti, None)
    if (
        not payload
        or payload.get("typ") != "oauth_code"
        or payload.get("cid") != cid
        or payload.get("ru") != get("redirect_uri")
        or payload.get("jti") in _used_codes
    ):
        return JSONResponse({"error": "invalid_grant"}, status_code=400)
    _used_codes[payload["jti"]] = now + CODE_TTL

    access = jwt.encode(
        {"typ": "oauth_access", "sub": payload["sub"], "exp": datetime.utcnow() + timedelta(seconds=ACCESS_TTL)},
        _KEY,
        algorithm=ALGORITHM,
    )
    return JSONResponse(
        {"access_token": access, "token_type": "Bearer", "expires_in": ACCESS_TTL},
        headers={"Cache-Control": "no-store"},
    )


@router.get("/userinfo")
async def userinfo(request: Request, db: Session = Depends(get_db)):
    auth = request.headers.get("Authorization", "")
    payload = decode_token(auth.split(" ", 1)[1]) if auth.startswith("Bearer ") else None
    if not payload or payload.get("typ") != "oauth_access":
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(AppUser).filter(AppUser.id == int(payload["sub"])).first()
    if not _is_allowed(user, db):
        raise HTTPException(status_code=403, detail="Sem permissão")
    return {"sub": str(user.id), "email": user.email, "name": user.name or user.email}
