"""
UpzLab - Beta Feedback & Updates Models
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from database.database import Base


class BetaFeedbackLike(Base):
    """Registro de curtidas para impedir que o mesmo dev curta infinitamente"""
    __tablename__ = "beta_feedback_likes"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("beta_feedbacks.id", ondelete="CASCADE"), index=True)
    dev_id = Column(Integer, index=True)
    created_at = Column(DateTime, server_default=func.now())

class BetaFeedback(Base):
    """Posts e relatos enviados pelos membros da comunidade UpzLab"""
    __tablename__ = "beta_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    author_name = Column(String(100), default="Dev Tester")
    author_role = Column(String(100), default="Security & Code Tester")
    # update_id: se o post é sobre uma atualização específica (opcional)
    update_id = Column(Integer, ForeignKey("beta_updates.id"), nullable=True)
    # implementation_id: se o post é de uma campanha gamificada (opcional)
    implementation_id = Column(String(36), nullable=True, index=True)
    type = Column(String(20), nullable=False, default="anomalia")  # general | bug | suggestion | update_review | anomalia | code_fix | fraude
    title = Column(String(200))
    body = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    # QA Fields (Community 2.0)
    device_os = Column(String(100), nullable=True)
    steps_to_reproduce = Column(Text, nullable=True)
    ux_rating = Column(Integer, nullable=True)
    
    likes = Column(Integer, default=0)
    # Imagens: lista de paths separados por vírgula
    images = Column(Text)  # JSON array de paths
    status = Column(String(20), default="open")  # open | reviewed | approved | closed
    award_points = Column(Integer, default=0)
    badge_type = Column(String(50), nullable=True)  # visao_de_aguia | code_expert | shield_hunter | bug_hunter
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    def to_dict(self):
        import json
        images = []
        if self.images:
            try:
                images = json.loads(self.images)
            except Exception:
                images = []
        return {
            "id": self.id,
            "user_id": self.user_id,
            "author_name": self.author_name or "Dev Tester",
            "author_role": self.author_role or "Security & Code Tester",
            "update_id": self.update_id,
            "implementation_id": self.implementation_id,
            "type": self.type,
            "title": self.title,
            "body": self.body,
            "code_snippet": self.code_snippet,
            "device_os": self.device_os,
            "steps_to_reproduce": self.steps_to_reproduce,
            "ux_rating": self.ux_rating,
            "likes": self.likes or 0,
            "images": images,
            "status": self.status,
            "award_points": self.award_points or 0,
            "badge_type": self.badge_type,
            "admin_comment": self.admin_comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class BetaUpdate(Base):
    """Atualizações do produto postadas pelo admin para os beta testers"""
    __tablename__ = "beta_updates"

    id = Column(Integer, primary_key=True, index=True)
    product_slug = Column(String(50), nullable=False, index=True)
    version = Column(String(30))
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    type = Column(String(20), default="update")  # update | fix | feature | announcement | test_campaign
    requires_feedback = Column(Boolean, default=False)
    required_level = Column(String(50), default="Scanner")
    points_reward = Column(Integer, default=100)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "product_slug": self.product_slug,
            "version": self.version,
            "title": self.title,
            "body": self.body,
            "type": self.type,
            "requires_feedback": self.requires_feedback,
            "required_level": self.required_level,
            "points_reward": self.points_reward,
            "is_published": self.is_published,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class BetaFeedbackComment(Base):
    """Comentários aninhados para um relato/post na comunidade (threads)"""
    __tablename__ = "beta_feedback_comments"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("beta_feedbacks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    
    # Para suportar threads (comentários respondendo a comentários)
    parent_comment_id = Column(Integer, ForeignKey("beta_feedback_comments.id", ondelete="CASCADE"), nullable=True, index=True)
    
    author_name = Column(String(100), default="Dev Tester")
    author_role = Column(String(100), default="Developer")
    
    body = Column(Text, nullable=False)
    is_admin_reply = Column(Boolean, default=False)
    likes = Column(Integer, default=0)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "feedback_id": self.feedback_id,
            "user_id": self.user_id,
            "parent_comment_id": self.parent_comment_id,
            "author_name": self.author_name,
            "author_role": self.author_role,
            "body": self.body,
            "is_admin_reply": self.is_admin_reply,
            "likes": self.likes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

