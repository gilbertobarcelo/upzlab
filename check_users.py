import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.database.database import SessionLocal
from backend.app.models.user_models import AppUser
from backend.app.models.dev_tester_models import DevProfile

def check_user():
    db = SessionLocal()
    try:
        users = db.query(AppUser).all()
        print(f"Total de usuários na tabela AppUser: {len(users)}")
        for u in users:
            print(f" - ID: {u.id}, Nome: {u.name}, Email: {u.email}")
            
            profile = db.query(DevProfile).filter(DevProfile.user_id == u.id).first()
            if profile:
                print(f"   -> DevProfile associado: {profile.name}, {profile.points} pts, {profile.egolpe_level}")
            else:
                print(f"   -> Nenhum DevProfile associado.")
    except Exception as e:
        print(f"Erro ao acessar banco: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user()
