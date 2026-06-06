from sqlalchemy import Column, Text, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import String
from datetime import datetime
from app.db.base import Base
import uuid

try:
    from pgvector.sqlalchemy import Vector as PGVector  # type: ignore
    _VECTOR_TYPE = PGVector(1536)
except ImportError:
    # pgvector not installed (e.g. SQLite dev environment) — store as Text
    from sqlalchemy import Text as _TextType
    _VECTOR_TYPE = _TextType()

# Use String for UUID compatibility across SQLite and PostgreSQL
_UUID_COL = String


class RadiologyReport(Base):
    __tablename__ = "radiology_reports"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    patient_id = Column(String)

    modality = Column(Text)

    body_part = Column(Text)
    
    image_url = Column(Text)

    thumbnail_url = Column(Text, nullable=True)

    study_date = Column(Text)

    indication = Column(Text)

    technique = Column(Text)

    findings = Column(Text)

    

    impression = Column(Text)

    abnormalities = Column(Text)

    comparison = Column(Text)

    clinical_codes = Column(Text, nullable=True)

    critical_findings = Column(String, default="false")

    follow_up_recommendation = Column(Text, nullable=True)

    status = Column(Text, default="DRAFT")

    embedding = Column(_VECTOR_TYPE, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )