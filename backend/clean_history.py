import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found.")
    sys.exit(1)

# SQLite requires connect_args, PostgreSQL does not
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL, 
    connect_args=connect_args
)

def clean_reports():
    with engine.connect() as conn:
        print("Connected to DB. Deleting corrupted test history...")
        
        # Delete reports that contain the bad "not a chest" phrasing
        result = conn.execute(text("""
            DELETE FROM radiology_reports 
            WHERE impression ILIKE '%not a chest%' 
               OR findings ILIKE '%not a chest%'
               OR impression ILIKE '%not a chest radiograph%'
               OR findings ILIKE '%not a chest radiograph%'
        """))
        conn.commit()
        
        print(f"Deleted {result.rowcount} bad historical reports.")

if __name__ == "__main__":
    clean_reports()
