from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database.database import Base

class AppUser(Base):
    """
    Representa o usuário principal do aplicativo na Comunidade UpzLab.
    Este modelo substitui a antiga dependência do upzcontroll.
    """
    __tablename__ = "app_users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(50), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    
    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_seed = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
