from app.db.session import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        print("--- REPORTS ---")
        res = conn.execute(text("SELECT count(*) FROM reports")).scalar()
        print(f"TOTAL REPORTS: {res}")
        rows = conn.execute(text("SELECT report_id, status, organization_id FROM reports")).fetchall()
        for row in rows:
            print(f"Report: {row.report_id} | Status: {row.status} | Org: {row.organization_id}")
            
        print("\n--- USERS ---")
        users = conn.execute(text("SELECT user_id, organization_id, email FROM users")).fetchall()
        for u in users:
            print(f"User: {u.user_id} | Email: {u.email} | Org: {u.organization_id}")

if __name__ == "__main__":
    check()
