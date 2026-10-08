from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database.database import Base

class EmailTemplate(Base):
    """
    Templates de e-mail usados pelo sistema UpzLab e gerados pelo LabsAi.
    Permite que a IA crie novos templates dinamicamente no banco se estiverem faltando.
    """
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(100), unique=True, index=True, nullable=False) # ex: 'verify_account', 'bug_report'
    subject = Column(String(255), nullable=False)
    body_html = Column(Text, nullable=False)
    created_by = Column(String(50), default="system") # Pode ser 'system' ou 'labs_ai'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
