from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class SoapReportCreate(BaseModel):
    consultation_id: str
    report_type: Optional[str] = "soap_note"


class SoapReportUpdate(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None

    report_type: Optional[str] = None
    content: Optional[Dict[str, Any]] = None

    medications: Optional[List[Dict[str, Any]]] = None

    follow_up_needed: Optional[bool] = False
    follow_up_days: Optional[int] = None

    status: Optional[str] = None


class SoapReport(BaseModel):
    report_id: str
    consultation_id: Optional[str] = None
    patient_id: Optional[str] = None
    user_id: str
    organization_id: str
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    
    report_type: Optional[str] = "soap_note"
    content: Optional[Dict[str, Any]] = None
    
    medications: Optional[List[Dict[str, Any]]] = None
    follow_up_needed: Optional[bool] = False
    follow_up_days: Optional[int] = None
    status: Optional[str] = "draft"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Legacy aliases used by report_service.py
ReportCreate = SoapReportCreate
ReportUpdate = SoapReportUpdate
