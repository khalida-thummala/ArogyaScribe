from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ConsultationBase(BaseModel):
    patient_id: str
    consultation_type: str
    chief_complaint: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class ConsultationCreate(ConsultationBase):
    class Config:
        from_attributes = True


class ConsultationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    transcription_text: Optional[str] = None
    transcription_status: Optional[str] = None
    transcription_confidence: Optional[Decimal] = None


class AudioMetadata(BaseModel):
    audio_file_id: str
    audio_duration_seconds: int
    audio_bitrate: str
    audio_checksum: str


class ConsultationEnd(BaseModel):
    audio_data: Optional[str] = None
    metadata: Optional[AudioMetadata] = None


class Consultation(ConsultationBase):
    consultation_id: str
    user_id: str
    organization_id: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    transcription_status: Optional[str] = None
    transcription_text: Optional[str] = None
    transcription_confidence: Optional[Decimal] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True