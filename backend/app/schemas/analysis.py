from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime


class AIAnalysisCreate(BaseModel):
    upload_id: str
    source_file_name: str
    source_file_type: str
    patient_id: Optional[str] = None
    extracted_text: Optional[str] = None


class AIAnalysisUpdate(BaseModel):
    notes: Optional[str] = None


class AIAnalysisApproval(BaseModel):
    notes: Optional[str] = None


class AIAnalysisRecord(BaseModel):
    analysis_id: str
    upload_id: str
    user_id: str
    organization_id: str
    source_file_name: str
    source_file_type: str
    extracted_text: Optional[str] = None
    analysis_status: Optional[str] = "pending"
    generated_subjective: Optional[str] = None
    generated_objective: Optional[str] = None
    generated_assessment: Optional[str] = None
    generated_plan: Optional[str] = None
    generated_medications: Optional[List[Dict[str, Any]]] = None
    confidence_score: Optional[Decimal] = None
    key_entities: Optional[Dict[str, Any]] = None
    comparison_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    analysis_timestamp: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Legacy aliases
AnalysisUpload = AIAnalysisCreate
AnalysisUpdate = AIAnalysisUpdate
AnalysisApproval = AIAnalysisApproval