import html as html_lib
import json
import os
import re
import smtplib
from pathlib import Path
from email.message import EmailMessage
from typing import Optional


def load_smtp_config() -> dict:
    """SMTP salvo pelo upzcontroll (tabela upzlab_config, chave 'smtp'); .env é fallback."""
    cfg = {}
    try:
        from database.database import SessionLocal
        from app.models.config_models import UpzLabConfig

        db = SessionLocal()
        try:
            row = db.query(UpzLabConfig).filter(UpzLabConfig.config_key == "smtp").first()
            if row and row.config_value:
                cfg = json.loads(row.config_value)
        finally:
            db.close()
    except Exception:
        cfg = {}

    host = (cfg.get("host") or os.getenv("SMTP_HOST", "")).strip()
    return {
        "host": host,
        "port": int(cfg.get("port") or os.getenv("SMTP_PORT", "587")),
        "username": (cfg.get("username") or os.getenv("SMTP_USER", "")).strip(),
        "password": cfg.get("password") or os.getenv("SMTP_PASSWORD", ""),
        "sender": (cfg.get("sender") or os.getenv("SMTP_FROM", "")).strip(),
        "use_tls": bool(cfg["use_tls"]) if "use_tls" in cfg else os.getenv("SMTP_USE_TLS", "true").lower() == "true",
    }


def smtp_configured() -> bool:
    cfg = load_smtp_config()
    return bool(cfg["host"] and cfg["sender"])


def _site_url() -> str:
    return os.getenv("UPZLAB_PUBLIC_URL", "http://localhost:3003").rstrip("/")


def _wordmark_html() -> str:
    return '<img src="cid:upzlablogo" alt="UpzLab" width="124" height="48" style="display:block;border:0;outline:none">'


def render_email(title: str, text: str, button_label: Optional[str] = None, button_url: Optional[str] = None,
                 footer: str = "", extra_buttons: Optional[list] = None) -> str:
    """HTML padrão dos e-mails da UpzLab (compatível com clientes de e-mail: tabelas e estilos inline)."""
    paragraphs = "".join(
        f'<p style="margin:0 0 14px;color:#b4bac2;font-size:15px;line-height:1.6">{_linkify(p)}</p>'
        for p in [p.strip() for p in text.split("\n\n")] if p
    )
    button = ""
    for label, url in ([(button_label, button_url)] if button_label and button_url else []) + list(extra_buttons or []):
        safe = html_lib.escape(url, quote=True)
        button += (
            f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px"><tr>'
            f'<td bgcolor="#ffffff" style="background:#ffffff;border-radius:8px">'
            f'<a href="{safe}" style="display:inline-block;padding:13px 28px;color:#0d0d0d;background:#ffffff;'
            f'text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;font-family:Arial,Helvetica,sans-serif">'
            f'<span style="color:#0d0d0d">{html_lib.escape(label)}</span></a></td></tr></table>'
        )
    if button:
        button = f'<div style="margin-top:22px">{button}</div>'
    foot = html_lib.escape(footer) if footer else "Este é um e-mail automático da comunidade UpzLab. Não responda a esta mensagem."
    return (
        '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050505">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px"><tr><td align="center">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0d0d0d;border:1px solid #1f2328;border-radius:14px">'
        f'<tr><td style="padding:28px 32px 8px">{_wordmark_html()}</td></tr>'
        f'<tr><td style="padding:12px 32px 4px"><h1 style="margin:0 0 16px;color:#f4f6f7;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:600">{html_lib.escape(title)}</h1>'
        f'<div style="font-family:Arial,Helvetica,sans-serif">{paragraphs}{button}</div></td></tr>'
        f'<tr><td style="padding:16px 32px 28px;border-top:1px solid #1f2328;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px">{foot}</td></tr>'
        '</table></td></tr></table></body></html>'
    )


def _linkify(text: str) -> str:
    escaped = html_lib.escape(text).replace("\n", "<br>")
    return re.sub(r"(https?://[^\s<]+)", r'<a href="\1" style="color:#c4b5fd">\1</a>', escaped)


def send_email(recipient: str, subject: str, body: str, html: Optional[str] = None) -> None:
    cfg = load_smtp_config()
    if not cfg["host"] or not cfg["sender"]:
        raise RuntimeError("SMTP não configurado. Configure em upzcontroll > UpzLab > Configurações.")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = cfg["sender"]
    message["To"] = recipient
    message.set_content(body)
    html = html or render_email(subject, body)
    if html:
        message.add_alternative(html, subtype="html")
        if "cid:upzlablogo" in html:
            logo = Path(__file__).resolve().parent.parent / "assets" / "upzlab-wordmark-email.png"
            if logo.exists():
                message.get_payload()[1].add_related(logo.read_bytes(), "image", "png", cid="<upzlablogo>")

    if cfg["port"] == 465:
        with smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=15) as smtp:
            if cfg["username"]:
                smtp.login(cfg["username"], cfg["password"])
            smtp.send_message(message)
        return

    with smtplib.SMTP(cfg["host"], cfg["port"], timeout=15) as smtp:
        if cfg["use_tls"]:
            smtp.starttls()
        if cfg["username"]:
            smtp.login(cfg["username"], cfg["password"])
        smtp.send_message(message)
