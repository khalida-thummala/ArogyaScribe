from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate

from fastapi import HTTPException

class PatientService:
    @staticmethod
    def create_patient(db: Session, patient_data: PatientCreate, user_id: str, organization_id: str):
        if patient_data.medical_id:
            existing = db.query(Patient).filter(
                Patient.organization_id == organization_id,
                Patient.medical_id == patient_data.medical_id,
                Patient.deleted_at == None
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Medical ID already exists")

        new_patient = Patient(
            **patient_data.dict(),
            user_id=user_id,
            doctor_id=user_id,
            organization_id=organization_id
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        return new_patient

    @staticmethod
    def get_patients(
        db: Session,
        current_user,
        search: Optional[str] = None
    ):
        query = db.query(Patient).filter(
            Patient.deleted_at == None
        )

        if current_user.role == "practitioner":
            query = query.filter(
                Patient.doctor_id ==
                current_user.user_id
            )

        elif current_user.role == "organization_admin":
            query = query.filter(
                Patient.organization_id ==
                current_user.organization_id
            )

        if search:
            query = query.filter(
                (Patient.first_name.ilike(f"%{search}%")) |
                (Patient.last_name.ilike(f"%{search}%")) |
                (Patient.medical_id.ilike(f"%{search}%"))
            )

        return query.all()

    @staticmethod
    def get_patient_by_id(db: Session, patient_id: str, organization_id: str) -> Optional[Patient]:
        return db.query(Patient).filter(
            Patient.patient_id == patient_id,
            Patient.organization_id == organization_id
        ).first()

    @staticmethod
    def update_patient(db: Session, patient_id: str, updated_data: PatientUpdate, organization_id: str):
        patient = db.query(Patient).filter(
            Patient.patient_id == patient_id,
            Patient.organization_id == organization_id
        ).first()

        if not patient:
            return None

        for key, value in updated_data.dict(exclude_unset=True).items():
            setattr(patient, key, value)

        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def delete_patient(db: Session, patient_id: str, organization_id: str):
        patient = db.query(Patient).filter(
            Patient.patient_id == patient_id,
            Patient.organization_id == organization_id
        ).first()

        if not patient:
            return False

        patient.deleted_at = datetime.utcnow()
        patient.status = "archived"
        db.commit()
        return True
