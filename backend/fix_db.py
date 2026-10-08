import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from database.database import SessionLocal
from app.models.beta_product_models import BetaProduct

db = SessionLocal()
apps = db.query(BetaProduct).all()
for p in apps:
    if "ChatGPT" in p.icon_url:
        p.icon_url = ""  # Limpa o link quebrado
        db.commit()
        print(f"Limpado o link quebrado do app {p.name}")
