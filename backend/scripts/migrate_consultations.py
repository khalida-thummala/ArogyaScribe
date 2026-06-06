"""
Migration: Sync consultations and reports tables with current SQLAlchemy models.
Adds any columns that exist in the model but are missing from the live Postgres DB.
Safe to run multiple times (checks before altering).
"""
import psycopg2
import os
import sys

# Load DATABASE_URL from .env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
db_url = None
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            db_url = line.split("=", 1)[1].strip()
            break

if not db_url:
    print("ERROR: DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Connecting to: {db_url}")
conn = psycopg2.connect(db_url)
conn.autocommit = False
cur = conn.cursor()


def get_columns(table):
    cur.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name = %s",
        (table,)
    )
    return {row[0] for row in cur.fetchall()}


def add_column_if_missing(table, column, col_type):
    cols = get_columns(table)
    if column not in cols:
        print(f"  Adding {table}.{column} ({col_type})")
        cur.execute(f'ALTER TABLE {table} ADD COLUMN {column} {col_type}')
    else:
        print(f"  {table}.{column} already exists, skipping.")


print("\n--- Migrating: consultations ---")
add_column_if_missing("consultations", "transcription_job_id", "TEXT")
add_column_if_missing("consultations", "transcription_confidence", "NUMERIC(5,2)")
add_column_if_missing("consultations", "audio_duration_seconds", "INTEGER")
add_column_if_missing("consultations", "audio_bitrate", "TEXT")
add_column_if_missing("consultations", "audio_checksum", "VARCHAR(64)")
add_column_if_missing("consultations", "notes", "TEXT")
add_column_if_missing("consultations", "duration_minutes", "INTEGER")

print("\n--- Migrating: reports ---")
add_column_if_missing("reports", "key_entities", "JSONB")
add_column_if_missing("reports", "patient_id", "TEXT")

conn.commit()
print("\nMigration complete.")
cur.close()
conn.close()
