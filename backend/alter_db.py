import os
import sys

# Garante que o diretório atual é o diretório backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ.get("UPZLAB_DATABASE_URL", "sqlite:///./upzlab.db")
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

print("Connecting to:", DB_URL)
engine = create_engine(DB_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE beta_feedbacks ADD COLUMN device_os VARCHAR(100);"))
        print("Added device_os")
    except Exception as e:
        print("device_os error:", e)
    
    try:
        conn.execute(text("ALTER TABLE beta_feedbacks ADD COLUMN steps_to_reproduce TEXT;"))
        print("Added steps_to_reproduce")
    except Exception as e:
        print("steps_to_reproduce error:", e)
        
    try:
        conn.execute(text("ALTER TABLE beta_feedbacks ADD COLUMN ux_rating INTEGER;"))
        print("Added ux_rating")
    except Exception as e:
        print("ux_rating error:", e)

    conn.commit()
print("Migration done")
