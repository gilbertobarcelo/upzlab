"""
UpzLab - Beta Product Model & B2B Community Extensions
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.database import Base

class CampaignTemplate(Base):
    """
    Templates pré-definidos de campanhas/testes para devs escolherem ao publicar o app.
    """
    __tablename__ = "campaign_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description_template = Column(Text, nullable=False)
    category = Column(String(50), default="Geral")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description_template": self.description_template,
            "category": self.category
        }

class BetaProduct(Base):
    """
    Aplicativo publicado na comunidade para receber testes.
    Se owner_id for nulo, é um app oficial (como o É Golpe).
    """
    __tablename__ = "beta_products"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), nullable=False, unique=True, index=True)
    
    # Dono do App (DevProfile). Se nulo, é Oficial/Admin.
    owner_id = Column(Integer, ForeignKey("dev_tester_profiles.id"), nullable=True, index=True)
    
    name = Column(String(100), nullable=False)
    tagline = Column(String(200))          # frase curta
    description = Column(Text)            # descrição completa
    phase = Column(String(50), default="Beta Fechado")   # ex: Beta Fechado, Alpha
    version = Column(String(30), default="0.1.0-beta")
    platform = Column(String(50))         # ex: Android, iOS, Web
    
    download_url = Column(String(500))    # link APK / TestFlight / etc
    public_page_url = Column(String(500)) # link da landing page pública
    google_group_url = Column(String(500)) # link do Google Groups para testes
    icon_url = Column(String(500))        # Caminho/URL para a logo salva
    cover_url = Column(String(500))       # Caminho/URL para a imagem de capa
    category = Column(String(100), default="Utilitários")
    pdf_url = Column(String(500))             # link para PDF do projeto
    firebase_app_id = Column(String(255), nullable=True) # ID do Firebase App Distribution
    
    # Redes Sociais
    tiktok_url = Column(String(500), nullable=True)
    facebook_url = Column(String(500), nullable=True)
    instagram_url = Column(String(500), nullable=True)
    
    # --- Economia & B2B ---
    upzpoints_budget = Column(Integer, default=0) # Saldo depositado pelo dev para pagar testers
    required_level = Column(String(50), default="Scanner") # Nível mínimo exigido para testar
    
    is_founder_app = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # --- Promoção / Boost ---
    boost_level       = Column(Integer, default=0)        # 0=sem boost 1=feed 2=pinado 3=elite
    boost_expires_at  = Column(DateTime, nullable=True)   # NULL = sem boost ativo
    boost_impressions = Column(Integer, default=0)        # quantas vezes apareceu boosted

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    followers = relationship("ProjectFollower", back_populates="product", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "owner_id": self.owner_id,
            "name": self.name,
            "tagline": self.tagline,
            "description": self.description,
            "phase": self.phase,
            "version": self.version,
            "platform": self.platform,
            "download_url": self.download_url,
            "public_page_url": self.public_page_url,
            "google_group_url": self.google_group_url,
            "pdf_url": self.pdf_url,
            "firebase_app_id": self.firebase_app_id,
            "icon_url": self.icon_url,
            "cover_url": self.cover_url,
            "category": self.category,
            "tiktok_url": self.tiktok_url,
            "facebook_url": self.facebook_url,
            "instagram_url": self.instagram_url,
            "upzpoints_budget": self.upzpoints_budget,
            "required_level": self.required_level,
            "is_founder_app": self.is_founder_app,
            "is_active": self.is_active,
            "boost_level": self.boost_level or 0,
            "boost_expires_at": self.boost_expires_at.isoformat() if self.boost_expires_at else None,
            "boost_impressions": self.boost_impressions or 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class ProjectFollower(Base):
    """
    Relação de Seguidores (Engajamento).
    Desenvolvedores podem "Seguir" um app (BetaProduct) para receber atualizações.
    """
    __tablename__ = "project_followers"

    id = Column(Integer, primary_key=True, index=True)
    dev_profile_id = Column(Integer, ForeignKey("dev_tester_profiles.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("beta_products.id"), nullable=False, index=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relacionamentos (Assumindo que DevProfile importará isso também futuramente, ou apenas consultas via ORM)
    product = relationship("BetaProduct", back_populates="followers")
    
    def to_dict(self):
        return {
            "id": self.id,
            "dev_profile_id": self.dev_profile_id,
            "product_id": self.product_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
