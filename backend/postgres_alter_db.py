from sqlalchemy import text
from database.database import engine, get_db

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE beta_products ADD COLUMN is_founder_app BOOLEAN DEFAULT FALSE;"))
            print("Added is_founder_app")
        except Exception as e:
            print("is_founder_app err/exists:", e)
            
        try:
            conn.commit()
        except:
            pass

    # Atualizar o E-Golpe para is_founder_app = True
    try:
        with engine.begin() as conn:
            conn.execute(text("UPDATE beta_products SET is_founder_app = TRUE WHERE name ILIKE '%golpe%' OR slug ILIKE '%golpe%';"))
            print("Updated E-Golpe to is_founder_app = True")
    except Exception as e:
        print("Update err:", e)

if __name__ == "__main__":
    add_columns()
