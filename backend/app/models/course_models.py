"""UpzLab - Cursos & Masterclass"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from database.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(40), nullable=False, default="outro", index=True)
    level = Column(String(20), nullable=False, default="iniciante")
    is_published = Column(Boolean, nullable=False, default=False, index=True)
    lesson_count = Column(Integer, nullable=False, default=0)
    enrolled_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())


class CourseLesson(Base):
    __tablename__ = "course_lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False, default=0)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    __table_args__ = (UniqueConstraint("course_id", "user_id", name="uq_course_enrollment"),)

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())


class LessonProgress(Base):
    __tablename__ = "course_lesson_progress"
    __table_args__ = (UniqueConstraint("lesson_id", "user_id", name="uq_lesson_progress"),)

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("course_lessons.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
