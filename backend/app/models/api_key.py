import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,Integer
)

from sqlalchemy.sql import func

from app.db.base import Base

class APIKey(Base):

    __tablename__ = "api_keys"

    api_key_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    organization_id = Column(
        String,
        ForeignKey("organizations.organization_id"),
        nullable=False
    )

    key = Column(
        String,
        unique=True,
        nullable=False
    )

    name = Column(
        String,
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

    request_count = Column(
        Integer,
        default=0
    )

    last_used_at = Column(
        DateTime(timezone=True),
        nullable=True
    )