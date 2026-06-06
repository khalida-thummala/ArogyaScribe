import sys
import os
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add backend directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine

def setup_rag_database():
    print("Setting up RAG database schema...")
    with engine.begin() as conn:
        print("Enabling vector extension...")
        # Create pgvector extension if not exists
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        
        print("Creating document_embeddings table...")
        # Create the table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS document_embeddings (
                id SERIAL PRIMARY KEY,
                patient_id VARCHAR(255) NOT NULL,
                source_record_id VARCHAR(255) NOT NULL,
                source_type VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                embedding vector(1536), -- text-embedding-3-small uses 1536 dimensions
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Creating index for fast similarity search...")
        # Create an index for vector search (HNSW index for cosine distance)
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
            ON document_embeddings 
            USING hnsw (embedding vector_cosine_ops);
        """))
        
        print("RAG Database setup completed successfully.")

if __name__ == "__main__":
    try:
        setup_rag_database()
    except Exception as e:
        print(f"Error setting up RAG database: {e}")
