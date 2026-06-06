import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class UpgradeRequest(Base):
    __tablename__ = "upgrade_requests"

    request_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.organization_id"),
        nullable=False
    )

    current_plan = Column(String)
    requested_plan = Column(String)

    message = Column(String)

    status = Column(
        String,
        default="pending"
    )
    # pending / approved / rejected

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )