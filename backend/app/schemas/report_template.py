from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ReportTemplateBase(BaseModel):
    name: str
    type_key: str
    description: Optional[str] = None
    schema_json: Dict[str, Any]
    is_active: bool = True

class ReportTemplateCreate(ReportTemplateBase):
    organization_id: Optional[str] = None

class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schema_json: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class ReportTemplateResponse(ReportTemplateBase):
    template_id: str
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
