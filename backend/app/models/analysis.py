import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Text,
    DECIMAL,
    JSON
)
from sqlalchemy.sql import func
from app.db.base import Base


class Analysis(Base):
    __tablename__ = "analysis_records"

    # Primary Key
    analysis_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign Keys
    upload_id = Column(
        String,
        nullable=False
    )

    patient_id = Column(
        String,
        ForeignKey("patients.patient_id"),
        nullable=True
    )

    user_id = Column(
        String,
        ForeignKey("users.user_id"),
        nullable=False
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.organization_id"),
        nullable=False
    )

    # Source file info
    source_file_name = Column(
        String(500),
        nullable=False
    )

    source_file_type = Column(
        String,
        nullable=False
    )
    # pdf / docx / image

    # Extracted text
    extracted_text = Column(
        Text,
        nullable=True
    )

    # Analysis workflow
    analysis_status = Column(
        String,
        default="pending"
    )
    # pending / analyzing / completed / failed

    # Generated SOAP outputs
    generated_subjective = Column(
        Text,
        nullable=True
    )

    generated_objective = Column(
        Text,
        nullable=True
    )

    generated_assessment = Column(
        Text,
        nullable=True
    )

    generated_plan = Column(
        Text,
        nullable=True
    )

    generated_medications = Column(
        JSON,
        nullable=True
    )

    # AI confidence
    confidence_score = Column(
        DECIMAL(5,2),
        nullable=True
    )

    # Medical entities
    key_entities = Column(
        JSON,
        nullable=True
    )

    # Comparison against existing consultation
    comparison_data = Column(
        JSON,
        nullable=True
    )

    # Time tracking
    analysis_timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    reviewed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    approved_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    approved_by = Column(
        String,
        ForeignKey("users.user_id"),
        nullable=True
    )

    # User notes
    notes = Column(
        Text,
        nullable=True
    )

    # Audit
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )
    structured_findings = Column(
    JSON,
    nullable=True
    )