from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from app.db.base import Base
from datetime import datetime
import uuid

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=True)
    organization_id = Column(String, ForeignKey("organizations.organization_id"), nullable=True)
    action = Column(String, nullable=False) # e.g., LOGIN, VIEW_PATIENT, CREATE_REPORT
    resource_type = Column(String) # e.g., Patient, Consultation
    resource_id = Column(String)
    details = Column(JSON)
    ip_address = Column(String)
    user_agent = Column(String)
    status = Column(String) # success, failure
    created_at = Column(DateTime, default=datetime.utcnow)
