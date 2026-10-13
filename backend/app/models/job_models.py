"""UpzLab - Vagas & Networking"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from database.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    company = Column(String(150), nullable=False)
    job_type = Column(String(20), nullable=False, default="clt", index=True)  # clt | pj | freela | estagio
    level = Column(String(20), nullable=False, default="pleno")
    location = Column(String(150), nullable=True)
    is_remote = Column(Boolean, nullable=False, default=True)
    salary = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    tags = Column(String(300), nullable=True)  # separadas por vírgula
    apply_url = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="open", index=True)  # open | closed
    application_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())


class JobApplication(Base):
    __tablename__ = "job_applications"
    __table_args__ = (UniqueConstraint("job_id", "applicant_id", name="uq_job_application"),)

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    applicant_id = Column(Integer, nullable=False, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
