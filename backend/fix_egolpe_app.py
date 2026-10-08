import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from database.database import SessionLocal
from app.models.beta_product_models import BetaProduct
from app.models.dev_tester_models import DevProfile

db = SessionLocal()
apps = db.query(BetaProduct).all()
for p in apps:
    if "egolpe" in (p.slug or "").lower() or "golpe" in (p.name or "").lower():
        print(f"Updating app: {p.name}")
        p.is_founder_app = True
        p.cover_url = "/uploads/logo_egolpe.png"
        p.icon_url = "/uploads/icon.png"
        db.commit()
        print(f"Updated {p.name}")
