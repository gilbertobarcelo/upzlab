"""Cursos & Masterclass: devs publicam cursos com aulas; alunos se matriculam e marcam progresso."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database.database import get_db
from app.models.course_models import Course, CourseEnrollment, CourseLesson, LessonProgress
from app.models.dev_tester_models import DevProfile
from app.services.community_auth import author_payload, current_profile_optional, require_profile

router = APIRouter(prefix="/courses", tags=["Courses"])

CATEGORIES = {"qa": "QA & Testes", "seguranca": "Segurança", "android": "Android", "web": "Web", "backend": "Backend", "design": "UX/UI", "carreira": "Carreira", "outro": "Outro"}
LEVELS = {"iniciante": "Iniciante", "intermediario": "Intermediário", "avancado": "Avançado"}


class CourseIn(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20, max_length=5000)
    category: str = "outro"
    level: str = "iniciante"


class LessonIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: Optional[str] = Field(default=None, max_length=20000)
    video_url: Optional[str] = Field(default=None, max_length=500)


def _authors(db: Session, ids):
    rows = db.query(DevProfile).filter(DevProfile.user_id.in_(set(ids))).all() if ids else []
    return {p.user_id: author_payload(p) for p in rows}


def _unknown(uid):
    return {"user_id": uid, "name": "Dev", "username": None, "avatar_url": None}


def _course_dict(c: Course, authors: dict) -> dict:
    return {
        "id": c.id, "title": c.title, "description": c.description,
        "category": c.category, "category_label": CATEGORIES.get(c.category, c.category),
        "level": c.level, "level_label": LEVELS.get(c.level, c.level),
        "is_published": c.is_published, "lesson_count": c.lesson_count, "enrolled_count": c.enrolled_count,
        "author": authors.get(c.author_id) or _unknown(c.author_id),
    }


def _own_course(db: Session, course_id: int, profile: DevProfile) -> Course:
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    if c.author_id != profile.user_id:
        raise HTTPException(status_code=403, detail="Sem permissão.")
    return c


def _clean_video(url: Optional[str]) -> Optional[str]:
    url = (url or "").strip() or None
    if url and not url.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="O link do vídeo precisa começar com http:// ou https://")
    return url


@router.get("/meta")
def meta():
    return {
        "categories": [{"key": k, "label": v} for k, v in CATEGORIES.items()],
        "levels": [{"key": k, "label": v} for k, v in LEVELS.items()],
    }


@router.get("")
def list_courses(
    q: Optional[str] = None,
    category: Optional[str] = None,
    scope: str = Query("all", pattern="^(all|mine|enrolled)$"),
    request: Request = None,
    db: Session = Depends(get_db),
):
    query = db.query(Course)
    if scope == "mine":
        query = query.filter(Course.author_id == require_profile(request, db).user_id)
    elif scope == "enrolled":
        me = require_profile(request, db)
        ids = [e.course_id for e in db.query(CourseEnrollment).filter_by(user_id=me.user_id).all()]
        query = query.filter(Course.id.in_(ids), Course.is_published.is_(True))
    else:
        query = query.filter(Course.is_published.is_(True))
    if category and category != "all":
        query = query.filter(Course.category == category)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(Course.title.ilike(like), Course.description.ilike(like)))
    items = query.order_by(Course.enrolled_count.desc(), Course.created_at.desc()).limit(100).all()
    authors = _authors(db, [c.author_id for c in items])
    return {"items": [_course_dict(c, authors) for c in items]}


@router.post("")
def create_course(payload: CourseIn, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    if payload.category not in CATEGORIES or payload.level not in LEVELS:
        raise HTTPException(status_code=400, detail="Categoria ou nível inválido.")
    c = Course(author_id=profile.user_id, title=payload.title.strip(), description=payload.description.strip(), category=payload.category, level=payload.level)
    db.add(c)
    db.commit()
    db.refresh(c)
    return _course_dict(c, _authors(db, [c.author_id]))


@router.get("/{course_id}")
def get_course(course_id: int, request: Request, db: Session = Depends(get_db)):
    c = db.query(Course).filter(Course.id == course_id).first()
    me = current_profile_optional(request, db)
    is_owner = bool(c and me and me.user_id == c.author_id)
    if not c or (not c.is_published and not is_owner):
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    lessons = db.query(CourseLesson).filter(CourseLesson.course_id == course_id).order_by(CourseLesson.position, CourseLesson.id).all()
    enrolled = bool(me and db.query(CourseEnrollment).filter_by(course_id=course_id, user_id=me.user_id).first())
    done = set()
    if me:
        done = {p.lesson_id for p in db.query(LessonProgress).filter_by(course_id=course_id, user_id=me.user_id).all()}
    can_view = enrolled or is_owner
    out = _course_dict(c, _authors(db, [c.author_id]))
    out.update({
        "is_owner": is_owner, "enrolled": enrolled, "completed_count": len(done & {l.id for l in lessons}),
        # Conteúdo das aulas só para alunos matriculados ou o autor.
        "lessons": [
            {
                "id": l.id, "position": l.position, "title": l.title, "done": l.id in done,
                "content": l.content if can_view else None, "video_url": l.video_url if can_view else None,
            }
            for l in lessons
        ],
    })
    return out


@router.put("/{course_id}")
def update_course(course_id: int, payload: CourseIn, request: Request, db: Session = Depends(get_db)):
    c = _own_course(db, course_id, require_profile(request, db))
    if payload.category not in CATEGORIES or payload.level not in LEVELS:
        raise HTTPException(status_code=400, detail="Categoria ou nível inválido.")
    c.title, c.description, c.category, c.level = payload.title.strip(), payload.description.strip(), payload.category, payload.level
    db.commit()
    return {"ok": True}


@router.post("/{course_id}/publish")
def toggle_publish(course_id: int, request: Request, db: Session = Depends(get_db)):
    c = _own_course(db, course_id, require_profile(request, db))
    if not c.is_published and c.lesson_count < 1:
        raise HTTPException(status_code=400, detail="Adicione pelo menos uma aula antes de publicar.")
    c.is_published = not c.is_published
    db.commit()
    return {"is_published": c.is_published}


@router.delete("/{course_id}")
def delete_course(course_id: int, request: Request, db: Session = Depends(get_db)):
    c = _own_course(db, course_id, require_profile(request, db))
    for model in (LessonProgress, CourseEnrollment):
        db.query(model).filter(model.course_id == course_id).delete()
    db.query(CourseLesson).filter(CourseLesson.course_id == course_id).delete()
    db.delete(c)
    db.commit()
    return {"ok": True}


@router.post("/{course_id}/lessons")
def add_lesson(course_id: int, payload: LessonIn, request: Request, db: Session = Depends(get_db)):
    c = _own_course(db, course_id, require_profile(request, db))
    if not (payload.content or "").strip() and not (payload.video_url or "").strip():
        raise HTTPException(status_code=400, detail="Informe o conteúdo ou o link do vídeo da aula.")
    lesson = CourseLesson(course_id=course_id, position=c.lesson_count + 1, title=payload.title.strip(), content=(payload.content or "").strip() or None, video_url=_clean_video(payload.video_url))
    db.add(lesson)
    c.lesson_count += 1
    db.commit()
    return {"ok": True, "id": lesson.id}


@router.delete("/{course_id}/lessons/{lesson_id}")
def delete_lesson(course_id: int, lesson_id: int, request: Request, db: Session = Depends(get_db)):
    c = _own_course(db, course_id, require_profile(request, db))
    lesson = db.query(CourseLesson).filter_by(id=lesson_id, course_id=course_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")
    db.query(LessonProgress).filter_by(lesson_id=lesson_id).delete()
    db.delete(lesson)
    c.lesson_count = max(0, c.lesson_count - 1)
    if c.lesson_count == 0:
        c.is_published = False
    db.commit()
    return {"ok": True}


@router.post("/{course_id}/enroll")
def enroll(course_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    c = db.query(Course).filter(Course.id == course_id, Course.is_published.is_(True)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    if not db.query(CourseEnrollment).filter_by(course_id=course_id, user_id=profile.user_id).first():
        db.add(CourseEnrollment(course_id=course_id, user_id=profile.user_id))
        c.enrolled_count += 1
        db.commit()
    return {"ok": True}


@router.post("/{course_id}/lessons/{lesson_id}/complete")
def toggle_complete(course_id: int, lesson_id: int, request: Request, db: Session = Depends(get_db)):
    profile = require_profile(request, db)
    if not db.query(CourseEnrollment).filter_by(course_id=course_id, user_id=profile.user_id).first():
        raise HTTPException(status_code=403, detail="Matricule-se no curso primeiro.")
    if not db.query(CourseLesson).filter_by(id=lesson_id, course_id=course_id).first():
        raise HTTPException(status_code=404, detail="Aula não encontrada.")
    row = db.query(LessonProgress).filter_by(lesson_id=lesson_id, user_id=profile.user_id).first()
    if row:
        db.delete(row)
        done = False
    else:
        db.add(LessonProgress(course_id=course_id, lesson_id=lesson_id, user_id=profile.user_id))
        done = True
    db.commit()
    return {"done": done}
