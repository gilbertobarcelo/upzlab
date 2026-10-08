from database.database import engine

print("Connecting to:", engine.url)

try:
    with engine.connect() as conn:
        print("Success!")
except Exception as e:
    print("Error:", e)
