from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.deps import get_db
from app.schemas.patient import Patient, PatientCreate, PatientUpdate
from app.core.deps import get_current_user
from app.core.roles import require_role
from app.services.patient_service import PatientService

router = APIRouter()

@router.post("", response_model=Patient)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    return PatientService.create_patient(
        db, patient, current_user.user_id, current_user.organization_id
    )

@router.get("", response_model=List[Patient])
def get_patients(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return PatientService.get_patients( db,
        current_user,
        search)

@router.get("/{patient_id}", response_model=Patient)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    patient = PatientService.get_patient_by_id(db, patient_id, current_user.organization_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}", response_model=Patient)
def update_patient(
    patient_id: str,
    updated: PatientUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    patient = PatientService.update_patient(db, patient_id, updated, current_user.organization_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    success = PatientService.delete_patient(db, patient_id, current_user.organization_id)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient archived successfully"}
