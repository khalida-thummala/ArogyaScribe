import sqlite3

conn = sqlite3.connect("arogyascribe.db")
cur = conn.cursor()

cur.execute("PRAGMA table_info(reports)")
cols = [row[1] for row in cur.fetchall()]
print("Current report columns:", cols)

if "key_entities" not in cols:
    cur.execute("ALTER TABLE reports ADD COLUMN key_entities TEXT")
    conn.commit()
    print("Added key_entities column to reports table.")
else:
    print("key_entities column already exists.")

conn.close()
