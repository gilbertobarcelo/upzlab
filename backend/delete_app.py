import os
from sqlalchemy import create_engine, text
engine = create_engine("postgresql://postgres:postgres@localhost:5432/UpzLab")
try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id, name, owner_id FROM beta_products WHERE name LIKE '%E Golpe%'"))
        apps = res.fetchall()
        print("Apps encontrados:", apps)
        if apps:
            for app in apps:
                conn.execute(text("DELETE FROM beta_products WHERE id = :id"), {"id": app[0]})
            conn.commit()
            print("Apps deletados.")
except Exception as e:
    engine2 = create_engine("postgresql://macbook@localhost:5432/UpzLab")
    with engine2.connect() as conn:
        res = conn.execute(text("SELECT id, name, owner_id FROM beta_products WHERE name LIKE '%E Golpe%'"))
        apps = res.fetchall()
        print("Apps encontrados:", apps)
        if apps:
            for app in apps:
                conn.execute(text("DELETE FROM beta_products WHERE id = :id"), {"id": app[0]})
            conn.commit()
            print("Apps deletados.")
