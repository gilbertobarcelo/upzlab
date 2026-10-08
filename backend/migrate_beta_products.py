import os
import sys
from sqlalchemy import text

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from database.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE beta_products ADD COLUMN google_group_url VARCHAR(500);"))
            print("Adicionado google_group_url")
        except Exception as e:
            print(f"Erro/Já existe: {e}")
            
        try:
            conn.execute(text("ALTER TABLE beta_products ADD COLUMN icon_url VARCHAR(500);"))
            print("Adicionado icon_url")
        except Exception as e:
            print(f"Erro/Já existe: {e}")
            
        try:
            conn.execute(text("ALTER TABLE beta_products ADD COLUMN cover_url VARCHAR(500);"))
            print("Adicionado cover_url")
        except Exception as e:
            print(f"Erro/Já existe: {e}")
            
        try:
            conn.execute(text("ALTER TABLE beta_products ADD COLUMN category VARCHAR(100) DEFAULT 'Utilitários';"))
            print("Adicionado category")
        except Exception as e:
            print(f"Erro/Já existe: {e}")
        
        conn.commit()

if __name__ == "__main__":
    migrate()
