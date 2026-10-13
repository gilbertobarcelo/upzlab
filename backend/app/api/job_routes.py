"""Vagas & Networking: devs publicam vagas e outros devs se candidatam pelo perfil UpzLab."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database.database import get_db
from app.models.dev_tester_models import DevProfile
from app.models.job_models import Job, JobApplication
from app.services.community_auth import author_payload, current_profile_optional, require_profile

router = APIRouter(prefix="/jobs", tags=["Jobs"])

TYPES = {"clt": "CLT", "pj": "PJ", "freela": "Freelance", "estagio": "Estágio"}
LEVELS = {"junior": "Júnior", "pleno": "Pleno", "senior": "Sênior", "qualquer": "Qualquer nível"}


class JobIn(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    company: str = Field(min_length=2, max_length=150)
    job_type: str = "clt"
    level: str = "pleno"
    location: Optional[str] = Field(default=None, max_length=150)
    is_remote: bool = True
    salary: Optional[str] = Field(default=None, max_length=100)
    description: str = Field(min_length=30, max_length=10000)
    tags: Optional[str] = Field(default=None, max_length=300)
    apply_url: Optional[str] = Field(default=None, max_length=500)


class ApplyIn(BaseModel):
    message: str = Field(min_length=10, max_length=3000)


def _authors(db: Session, ids):
    rows = db.query(DevProfile).filter(DevProfile.user_id.in_(set(ids))).all() if ids else []
    return {p.user_id: author_payload(p) for p in rows}


def _iso(d):
    return d.isoformat() if d else None


def _unknown(uid):
    return {"user_id": uid, "name": "Dev", "username": None, "avatar_url": None}


def _job_dict(j: Job, authors: dict) -> dict:
    return {
        "id": j.id, "title": j.title, "company": j.company,
        "job_type": j.job_type, "job_type_label": TYPES.get(j.job_type, j.job_type),
        "level": j.level, "level_label": LEVELS.get(j.level, j.level),
        "location": j.location, "is_remote": j.is_remote, "salary": j.salary,
        "description": j.description, "tags": [t for t in (j.tags or "").split(",") if t],
        "apply_url": j.apply_url, "status": j.status, "application_count": j.application_count,
        "created_at": _iso(j.created_at), "author": authors.get(j.author_id) or _unknown(j.author_id),
    }


@router.get("/meta")
def meta():
    return {
        "types": [{"key": k, "label": v} for k, v in TYPES.items()],
        "levels": [{"key": k, "label": v} for k, v in LEVELS.items()],
    }


@router.get("")
def list_jobs(
    q: Optional[str] = None,
    job_type: Optional[str] = None,
    remote: Optional[bool] = None,
    mine: bool = False,
    request: Request = None,
    db: Session = Depends(get_db),
):
    query = db.query(Job)
    if mine:
        query = query.filter(Job.author_id == require_profile(request, db).user_id)
    else:
        query = query.filter(Job.status == "open")
    if job_type and job_type != "all":
        query = query.filter(Job.job_type == job_type)
    if remote is not None:
        query = query.filter(Job.is_remote.is_(remote))
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(Job.title.ilike(like), Job.company.ilike(like), Job.tags.ilike(like), Job.location.ilike(like)))
    items = query.order_by(Job.created_at.desc()).limit(100).all()
    authors = _authors(db, [j.author_id for j in items])
    return {"items": [_job_dict(j, authors) for j in items]}


@router.post("")
def create_job(payload: JobIn, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    if payload.job_type not in TYPES or payload.level not in LEVELS:
        raise HTTPException(status_code=400, detail="Tipo ou nível inválido.")
    url = (payload.apply_url or "").strip() or None
    if url and not url.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="O link de candidatura precisa começar com http:// ou https://")
    tags = ",".join(dict.fromkeys(t.strip()[:30] for t in (payload.tags or "").split(",") if t.strip()))[:300]
    job = Job(
        author_id=profile.user_id, title=payload.title.strip(), company=payload.company.strip(),
        job_type=payload.job_type, level=payload.level, location=(payload.location or "").strip() or None,
        is_remote=payload.is_remote, salary=(payload.salary or "").strip() or None,
        description=payload.description.strip(), tags=tags or None, apply_url=url,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_dict(job, _authors(db, [job.author_id]))


@router.get("/{job_id}")
def get_job(job_id: int, request: Request, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada.")
    me = current_profile_optional(request, db)
    is_owner = bool(me and me.user_id == job.author_id)
    apps = db.query(JobApplication).filter(JobApplication.job_id == job_id).order_by(JobApplication.created_at.desc()).all()
    authors = _authors(db, [job.author_id] + [a.applicant_id for a in apps])
    out = _job_dict(job, authors)
    out["is_owner"] = is_owner
    out["applied"] = bool(me and any(a.applicant_id == me.user_id for a in apps))
    out["applications"] = [
        {"id": a.id, "message": a.message, "created_at": _iso(a.created_at), "applicant": authors.get(a.applicant_id) or _unknown(a.applicant_id)}
        for a in apps
    ] if is_owner else []
    return out


@router.post("/{job_id}/apply")
def apply(job_id: int, payload: ApplyIn, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada.")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Esta vaga foi encerrada.")
    if job.author_id == profile.user_id:
        raise HTTPException(status_code=400, detail="Você não pode se candidatar à própria vaga.")
    if db.query(JobApplication).filter_by(job_id=job_id, applicant_id=profile.user_id).first():
        raise HTTPException(status_code=400, detail="Você já se candidatou a esta vaga.")
    db.add(JobApplication(job_id=job_id, applicant_id=profile.user_id, message=payload.message.strip()))
    job.application_count = (job.application_count or 0) + 1
    db.commit()
    return {"ok": True}


@router.post("/{job_id}/toggle")
def toggle(job_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada.")
    if job.author_id != profile.user_id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    job.status = "closed" if job.status == "open" else "open"
    db.commit()
    return {"status": job.status}


@router.delete("/{job_id}")
def delete_job(job_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada.")
    if job.author_id != profile.user_id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    db.query(JobApplication).filter(JobApplication.job_id == job_id).delete()
    db.delete(job)
    db.commit()
    return {"ok": True}
