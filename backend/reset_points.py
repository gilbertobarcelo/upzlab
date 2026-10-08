import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from database.database import SessionLocal
from app.models.dev_tester_models import DevProfile

def reset_points():
    db = SessionLocal()
    try:
        # Encontra o Gilberto e zera os pontos
        dev = db.query(DevProfile).filter(DevProfile.name == "Gilberto Barcelo").first()
        if dev:
            dev.points = 0
            db.commit()
            print("Pontos do Gilberto Barcelo zerados com sucesso!")
        else:
            print("Gilberto Barcelo não encontrado no banco.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_points()
