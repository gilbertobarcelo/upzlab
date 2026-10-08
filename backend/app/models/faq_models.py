from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database.database import Base

class FaqDoc(Base):
    """
    Tabela de documentação e FAQ da UpzLab Community.
    Usada pela IA para responder dúvidas dos Devs no chat (RAG).
    """
    __tablename__ = "faq_docs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    content = Column(Text, nullable=False) # Markdown ou texto com pedaços de código
    category = Column(String(100), default="Geral")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
