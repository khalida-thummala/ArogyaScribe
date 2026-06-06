import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from app.db.base import Base


class ReportTemplate(Base):
    __tablename__ = "report_templates"

    template_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.organization_id"),
        nullable=True # Null means it's a global template available to all
    )

    name = Column(
        String(255),
        nullable=False
    )

    type_key = Column(
        String(100),
        nullable=False,
        unique=True
    )

    description = Column(
        String,
        nullable=True
    )

    schema_json = Column(
        JSON,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )
