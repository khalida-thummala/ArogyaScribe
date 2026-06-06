from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.models.report import Report
from app.models.patient import Patient
from app.models.user import User
from app.core.deps import get_current_user
from app.services.export_service import ExportService
from app.services.dictation_service import DictationService
import io
import json

router = APIRouter()


@router.post("/{report_id}/export")
def export_report(
    report_id: str,
    data: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    doctor = db.query(User).filter(
        User.user_id == report.user_id
    ).first() or current_user

    patient = (
        db.query(Patient).filter(
            Patient.patient_id == report.patient_id
        ).first()
        if report.patient_id else None
    )

    if patient is None:

        class _StubPatient:

            full_name = "Unlinked Patient"

            first_name = "Unlinked"

            last_name = "Patient"

            patient_id = (
                report.patient_id or "N/A"
            )

        patient = _StubPatient()

    fmt = (
        data.get("format") or "pdf"
    ).lower()

    safe_id = report_id[:8]

    if fmt == "docx":

        file_bytes = (
            ExportService.generate_docx_bytes(
                report,
                doctor,
                patient
            )
        )

        media_type = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

        filename = (
            f"SOAP_Report_{safe_id}.docx"
        )

    else:
        ke = report.key_entities
        if ke and isinstance(ke, str):
            try:
                ke = json.loads(ke)
            except Exception:
                pass
        
        is_dictation = isinstance(ke, dict) and ke.get("source") == "voice_dictation"
        
        if is_dictation:
            # Reconstruct the dictation dict
            import os
            report_dict = ke.get("original_dictation", {})
            if not report_dict:
                subj = json.loads(report.subjective) if report.subjective and isinstance(report.subjective, str) else report.subjective or {}
                obj = json.loads(report.objective) if report.objective and isinstance(report.objective, str) else report.objective or {}
                asses = json.loads(report.assessment) if report.assessment and isinstance(report.assessment, str) else report.assessment or {}
                plan = json.loads(report.plan) if report.plan and isinstance(report.plan, str) else report.plan or {}
                report_dict = {
                    "indication": subj.get("indication", ""),
                    "history": subj.get("history", ""),
                    "findings": obj.get("findings", ""),
                    "impression": asses.get("impression", ""),
                    "plan": plan.get("plan", ""),
                    "follow_up": plan.get("follow_up", ""),
                    "notes": plan.get("notes", ""),
                    "medications": report.medications or [],
                    "patient_name": ke.get("patient_name", patient.full_name),
                    "doctor_name": getattr(doctor, "full_name", ""),
                    "date": str(report.created_at.date()) if report.created_at else ""
                }
            
            letterhead_bytes = None
            letterhead_ext = "png"
            lh_path = ke.get("letterhead_path")
            if lh_path and os.path.exists(lh_path):
                with open(lh_path, "rb") as f:
                    letterhead_bytes = f.read()
                letterhead_ext = lh_path.rsplit(".", 1)[-1].lower() if "." in lh_path else "png"

            file_bytes = DictationService.generate_pdf(
                report_dict,
                letterhead_bytes=letterhead_bytes,
                letterhead_ext=letterhead_ext
            )
            filename = f"Dictation_Report_{safe_id}.pdf"
        else:
            print(f"[DEBUG] is_dictation was False! ke type: {type(ke)}, ke: {ke}")
            file_bytes = ExportService.generate_pdf_bytes(report, doctor, patient)
            filename = f"SOAP_Report_{safe_id}.pdf"

        media_type = "application/pdf"
        print(f"[DEBUG] Returning PDF. is_dictation={is_dictation}")

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={
            "Content-Disposition":
            f'attachment; filename="{filename}"'
        },
    )