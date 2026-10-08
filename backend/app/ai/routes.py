import os
from typing import Optional
from datetime import date
from fastapi import APIRouter, Request, HTTPException, Depends
from .schemas import ChatRequest, ChatResponse
from .services import process_chat_request
# Segredo e helpers de JWT centralizados (sem fallback previsível).
from app.core.security import get_user_id_optional as _shared_get_user_id_optional

router = APIRouter(tags=["AI Dev Support"])

# Controlador de limite em memória por dev (limite de 20 por dia para testes)
AI_USAGE_LIMITS = {}
DAILY_LIMIT = 20

def _get_user_id_optional(request: Request) -> Optional[str]:
    # Implementação centralizada em app.core.security.
    return _shared_get_user_id_optional(request)

def check_rate_limit(dev_id: str):
    today_str = date.today().isoformat()
    usage = AI_USAGE_LIMITS.get(dev_id, {"date": today_str, "count": 0})
    
    if usage["date"] != today_str:
        usage = {"date": today_str, "count": 0}
        
    if usage["count"] >= DAILY_LIMIT:
        raise HTTPException(status_code=429, detail=f"Limite diário de {DAILY_LIMIT} requisições da IA atingido para sua conta.")
        
    usage["count"] += 1
    AI_USAGE_LIMITS[dev_id] = usage

from sqlalchemy.orm import Session
from database.database import get_db

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, req: Request, db: Session = Depends(get_db)):
    dev_id = _get_user_id_optional(req)
    
    # Exige que o usuário esteja logado no painel do UpzLab
    if not dev_id:
        raise HTTPException(status_code=401, detail="Acesso negado. Você precisa estar logado na comunidade para usar a IA.")
        
    # Verifica e contabiliza a cota do usuário
    check_rate_limit(dev_id)
    
    response_content = process_chat_request(request, db=db)
    return ChatResponse(response=response_content)
