from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from database.database import Base


class AppDistributionRelease(Base):
    __tablename__ = "dev_app_distribution_releases"

    id = Column(Integer, primary_key=True, index=True)
    version_name = Column(String(60), nullable=False)
    version_code = Column(Integer, nullable=False, unique=True, index=True)
    file_type = Column(String(40), nullable=False)
    release_notes = Column(Text, nullable=False, default="")
    status = Column(String(20), nullable=False, default="published", index=True)
    firebase_url = Column(String(1000), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "version_name": self.version_name,
            "version_code": self.version_code,
            "file_type": self.file_type,
            "release_notes": self.release_notes,
            "status": self.status,
            "firebase_url": self.firebase_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
