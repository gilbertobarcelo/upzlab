from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from app.models.faq_models import FaqDoc
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter(tags=["Public Docs"])

class FaqDocSchema(BaseModel):
    id: int
    title: str
    content: str
    category: str

    class Config:
        orm_mode = True

@router.get("/faq", response_model=Dict[str, List[FaqDocSchema]])
async def get_faq_docs(db: Session = Depends(get_db)):
    """
    Retorna toda a documentação agrupada por categoria.
    Rota pública, sem necessidade de autenticação.
    """
    docs = db.query(FaqDoc).all()
    
    # Agrupa por categoria
    grouped_docs = {}
    for doc in docs:
        if doc.category not in grouped_docs:
            grouped_docs[doc.category] = []
        grouped_docs[doc.category].append(doc)
        
    return grouped_docs
