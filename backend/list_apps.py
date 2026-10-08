import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from database.database import SessionLocal
from app.models.beta_product_models import BetaProduct

db = SessionLocal()
for p in db.query(BetaProduct).all():
    print(f"ID: {p.id}, Name: {p.name}, Icon: {p.icon_url}")
