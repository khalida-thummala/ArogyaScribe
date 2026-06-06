import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base


class DocumentEmbedding(Base):
    """
    Stores chunked text and their vector embeddings for RAG retrieval.
    Embeddings are stored as JSON text for SQLite compatibility.
    On PostgreSQL with pgvector, the same JSON text format is used for portability.
    """
    __tablename__ = "document_embeddings"

    # Use insert_default so SQLAlchemy 2.x can track the PK correctly on SQLite
    id = Column(
        String(36),
        primary_key=True,
        default=None,   # We set this explicitly in the service before insert
        nullable=False,
    )

    patient_id = Column(
        String,
        ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    source_record_id = Column(
        String,
        nullable=False
    )

    source_type = Column(
        String(100),
        nullable=False
    )
    # e.g. "document", "soap_note", "consultation", "patient_profile"

    content = Column(
        Text,
        nullable=False
    )

    # Embedding stored as JSON array string — works on both SQLite and PostgreSQL
    embedding = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
