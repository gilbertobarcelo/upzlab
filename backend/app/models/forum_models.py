"""UpzLab - Fórum & Discussões"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from database.database import Base


class ForumTopic(Base):
    __tablename__ = "forum_topics"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, nullable=False, index=True)
    category = Column(String(40), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    views = Column(Integer, default=0, nullable=False)
    votes = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_closed = Column(Boolean, default=False, nullable=False)
    is_solved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    last_activity_at = Column(DateTime, server_default=func.now(), index=True)


class ForumReply(Base):
    __tablename__ = "forum_replies"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("forum_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, nullable=False, index=True)
    body = Column(Text, nullable=False)
    votes = Column(Integer, default=0, nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class ForumVote(Base):
    __tablename__ = "forum_votes"
    __table_args__ = (UniqueConstraint("user_id", "target_type", "target_id", name="uq_forum_vote"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    target_type = Column(String(10), nullable=False)  # topic | reply
    target_id = Column(Integer, nullable=False)
