"""Fórum & Discussões da comunidade UpzLab."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database.database import get_db
from app.models.dev_tester_models import DevProfile
from app.models.forum_models import ForumReply, ForumTopic, ForumVote
from app.services.community_auth import author_payload, current_profile_optional, require_profile
from app.services.gamification_service import add_points_and_level_up

router = APIRouter(prefix="/forum", tags=["Forum"])

CATEGORIES = {
    "geral": "Geral",
    "android": "Android & Mobile",
    "web": "Web & Frontend",
    "backend": "Backend & APIs",
    "seguranca": "Segurança",
    "ux": "UX/UI",
    "testes": "Testes & Play Console",
    "carreira": "Carreira",
}
ACCEPTED_ANSWER_POINTS = 20


class TopicIn(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    body: str = Field(min_length=10, max_length=20000)
    category: str = "geral"


class ReplyIn(BaseModel):
    body: str = Field(min_length=2, max_length=10000)


def _authors(db: Session, ids):
    rows = db.query(DevProfile).filter(DevProfile.user_id.in_(set(ids))).all() if ids else []
    return {p.user_id: author_payload(p) for p in rows}


def _iso(d: Optional[datetime]):
    return d.isoformat() if d else None


def _topic_dict(t: ForumTopic, authors: dict) -> dict:
    return {
        "id": t.id, "category": t.category, "category_label": CATEGORIES.get(t.category, t.category),
        "title": t.title, "body": t.body, "views": t.views, "votes": t.votes,
        "reply_count": t.reply_count, "is_pinned": t.is_pinned, "is_closed": t.is_closed,
        "is_solved": t.is_solved, "created_at": _iso(t.created_at),
        "last_activity_at": _iso(t.last_activity_at),
        "author": authors.get(t.author_id) or {"user_id": t.author_id, "name": "Dev", "username": None, "avatar_url": None},
    }


@router.get("/categories")
def categories():
    return [{"key": k, "label": v} for k, v in CATEGORIES.items()]


@router.get("/topics")
def list_topics(
    category: Optional[str] = None,
    q: Optional[str] = None,
    sort: str = Query("recent", pattern="^(recent|top|unanswered)$"),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    query = db.query(ForumTopic)
    if category and category != "all":
        query = query.filter(ForumTopic.category == category)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(ForumTopic.title.ilike(like), ForumTopic.body.ilike(like)))
    if sort == "unanswered":
        query = query.filter(ForumTopic.reply_count == 0)
    order = ForumTopic.votes.desc() if sort == "top" else ForumTopic.last_activity_at.desc()
    total = query.count()
    topics = query.order_by(ForumTopic.is_pinned.desc(), order).offset((page - 1) * 20).limit(20).all()
    authors = _authors(db, [t.author_id for t in topics])
    return {"total": total, "page": page, "items": [_topic_dict(t, authors) for t in topics]}


@router.post("/topics")
def create_topic(payload: TopicIn, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Categoria inválida.")
    topic = ForumTopic(
        author_id=profile.user_id, category=payload.category,
        title=payload.title.strip(), body=payload.body.strip(),
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return _topic_dict(topic, _authors(db, [topic.author_id]))


@router.get("/topics/{topic_id}")
def get_topic(topic_id: int, request: Request, db: Session = Depends(get_db)):
    topic = db.query(ForumTopic).filter(ForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Tópico não encontrado.")
    topic.views = (topic.views or 0) + 1
    db.commit()
    replies = (
        db.query(ForumReply).filter(ForumReply.topic_id == topic_id)
        .order_by(ForumReply.is_accepted.desc(), ForumReply.votes.desc(), ForumReply.created_at.asc()).all()
    )
    authors = _authors(db, [topic.author_id] + [r.author_id for r in replies])
    me = current_profile_optional(request, db)
    voted = set()
    if me:
        votes = db.query(ForumVote).filter(ForumVote.user_id == me.user_id).all()
        voted = {(v.target_type, v.target_id) for v in votes}
    out = _topic_dict(topic, authors)
    out["voted"] = ("topic", topic.id) in voted
    out["can_moderate"] = bool(me and me.user_id == topic.author_id)
    out["replies"] = [
        {
            "id": r.id, "body": r.body, "votes": r.votes, "is_accepted": r.is_accepted,
            "created_at": _iso(r.created_at), "voted": ("reply", r.id) in voted,
            "author": authors.get(r.author_id) or {"user_id": r.author_id, "name": "Dev", "username": None, "avatar_url": None},
        }
        for r in replies
    ]
    return out


@router.post("/topics/{topic_id}/replies")
def create_reply(topic_id: int, payload: ReplyIn, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    topic = db.query(ForumTopic).filter(ForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Tópico não encontrado.")
    if topic.is_closed:
        raise HTTPException(status_code=400, detail="Este tópico está fechado.")
    reply = ForumReply(topic_id=topic_id, author_id=profile.user_id, body=payload.body.strip())
    db.add(reply)
    topic.reply_count = (topic.reply_count or 0) + 1
    topic.last_activity_at = func.now()
    db.commit()
    return {"ok": True, "id": reply.id}


@router.post("/vote/{target_type}/{target_id}")
def toggle_vote(target_type: str, target_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    model = {"topic": ForumTopic, "reply": ForumReply}.get(target_type)
    if not model:
        raise HTTPException(status_code=400, detail="Alvo inválido.")
    target = db.query(model).filter(model.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Não encontrado.")
    if target.author_id == profile.user_id:
        raise HTTPException(status_code=400, detail="Você não pode votar no próprio conteúdo.")
    vote = db.query(ForumVote).filter_by(user_id=profile.user_id, target_type=target_type, target_id=target_id).first()
    if vote:
        db.delete(vote)
        target.votes = max(0, (target.votes or 0) - 1)
        voted = False
    else:
        db.add(ForumVote(user_id=profile.user_id, target_type=target_type, target_id=target_id))
        target.votes = (target.votes or 0) + 1
        voted = True
    db.commit()
    return {"votes": target.votes, "voted": voted}


@router.post("/replies/{reply_id}/accept")
def accept_reply(reply_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Resposta não encontrada.")
    topic = db.query(ForumTopic).filter(ForumTopic.id == reply.topic_id).first()
    if topic.author_id != profile.user_id:
        raise HTTPException(status_code=403, detail="Só o autor do tópico pode aceitar uma resposta.")
    already = db.query(ForumReply).filter(ForumReply.topic_id == topic.id, ForumReply.is_accepted.is_(True)).first()
    if already:
        already.is_accepted = False
    reply.is_accepted = True
    topic.is_solved = True
    if reply.author_id != profile.user_id and not already:
        winner = db.query(DevProfile).filter(DevProfile.user_id == reply.author_id).first()
        if winner:
            add_points_and_level_up(db, winner, ACCEPTED_ANSWER_POINTS, "Resposta aceita no fórum", commit=False)
    db.commit()
    return {"ok": True}


@router.post("/topics/{topic_id}/close")
def toggle_close(topic_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    topic = db.query(ForumTopic).filter(ForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Tópico não encontrado.")
    if topic.author_id != profile.user_id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    topic.is_closed = not topic.is_closed
    db.commit()
    return {"is_closed": topic.is_closed}


@router.delete("/topics/{topic_id}")
def delete_topic(topic_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    topic = db.query(ForumTopic).filter(ForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Tópico não encontrado.")
    if topic.author_id != profile.user_id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    db.query(ForumReply).filter(ForumReply.topic_id == topic_id).delete()
    db.query(ForumVote).filter(ForumVote.target_type == "topic", ForumVote.target_id == topic_id).delete()
    db.delete(topic)
    db.commit()
    return {"ok": True}
