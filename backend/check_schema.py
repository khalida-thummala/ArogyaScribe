import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.session import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'analysis_records'"))
        cols = [row[0] for row in result.fetchall()]
        print("COLUMNS IN DB:", cols)
except Exception as e:
    print("ERROR:", e)
