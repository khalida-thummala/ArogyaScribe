import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class PatientChatHistory(Base):
    __tablename__ = "patient_chat_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(36), ForeignKey("reports.report_id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
