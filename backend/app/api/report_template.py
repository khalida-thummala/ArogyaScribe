from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.deps import get_db
from app.core.deps import get_current_user
from app.models.report_template import ReportTemplate
from app.schemas.report_template import ReportTemplateResponse, ReportTemplateCreate, ReportTemplateUpdate

router = APIRouter()

@router.get("", response_model=List[ReportTemplateResponse])
def list_templates(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    List all global templates and templates specific to the user's organization.
    """
    templates = db.query(ReportTemplate).filter(
        (ReportTemplate.organization_id == None) | 
        (ReportTemplate.organization_id == current_user.organization_id)
    ).all()
    return templates

@router.post("", response_model=ReportTemplateResponse)
def create_template(
    data: ReportTemplateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Enforce organization isolation
    org_id = current_user.organization_id
    if current_user.role == "admin" and data.organization_id is None:
        # System admin can create global templates
        org_id = None
        
    template = ReportTemplate(
        **data.dict(exclude={"organization_id"}),
        organization_id=org_id
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.put("/{template_id}", response_model=ReportTemplateResponse)
def update_template(
    template_id: str,
    data: ReportTemplateUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    template = db.query(ReportTemplate).filter(
        ReportTemplate.template_id == template_id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # Only allow editing org's own templates, or admin editing global templates
    if template.organization_id != current_user.organization_id:
        if current_user.role != "admin" or template.organization_id is not None:
            raise HTTPException(status_code=403, detail="Not authorized to edit this template")

    for k, v in data.dict(exclude_unset=True).items():
        setattr(template, k, v)

    db.commit()
    db.refresh(template)
    return template
