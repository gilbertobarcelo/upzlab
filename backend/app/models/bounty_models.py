"""UpzLab - Desafios & Bounties (recompensas em UpzPoints)"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from database.database import Base


class Bounty(Base):
    __tablename__ = "bounties"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(40), nullable=False, default="outro", index=True)
    difficulty = Column(String(20), nullable=False, default="medio")
    reward = Column(Integer, nullable=False)  # UpzPoints retidos (escrow) até o encerramento
    deadline = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="open", index=True)  # open | awarded | cancelled
    winner_submission_id = Column(Integer, nullable=True)
    submission_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())


class BountySubmission(Base):
    __tablename__ = "bounty_submissions"
    __table_args__ = (UniqueConstraint("bounty_id", "author_id", name="uq_bounty_submission_author"),)

    id = Column(Integer, primary_key=True, index=True)
    bounty_id = Column(Integer, ForeignKey("bounties.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, nullable=False, index=True)
    body = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
