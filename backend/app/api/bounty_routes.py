"""Desafios & Bounties: devs publicam desafios pagos em UpzPoints e escolhem o vencedor."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database.database import get_db
from app.models.bounty_models import Bounty, BountySubmission
from app.models.dev_tester_models import DevProfile, UpzPointsLedger
from app.services.community_auth import author_payload, current_profile_optional, require_profile
from app.services.gamification_service import add_points_and_level_up, get_level_for_points

router = APIRouter(prefix="/bounties", tags=["Bounties"])

CATEGORIES = {"bug": "Caça a bugs", "seguranca": "Segurança", "android": "Android", "web": "Web", "design": "UX/UI", "outro": "Outro"}
DIFFICULTIES = {"facil": "Fácil", "medio": "Médio", "dificil": "Difícil"}
MIN_REWARD, MAX_REWARD = 10, 10000


class BountyIn(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20, max_length=10000)
    category: str = "outro"
    difficulty: str = "medio"
    reward: int = Field(ge=MIN_REWARD, le=MAX_REWARD)
    deadline: Optional[datetime] = None


class SubmissionIn(BaseModel):
    body: str = Field(min_length=10, max_length=10000)
    link: Optional[str] = Field(default=None, max_length=500)


def _authors(db: Session, ids):
    rows = db.query(DevProfile).filter(DevProfile.user_id.in_(set(ids))).all() if ids else []
    return {p.user_id: author_payload(p) for p in rows}


def _iso(d):
    return d.isoformat() if d else None


def _bounty_dict(b: Bounty, authors: dict) -> dict:
    expired = bool(b.deadline and b.deadline < datetime.utcnow() and b.status == "open")
    return {
        "id": b.id, "title": b.title, "description": b.description,
        "category": b.category, "category_label": CATEGORIES.get(b.category, b.category),
        "difficulty": b.difficulty, "difficulty_label": DIFFICULTIES.get(b.difficulty, b.difficulty),
        "reward": b.reward, "deadline": _iso(b.deadline), "status": b.status, "expired": expired,
        "submission_count": b.submission_count, "created_at": _iso(b.created_at),
        "winner_submission_id": b.winner_submission_id,
        "author": authors.get(b.author_id) or {"user_id": b.author_id, "name": "Dev", "username": None, "avatar_url": None},
    }


def _debit(db: Session, profile: DevProfile, amount: int, reason: str):
    profile.points = (profile.points or 0) - amount
    profile.egolpe_level = get_level_for_points(profile.points)
    db.add(UpzPointsLedger(dev_profile_id=profile.id, amount=-amount, reason=reason))


def _credit_refund(db: Session, profile: DevProfile, amount: int, reason: str):
    profile.points = (profile.points or 0) + amount
    profile.egolpe_level = get_level_for_points(profile.points)
    db.add(UpzPointsLedger(dev_profile_id=profile.id, amount=amount, reason=reason))


@router.get("/meta")
def meta():
    return {
        "categories": [{"key": k, "label": v} for k, v in CATEGORIES.items()],
        "difficulties": [{"key": k, "label": v} for k, v in DIFFICULTIES.items()],
        "min_reward": MIN_REWARD, "max_reward": MAX_REWARD,
    }


@router.get("")
def list_bounties(
    status: str = Query("open", pattern="^(open|awarded|cancelled|all)$"),
    category: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Bounty)
    if status != "all":
        query = query.filter(Bounty.status == status)
    if category and category != "all":
        query = query.filter(Bounty.category == category)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(Bounty.title.ilike(like), Bounty.description.ilike(like)))
    items = query.order_by(Bounty.reward.desc(), Bounty.created_at.desc()).limit(100).all()
    authors = _authors(db, [b.author_id for b in items])
    return {"items": [_bounty_dict(b, authors) for b in items]}


@router.post("")
def create_bounty(payload: BountyIn, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    if payload.category not in CATEGORIES or payload.difficulty not in DIFFICULTIES:
        raise HTTPException(status_code=400, detail="Categoria ou dificuldade inválida.")
    if payload.deadline and payload.deadline.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="O prazo precisa estar no futuro.")
    if (profile.points or 0) < payload.reward:
        raise HTTPException(status_code=400, detail=f"Saldo insuficiente: você tem {profile.points or 0} UpzPoints.")
    bounty = Bounty(
        author_id=profile.user_id, title=payload.title.strip(), description=payload.description.strip(),
        category=payload.category, difficulty=payload.difficulty, reward=payload.reward,
        deadline=payload.deadline.replace(tzinfo=None) if payload.deadline else None,
    )
    db.add(bounty)
    _debit(db, profile, payload.reward, f"Bounty criado: {bounty.title[:60]}")
    db.commit()
    db.refresh(bounty)
    return _bounty_dict(bounty, _authors(db, [bounty.author_id]))


@router.get("/{bounty_id}")
def get_bounty(bounty_id: int, request: Request, db: Session = Depends(get_db)):
    bounty = db.query(Bounty).filter(Bounty.id == bounty_id).first()
    if not bounty:
        raise HTTPException(status_code=404, detail="Desafio não encontrado.")
    me = current_profile_optional(request, db)
    is_owner = bool(me and me.user_id == bounty.author_id)
    subs = db.query(BountySubmission).filter(BountySubmission.bounty_id == bounty_id).order_by(BountySubmission.created_at.asc()).all()
    authors = _authors(db, [bounty.author_id] + [s.author_id for s in subs])
    out = _bounty_dict(bounty, authors)
    out["is_owner"] = is_owner
    out["my_submission_id"] = next((s.id for s in subs if me and s.author_id == me.user_id), None)
    # Soluções só ficam visíveis para o dono do desafio, o próprio autor da solução e, após o encerramento, o vencedor.
    out["submissions"] = [
        {
            "id": s.id, "body": s.body, "link": s.link, "created_at": _iso(s.created_at),
            "is_winner": s.id == bounty.winner_submission_id,
            "author": authors.get(s.author_id) or {"user_id": s.author_id, "name": "Dev", "username": None, "avatar_url": None},
        }
        for s in subs
        if is_owner or (me and s.author_id == me.user_id) or s.id == bounty.winner_submission_id
    ]
    return out


@router.post("/{bounty_id}/submissions")
def submit(bounty_id: int, payload: SubmissionIn, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    bounty = db.query(Bounty).filter(Bounty.id == bounty_id).first()
    if not bounty:
        raise HTTPException(status_code=404, detail="Desafio não encontrado.")
    if bounty.status != "open":
        raise HTTPException(status_code=400, detail="Este desafio já foi encerrado.")
    if bounty.deadline and bounty.deadline < datetime.utcnow():
        raise HTTPException(status_code=400, detail="O prazo deste desafio acabou.")
    if bounty.author_id == profile.user_id:
        raise HTTPException(status_code=400, detail="Você não pode resolver o próprio desafio.")
    link = (payload.link or "").strip() or None
    if link and not link.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="O link precisa começar com http:// ou https://")
    if db.query(BountySubmission).filter_by(bounty_id=bounty_id, author_id=profile.user_id).first():
        raise HTTPException(status_code=400, detail="Você já enviou uma solução para este desafio.")
    sub = BountySubmission(bounty_id=bounty_id, author_id=profile.user_id, body=payload.body.strip(), link=link)
    db.add(sub)
    bounty.submission_count = (bounty.submission_count or 0) + 1
    db.commit()
    return {"ok": True, "id": sub.id}


@router.post("/{bounty_id}/award/{submission_id}")
def award(bounty_id: int, submission_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    bounty = db.query(Bounty).filter(Bounty.id == bounty_id).with_for_update().first()
    if not bounty:
        raise HTTPException(status_code=404, detail="Desafio não encontrado.")
    if bounty.author_id != profile.user_id:
        raise HTTPException(status_code=403, detail="Só o autor do desafio pode escolher o vencedor.")
    if bounty.status != "open":
        raise HTTPException(status_code=400, detail="Este desafio já foi encerrado.")
    sub = db.query(BountySubmission).filter_by(id=submission_id, bounty_id=bounty_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Solução não encontrada.")
    winner = db.query(DevProfile).filter(DevProfile.user_id == sub.author_id).first()
    if not winner:
        raise HTTPException(status_code=400, detail="Perfil do vencedor não encontrado.")
    add_points_and_level_up(db, winner, bounty.reward, f"Bounty vencido: {bounty.title[:60]}", commit=False)
    bounty.status = "awarded"
    bounty.winner_submission_id = sub.id
    db.commit()
    return {"ok": True}


@router.post("/{bounty_id}/cancel")
def cancel(bounty_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    bounty = db.query(Bounty).filter(Bounty.id == bounty_id).with_for_update().first()
    if not bounty:
        raise HTTPException(status_code=404, detail="Desafio não encontrado.")
    if bounty.author_id != profile.user_id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    if bounty.status != "open":
        raise HTTPException(status_code=400, detail="Este desafio já foi encerrado.")
    if bounty.submission_count:
        raise HTTPException(status_code=400, detail="Já existem soluções enviadas. Escolha um vencedor.")
    bounty.status = "cancelled"
    _credit_refund(db, profile, bounty.reward, f"Bounty cancelado (reembolso): {bounty.title[:60]}")
    db.commit()
    return {"ok": True}
