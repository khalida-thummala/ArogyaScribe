import sqlite3

conn = sqlite3.connect("arogyascribe.db")
cur = conn.cursor()

cur.execute("PRAGMA table_info(reports)")
cols = [row[1] for row in cur.fetchall()]
print("Report columns:", cols)

# Add patient_id if missing
if "patient_id" not in cols:
    cur.execute("ALTER TABLE reports ADD COLUMN patient_id TEXT REFERENCES patients(patient_id)")
    conn.commit()
    print("Added patient_id column.")
else:
    print("patient_id already exists.")

conn.close()
