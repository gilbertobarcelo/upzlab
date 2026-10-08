from database.database import SessionLocal
from app.models.dev_tester_models import DevProfile

db = SessionLocal()
# Como você é o primeiro (ou um dos únicos), vamos dar os pontos para o DevProfile com id 1 ou o primeiro que achar
profile = db.query(DevProfile).first()
if profile:
    profile.points = 100000000
    db.commit()
    print(f"Sucesso! 100.000.000 UpzPoints adicionados para {profile.name} (ID: {profile.id})")
else:
    print("Nenhum perfil de Dev encontrado ainda! Cadastre-se no frontend primeiro.")
db.close()
