import uuid
from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.sql import func
from app.db.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    organization_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    name = Column(
        String(255),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=True
    )

    subscription_plan = Column(
        String,
        default="basic"
    )
    # basic / premium / enterprise

    billing_status = Column(
        String,
        default="active"
    )
    # active / unpaid / cancelled

    max_users = Column(
        Integer,
        default=10
    )

    # Template Customization Fields
    default_template_id = Column(
        String,
        default="minimal"
    )
    
    primary_color = Column(
        String,
        default="#0d9488" # Teal
    )
    
    secondary_color = Column(
        String,
        default="#374151" # Gray
    )
    
    font_family = Column(
        String,
        default="Helvetica"
    )
    
    footer_text = Column(
        String,
        nullable=True
    )

    # Branding Fields
    logo_url = Column(
        String,
        nullable=True
    )

    letterhead_url = Column(
        String,
        nullable=True
    )

    address = Column(
        String,
        nullable=True
    )

    contact_info = Column(
        String,
        nullable=True
    )

    hospital_name_override = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )