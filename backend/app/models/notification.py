import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey
)

from sqlalchemy.sql import func

from app.db.base import Base


class Notification(Base):

    __tablename__ = "notifications"

    notification_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    user_id = Column(
        String,
        ForeignKey("users.user_id"),
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    type = Column(
        String,
        nullable=False
    )

    is_read = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )