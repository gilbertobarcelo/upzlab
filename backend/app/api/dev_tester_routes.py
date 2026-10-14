from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from app.models.dev_tester_models import DevProfile
from app.services.gamification_service import get_points_statement

router = APIRouter(prefix="/dev", tags=["Comunidade UpzLab"])

@router.get("/ranking")
async def get_community_ranking(db: Session = Depends(get_db)):
    """
    Retorna o placar de líderes (Leaderboard) da comunidade UpzLab.
    """
    top_devs = db.query(DevProfile).filter(DevProfile.status == "ACTIVE").order_by(DevProfile.points.desc()).limit(50).all()
    
    ranking = []
    for rank, dev in enumerate(top_devs, 1):
        ranking.append({
            "rank": rank,
            "name": dev.name or dev.github_username or f"Dev_{dev.id}",
            "avatar_url": dev.avatar_url,
            "points": dev.points,
            "level": dev.egolpe_level
        })
        
    return {"success": True, "data": ranking}

@router.get("/members")
async def get_community_members(limit: int = 12, db: Session = Depends(get_db)):
    """Total de devs da comunidade e os membros mais recentes (lista pública enxuta)."""
    limit = max(1, min(limit, 30))
    base = db.query(DevProfile).filter(DevProfile.is_staff == False, DevProfile.username.isnot(None))
    total = base.count()
    members = base.order_by(DevProfile.id.desc()).limit(limit).all()
    return {
        "success": True,
        "total": total,
        "data": [
            {
                "username": m.username,
                "name": m.name or m.username,
                "avatar_url": "" if (m.avatar_url or "").startswith("https://ui-avatars.com") else (m.avatar_url or ""),
                "level": m.egolpe_level,
                "points": m.points or 0,
            }
            for m in members
        ],
    }

@router.get("/{user_id}/points/statement")
async def get_my_points_statement(user_id: int, db: Session = Depends(get_db)):
    """
    Retorna o extrato de UpzPoints (Ledger).
    """
    dev_profile = db.query(DevProfile).filter(DevProfile.app_user_id == user_id).first()
    if not dev_profile:
        raise HTTPException(status_code=404, detail="Perfil de testador não encontrado.")
        
    statement = get_points_statement(db, dev_profile.id)
    return {
        "success": True, 
        "balance": dev_profile.points,
        "level": dev_profile.egolpe_level,
        "statement": statement
    }


