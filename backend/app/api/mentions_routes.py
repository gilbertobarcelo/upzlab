from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.database import get_db
from app.models.dev_tester_models import DevProfile
from typing import List, Dict

router = APIRouter(prefix="/mentions", tags=["Menções"])

@router.get("/users")
async def search_users_for_mention(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """
    Busca usuários pelo username ou nome para o autocomplete de menção (@ ou u/).
    """
    search_term = f"%{q.lower()}%"
    
    users = db.query(DevProfile).filter(
        (func.lower(DevProfile.username).like(search_term)) | 
        (func.lower(DevProfile.name).like(search_term))
    ).filter(DevProfile.username.isnot(None)).limit(10).all()
    
    results = []
    for user in users:
        results.append({
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "role": f"Patente: {user.egolpe_level}" if user.egolpe_level else "Tester"
        })
        
    return {"success": True, "data": results}

@router.put("/username")
async def set_username(request: Request, username: str = Query(..., min_length=3, max_length=50), db: Session = Depends(get_db)):
    """
    Define ou atualiza o username do usuário autenticado.
    Regras: Letras minúsculas, números, _ e .
    """
    from app.api.dev_auth_routes import _get_user_id_optional
    user_id = _get_user_id_optional(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Não autenticado")
        
    dev = db.query(DevProfile).filter(DevProfile.user_id == int(user_id)).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Perfil de testador não encontrado")
        
    # Validation
    import re
    username = username.lower()
    if not re.match(r'^[a-z0-9_\.]+$', username):
        raise HTTPException(status_code=400, detail="Username só pode conter letras minúsculas, números, '_' e '.'")
        
    # Verifica se já existe
    existing = db.query(DevProfile).filter(func.lower(DevProfile.username) == username, DevProfile.id != dev.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Este username já está em uso.")
        
    dev.username = username
    db.commit()
    
    return {"success": True, "message": "Username atualizado com sucesso!", "username": username}
