from app.db.session import engine
from sqlalchemy import text

def migrate():
    print("Starting migration for analysis_records...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE analysis_records ADD COLUMN patient_id VARCHAR"))
            print("Added patient_id")
        except Exception as e:
            print(f"patient_id error: {e}")
            
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
