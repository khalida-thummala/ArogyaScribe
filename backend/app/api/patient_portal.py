from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.deps import get_current_user
from app.models.patient import Patient
from app.models.report import Report
from app.models.user import User

router = APIRouter()

@router.get("/reports")
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.email == current_user.email
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    reports = db.query(Report).filter(
        Report.patient_id == patient.patient_id
    ).order_by(
        Report.created_at.desc()
    ).all()

    return reports


from fastapi.responses import Response

@router.get("/reports/{report_id}")
def get_my_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.email == current_user.email
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.patient_id == patient.patient_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )
        
    doctor = db.query(User).filter(User.user_id == report.user_id).first()
    doctor_info = None
    if doctor:
        doctor_info = {
            "name": doctor.full_name or f"{doctor.first_name} {doctor.last_name}".strip(),
            "email": doctor.email,
            "license_number": doctor.license_number
        }

    return {
        **report.__dict__,
        "doctor": doctor_info
    }


@router.get("/reports/{report_id}/pdf")
def download_my_report_pdf(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.email == current_user.email
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.patient_id == patient.patient_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    doctor = db.query(User).filter(User.user_id == report.user_id).first()
    
    from app.services.export_service import ExportService
    pdf_bytes = ExportService.generate_pdf_bytes(report, doctor, patient)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Report_{report_id[:8]}.pdf"
        }
    )


from app.models.patient_chat import PatientChatHistory

@router.get("/reports/{report_id}/chat")
def get_chat_history(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.email == current_user.email
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    history = db.query(PatientChatHistory).filter(
        PatientChatHistory.report_id == report_id,
        PatientChatHistory.patient_id == patient.patient_id
    ).order_by(PatientChatHistory.created_at.asc()).all()
    
    return [{"id": msg.id, "role": msg.role, "content": msg.content} for msg in history]


from pydantic import BaseModel

class PatientChatRequest(BaseModel):
    question: str

@router.post("/reports/{report_id}/chat")
def chat_about_report(
    report_id: str,
    chat_request: PatientChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.email == current_user.email
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.patient_id == patient.patient_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )
        
    # Save user message
    user_msg = PatientChatHistory(
        report_id=report_id,
        patient_id=patient.patient_id,
        role="user",
        content=chat_request.question
    )
    db.add(user_msg)
    db.commit()

    # Get recent history
    history_records = db.query(PatientChatHistory).filter(
        PatientChatHistory.report_id == report_id,
        PatientChatHistory.patient_id == patient.patient_id
    ).order_by(PatientChatHistory.created_at.asc()).limit(20).all()
    
    # Exclude the newly saved user message from the context to avoid duplication
    history_context = [{"role": msg.role, "content": msg.content} for msg in history_records[:-1]]

    # Build report data for context
    report_data = {
        "subjective": report.subjective,
        "objective": report.objective,
        "assessment": report.assessment,
        "plan": report.plan,
        "medications": report.medications,
        "follow_up_needed": report.follow_up_needed,
        "follow_up_days": report.follow_up_days,
        "status": report.status,
    }

    from app.core.ai import answer_patient_question
    answer = answer_patient_question(report_data, chat_request.question, history_context)
    
    # Save AI response
    ai_msg = PatientChatHistory(
        report_id=report_id,
        patient_id=patient.patient_id,
        role="assistant",
        content=answer
    )
    db.add(ai_msg)
    db.commit()

    return {"answer": answer}
