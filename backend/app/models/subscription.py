import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.db.base import Base


class OrganizationSubscription(Base):
    __tablename__ = "organization_subscriptions"

    subscription_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.organization_id"),
        nullable=False
    )

    plan_name = Column(
        String,
        default="free_trial"
    )
    # free_trial / basic / premium / enterprise

    report_limit = Column(
        Integer,
        default=20
    )

    transcription_limit = Column(
        Integer,
        default=20
    )

    reports_used = Column(
        Integer,
        default=0
    )

    transcriptions_used = Column(
        Integer,
        default=0
    )

    status = Column(
        String,
        default="active"
    )
    # active / expired / cancelled

    expires_at = Column(
        DateTime(timezone=True),
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