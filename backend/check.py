import sys
import asyncio
from sqlalchemy import text
from app.db.session import engine

def main():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'radiology_reports'"))
        cols = [r[0] for r in result]
        print('Columns:', cols)
        if 'clinical_codes' not in cols:
            print('Missing columns! Adding them now...')
            conn.execute(text("ALTER TABLE radiology_reports ADD COLUMN clinical_codes TEXT"))
            conn.execute(text("ALTER TABLE radiology_reports ADD COLUMN critical_findings VARCHAR DEFAULT 'false'"))
            conn.execute(text("ALTER TABLE radiology_reports ADD COLUMN follow_up_recommendation TEXT"))
            conn.commit()
            print('Added Phase 3 columns manually.')
        else:
            print('Columns already exist!')

if __name__ == "__main__":
    main()
