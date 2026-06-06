from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from fastapi.responses import Response
from typing import List, Optional
from fastapi import UploadFile, File
import os
from app.models.subscription import OrganizationSubscription
from app.models.patient import Patient
from app.models.user import User
from app.db.deps import get_db
from app.models.consultation import Consultation
from app.models.report import Report
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationEnd,
    AudioMetadata
)
from app.core.deps import get_current_user
from app.core.roles import require_role
from app.core.ai import generate_soap
from app.core.speech import transcribe_audio
from app.services.consultation_service import ConsultationService
from app.services.export_service import ExportService
import json
import uuid
print("CONSULTATION ROUTER LOADED")

router = APIRouter()


# GET CONSULTATIONS

@router.get("")
def list_consultations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    patient_id: Optional[str] = None,
    limit: int = 10
):
    return ConsultationService.get_consultations(
        db,
        current_user,
        patient_id
    )

# CREATE CONSULTATION
@router.post("")
def create_consultation(
    data: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return ConsultationService.create_consultation(
        db, data, current_user.user_id, current_user.organization_id
    )

# GET SINGLE CONSULTATION
@router.get("/{consultation_id}")
def get_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = ConsultationService.get_consultation_by_id(
    db,
    consultation_id,
    current_user
)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation

# GET TRANSCRIPTION
@router.get("/{consultation_id}/transcription")
def get_transcription(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id,
        Consultation.organization_id == current_user.organization_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    return {
        "transcription_text": consultation.transcription_text,
        "transcription_status": consultation.transcription_status,
        "confidence_score": consultation.transcription_confidence
    }

# START CONSULTATION
@router.post("/{consultation_id}/start")
def start_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):
    consultation = ConsultationService.start_consultation(
        db, consultation_id, current_user.organization_id
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    return {"message": "Consultation started"}

# END CONSULTATION


@router.post("/{consultation_id}/end")
async def end_consultation(
    consultation_id: str,
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):

    os.makedirs("uploads", exist_ok=True)

    # Use a unique filename to avoid concurrent recording overwrites
    ext = os.path.splitext(audio.filename or "recording.webm")[1] or ".webm"
    file_path = f"uploads/{consultation_id}{ext}"

    with open(file_path, "wb") as buffer:
        buffer.write(await audio.read())

    consultation = ConsultationService.end_consultation_init(
        db,
        consultation_id,
        current_user.organization_id,
        audio_file_path=file_path
    )

    if not consultation:
        raise HTTPException(
            status_code=404,
            detail="Consultation not found"
        )
        
    background_tasks.add_task(
        ConsultationService.process_consultation_background,
        consultation_id=consultation_id,
        organization_id=current_user.organization_id,
        audio_file_path=file_path
    )

    return {
        "consultation_id": consultation.consultation_id,
        "status": consultation.status,
        "transcription_status": consultation.transcription_status,
        "transcription_text": consultation.transcription_text,
        "report_id": (
            db.query(Report.report_id)
            .filter(
                Report.consultation_id == consultation.consultation_id,
                Report.organization_id == current_user.organization_id
            )
            .scalar()
        )
    }
@router.post("/{consultation_id}/generate-soap")
def generate_soap_endpoint(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id,
        Consultation.organization_id == current_user.organization_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    existing_report = db.query(Report).filter(
        Report.consultation_id == consultation_id,
        Report.organization_id == current_user.organization_id
    ).first()

    from app.core.ai import generate_soap, check_drug_interactions
    from app.services.rag_service import RagService

    transcript = (consultation.transcription_text or "").strip()
    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="No transcription found for this consultation"
        )

    # RAG Integration: Fetch historical context for this patient
    historical_context = ""
    if consultation.patient_id:
        try:
            historical_context = RagService.get_augmented_context(
                db, 
                patient_id=consultation.patient_id, 
                query_text=transcript
            )
        except Exception as e:
            # If RAG fails, we just proceed without historical context
            print(f"RAG Retrieval Error in Consultation: {e}")

    ai_output = generate_soap(transcript, historical_context=historical_context)

    try:
        soap = json.loads(ai_output)
    except Exception:
        raise HTTPException(status_code=500, detail="Invalid AI response")

    if soap.get("_error"):
        raise HTTPException(status_code=502, detail=soap["_error"])

    meds = soap.get("medications", [])
    interactions = check_drug_interactions(meds) if meds else []

    def stringify(val):
        if isinstance(val, (dict, list)):
            return json.dumps(val, indent=2)
        return str(val) if val is not None else ""

    report = existing_report or Report(
        consultation_id=consultation_id,
        patient_id=consultation.patient_id,
        user_id=current_user.user_id,
        organization_id=current_user.organization_id,
        status="draft"
    )

    report.subjective = stringify(soap.get("subjective"))
    report.objective = stringify(soap.get("objective"))
    report.assessment = stringify(soap.get("assessment"))
    report.plan = stringify(soap.get("plan"))
    report.medications = soap.get("medications", [])
    report.key_entities = {"interactions": interactions}
    report.follow_up_needed = soap.get("follow_up_needed", False)
    report.follow_up_days = soap.get("follow_up_days")

    if not existing_report:
        db.add(report)

    consultation.status = "completed"
    db.commit()
    db.refresh(report)

    return report

@router.get("/{consultation_id}/report")
def get_consultation_report(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = db.query(Report).filter(
        Report.consultation_id == consultation_id,
        Report.organization_id == current_user.organization_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.put("/{consultation_id}/report")
def update_consultation_report(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id,
        Consultation.organization_id == current_user.organization_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    report = db.query(Report).filter(
        Report.consultation_id == consultation_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        report = Report(
            consultation_id=consultation_id,
            patient_id=consultation.patient_id,
            user_id=current_user.user_id,
            organization_id=current_user.organization_id,
            status="draft"
        )
        db.add(report)

    for key, value in data.items():
        if hasattr(report, key):
            setattr(report, key, value)

    db.commit()
    db.refresh(report)
    return report

@router.post("/{consultation_id}/report/approve")
def approve_consultation_report(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id,
        Consultation.organization_id == current_user.organization_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    report = db.query(Report).filter(
        Report.consultation_id == consultation_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        report = Report(
            consultation_id=consultation_id,
            patient_id=consultation.patient_id,
            user_id=current_user.user_id,
            organization_id=current_user.organization_id,
            status="draft"
        )
        db.add(report)

    for key in ("subjective", "objective", "assessment", "plan", "medications", "follow_up_needed", "follow_up_days"):
        if key in data and hasattr(report, key):
            setattr(report, key, data[key])

    report.status = "approved"
    report.approved_by = current_user.user_id
    report.approved_at = datetime.now(timezone.utc)
    subscription = db.query(
    OrganizationSubscription
    ).filter(
        OrganizationSubscription.organization_id ==
        current_user.organization_id
    ).first()

    if subscription:
        if subscription.reports_used >= subscription.report_limit:
            raise HTTPException(
                status_code=403,
                detail="Report limit reached. Please upgrade your subscription."
            )
        subscription.reports_used += 1

    db.commit()
    db.refresh(report)
    return report



@router.get("/{consultation_id}/export")
def export_consultation_report(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = db.query(Report).filter(
        Report.consultation_id == consultation_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    patient = db.query(Patient).filter(
        Patient.patient_id == report.patient_id
    ).first()

    doctor = db.query(User).filter(
        User.user_id == report.user_id
    ).first()

    if not patient or not doctor:
        raise HTTPException(
            status_code=404,
            detail="Incomplete report metadata"
        )

    pdf_bytes = ExportService.generate_pdf_bytes(
        report,
        doctor,
        patient
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f"attachment; filename=report-{consultation_id}.pdf"
        }
    )
    
@router.patch("/{consultation_id}/draft")
def save_draft_transcription(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    """
    Auto-save endpoint — persists in-progress transcription every 30 seconds.
    Accepts: { transcription_text: str, updated_at: str (ISO-8601) }
    """
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id,
        Consultation.organization_id == current_user.organization_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    consultation.transcription_text = data.get("transcription_text", consultation.transcription_text)
    try:
        consultation.updated_at = datetime.fromisoformat(
            data["updated_at"].replace("Z", "+00:00")
        ) if "updated_at" in data else datetime.now(timezone.utc)
    except (ValueError, KeyError):
        consultation.updated_at = datetime.now(timezone.utc)

    db.commit()
    return {"status": "saved", "consultation_id": consultation_id}


@router.put("/{consultation_id}")
def update_consultation(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    updated = ConsultationService.update_consultation(
        db, consultation_id, current_user.organization_id, data
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return updated

@router.delete("/{consultation_id}")
def delete_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):

    print("DELETE ROUTE HIT")
    print("CONSULTATION ID:", consultation_id)
    print("CURRENT USER:", current_user)

    success = ConsultationService.delete_consultation(
        db,
        consultation_id,
        current_user.organization_id
    )

    print("DELETE SUCCESS:", success)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Consultation not found"
        )

    return {
        "message": "Consultation deleted"
    }