import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Text,
    Integer,
    DECIMAL
)
from sqlalchemy.sql import func
from app.db.base import Base


class Consultation(Base):
    __tablename__ = "consultations"

    # Primary Key
    consultation_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign Keys
    patient_id = Column(
        String,
        ForeignKey("patients.patient_id"),
        nullable=False
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

    # Consultation details
    consultation_type = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        default="scheduled"
    )
    # scheduled / in_progress / completed / cancelled

    chief_complaint = Column(
        String(500),
        nullable=True
    )

    # Time tracking
    scheduled_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    ended_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    duration_minutes = Column(
        Integer,
        nullable=True
    )

    # Audio metadata
    audio_file_id = Column(
        String,
        nullable=True
    )

    audio_duration_seconds = Column(
        Integer,
        nullable=True
    )

    audio_bitrate = Column(
        String,
        nullable=True
    )

    audio_checksum = Column(
        String(64),
        nullable=True
    )

    # Transcription tracking
    transcription_status = Column(
        String,
        default="pending"
    )
    # pending / in_progress / completed / failed

    transcription_text = Column(
        Text,
        nullable=True
    )

    transcription_job_id = Column(
        String,
        nullable=True
    )

    transcription_confidence = Column(
        DECIMAL(5,2),
        nullable=True
    )

    # Clinical notes
    notes = Column(
        Text,
        nullable=True
    )

    # Audit fields
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )