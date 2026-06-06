import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    Integer,
    JSON
)
from sqlalchemy.sql import func
from app.db.base import Base


class ReportVersion(Base):
    __tablename__ = "report_versions"

    version_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    report_id = Column(
        String,
        ForeignKey("reports.report_id"),
        nullable=False
    )

    version_number = Column(
        Integer,
        nullable=False,
        default=1
    )

    subjective = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)
    assessment = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    medications = Column(JSON, nullable=True)
    key_entities = Column(JSON, nullable=True)

    # Dynamic fields
    report_type = Column(String, default="soap_note")
    content = Column(JSON, nullable=True)

    modified_by = Column(
        String,
        ForeignKey("users.user_id"),
        nullable=True
    )

    modified_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class Report(Base):
    __tablename__ = "reports"

    # Primary Key
    report_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign Keys
    consultation_id = Column(
        String,
        ForeignKey("consultations.consultation_id"),
        nullable=True
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

    version = Column(
        Integer,
        default=1,
        nullable=False
    )

    # Dynamic Template Fields
    report_type = Column(
        String,
        default="soap_note"
    )

    content = Column(
        JSON,
        nullable=True
    )

    # SOAP sections
    subjective = Column(
        Text,
        nullable=True
    )

    objective = Column(
        Text,
        nullable=True
    )

    assessment = Column(
        Text,
        nullable=True
    )

    plan = Column(
        Text,
        nullable=True
    )

    # Medications
    medications = Column(
        JSON,
        nullable=True
    )

    # Key clinical entities (e.g. drug interactions)
    key_entities = Column(
        JSON,
        nullable=True
    )

    # Follow-up tracking
    follow_up_needed = Column(
        Boolean,
        default=False
    )

    follow_up_days = Column(
        Integer,
        nullable=True
    )

    # Status workflow
    status = Column(
        String,
        default="draft"
    )
    # draft / reviewed / approved / signed / archived

    # Approval workflow
    approved_by = Column(
        String,
        ForeignKey("users.user_id"),
        nullable=True
    )

    approved_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # Audit timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )
    structured_findings = Column(JSON,nullable=True)