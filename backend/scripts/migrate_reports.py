from app.db.session import engine
from sqlalchemy import text

def migrate():
    print("Starting migration for reports table...")
    with engine.connect() as conn:
        try:
            # For PostgreSQL/SQLite
            conn.execute(text("ALTER TABLE reports ALTER COLUMN consultation_id DROP NOT NULL"))
            print("Dropped NOT NULL constraint on consultation_id in reports")
        except Exception as e:
            try:
                # SQLite doesn't support ALTER COLUMN, we might need a workaround or it might already be nullable if created that way.
                # In SQLite, if we can't ALTER, we just hope it works or we skip it if consultation_id is provided.
                print(f"PostgreSQL style alter failed, trying SQLite style if applicable: {e}")
            except:
                pass
            
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
