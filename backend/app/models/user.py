import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    Integer,
    ForeignKey
)
from sqlalchemy.sql import func
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    # Primary Key
    user_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Authentication
    email = Column(
        String(255),
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    # Professional Information
    full_name = Column(
        String(255),
        nullable=False
    )

    license_number = Column(
        String(100),
        unique=True,
        nullable=True
    )

    # Organization relation
    organization_id = Column(
        String,
        ForeignKey("organizations.organization_id"),
        nullable=True
    )

    # Role management
    role = Column(
        String,
        default="practitioner"
    )
    # admin / practitioner / supervisor / viewer / 

    # Account status
    status = Column(
        String,
        default="pending_verification"
    )
    # active / inactive / suspended / pending_verification

    # Verification
    email_verified = Column(
        Boolean,
        default=False
    )

    phone_verified = Column(
        Boolean,
        default=False
    )

    otp = Column(
        String(10),
        nullable=True
    )

    otp_expiry = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # Contact info
    phone = Column(
        String(20),
        nullable=True
    )

    timezone = Column(
        String(50),
        nullable=True
    )

    language_preference = Column(
        String(10),
        nullable=True
    )

    # 2FA
    twofa_enabled = Column(
        Boolean,
        default=False
    )

    twofa_secret = Column(
        String(255),
        nullable=True
    )

    # Security tracking
    failed_login_attempts = Column(
        Integer,
        default=0
    )

    locked_until = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    last_login = Column(
        DateTime(timezone=True),
        nullable=True
    )

    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    specialization = Column(
        String(255),
        nullable=True
    )

    department = Column(
        String(255),
        nullable=True
    )

    signature_url = Column(
        String,
        nullable=True
    )