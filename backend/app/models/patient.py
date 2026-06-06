import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Date,
    Text,
    Boolean,
    DECIMAL
)
from sqlalchemy.sql import func
from app.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    # Primary Key
    patient_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign Keys
    user_id = Column(
        String,
        ForeignKey("users.user_id"),
        nullable=False
    )
    doctor_id = Column(
    String,
    ForeignKey("users.user_id"),
    nullable=True
    )
    organization_id = Column(
        String,
        ForeignKey("organizations.organization_id"),
        nullable=False
    )

    # Patient Name
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)

    # Personal Details
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(50), nullable=True)

    medical_id = Column(
        String(100),
        nullable=True
    )

    # Contact Info
    email = Column(
        String(255),
        nullable=True
    )

    phone = Column(
        String(20),
        nullable=True
    )

    # Address
    address_line1 = Column(
        String(255),
        nullable=True
    )

    address_line2 = Column(
        String(255),
        nullable=True
    )

    city = Column(
        String(100),
        nullable=True
    )

    state_province = Column(
        String(100),
        nullable=True
    )

    postal_code = Column(
        String(20),
        nullable=True
    )

    country = Column(
        String(100),
        nullable=True
    )

    # Emergency Contact
    emergency_contact_name = Column(
        String(255),
        nullable=True
    )

    emergency_contact_phone = Column(
        String(20),
        nullable=True
    )

    # Medical Information
    medical_history = Column(
        Text,
        nullable=True
    )

    allergies = Column(
        Text,
        nullable=True
    )

    current_medications = Column(
        Text,
        nullable=True
    )

    # Insurance
    insurance_provider = Column(
        String(255),
        nullable=True
    )

    insurance_policy = Column(
        String(100),
        nullable=True
    )

    # Blood / Physical
    blood_type = Column(
        String(5),
        nullable=True
    )

    height_cm = Column(
        DECIMAL(5, 2),
        nullable=True
    )

    weight_kg = Column(
        DECIMAL(5, 2),
        nullable=True
    )

    insurance_verified = Column(
        Boolean,
        default=False
    )

    # Status
    status = Column(
        String,
        default="active"
    )
    # active / inactive / archived

    # Audit Fields
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )