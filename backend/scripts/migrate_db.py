from app.db.session import engine
from sqlalchemy import text

def migrate():
    print("Starting migration...")
    with engine.connect() as conn:
        try:
            # Check if columns already exist first to be safe
            conn.execute(text("ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE"))
            print("Added phone_verified")
        except Exception as e:
            print(f"phone_verified error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN otp VARCHAR(10)"))
            print("Added otp")
        except Exception as e:
            print(f"otp error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN otp_expiry TIMESTAMP"))
            print("Added otp_expiry")
        except Exception as e:
            print(f"otp_expiry error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE consultations ADD COLUMN transcription_job_id VARCHAR"))
            print("Added transcription_job_id")
        except Exception as e:
            print(f"transcription_job_id error: {e}")
            
        conn.commit()

    print("Migration complete.")

if __name__ == "__main__":
    migrate()
