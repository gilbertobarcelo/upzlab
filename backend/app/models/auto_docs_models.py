from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base

class AutoDocApp(Base):
    """
    Tabela que armazena os metadados do repositório/app enviado pelo Dev.
    """
    __tablename__ = "auto_doc_apps"

    id = Column(Integer, primary_key=True, index=True)
    dev_id = Column(Integer, nullable=False, index=True) # ID do dev que enviou
    beta_product_id = Column(Integer, ForeignKey("beta_products.id"), nullable=True, index=True)
    app_name = Column(String(150), nullable=False, index=True)
    github_url = Column(String(300), nullable=False)
    status = Column(String(50), default="pending") # pending, processing, completed, published, error
    doc_type = Column(String(20), default="educational")  # educational (pública) | technical (interna)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamento com os arquivos
    files = relationship("AutoDocFile", back_populates="app", cascade="all, delete-orphan")


class AutoDocFile(Base):
    """
    Tabela que armazena a documentação gerada pela IA para cada arquivo do app.
    """
    __tablename__ = "auto_doc_files"

    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("auto_doc_apps.id"), nullable=False)
    file_path = Column(String(500), nullable=False, index=True) # Ex: src/components/Button.tsx
    content = Column(Text, nullable=False) # A explicação da IA (Markdown)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    app = relationship("AutoDocApp", back_populates="files")


class AutoDocGeneration(Base):
    """
    Histórico de tentativas de geração de documentação por Dev e App.
    Esta tabela NUNCA é apagada, garantindo o limite de 3 gerações + 20 dias de cooldown.
    """
    __tablename__ = "auto_doc_generations"

    id = Column(Integer, primary_key=True, index=True)
    dev_id = Column(Integer, nullable=False, index=True)
    beta_product_id = Column(Integer, nullable=True, index=True)
    doc_type = Column(String(20), nullable=False) # educational | technical
    status = Column(String(20), default="completed") # completed | error
    created_at = Column(DateTime(timezone=True), server_default=func.now())

