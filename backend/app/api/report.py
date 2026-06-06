from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from app.db.deps import get_db
from app.schemas.report import SoapReport, SoapReportCreate, SoapReportUpdate
from app.core.deps import get_current_user
from app.services.report_service import ReportService
from app.core.roles import require_role
from app.models.report import Report
import logging
from fastapi import Body
from fastapi.responses import StreamingResponse
from app.services.export_service import ExportService
from app.services.dictation_service import DictationService
import os
import json
from app.models.patient import Patient
from app.models.user import User
import io
logger = logging.getLogger(__name__)

router = APIRouter()

def _serialize_report(r: Report) -> dict:
    """Safely serialize a Report ORM object to a dict."""
    return {
        "report_id": r.report_id,
        "consultation_id": r.consultation_id,
        "patient_id": r.patient_id,
        "user_id": r.user_id,
        "organization_id": r.organization_id,
        "subjective": r.subjective,
        "objective": r.objective,
        "assessment": r.assessment,
        "plan": r.plan,
        "report_type": r.report_type,
        "content": r.content,
        "medications": r.medications,
        "key_entities": r.key_entities,
        "follow_up_needed": r.follow_up_needed,
        "follow_up_days": r.follow_up_days,
        "status": r.status or "draft",
        "approved_by": r.approved_by,
        "approved_at": r.approved_at.isoformat() if r.approved_at else None,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }

@router.get("")
def list_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    patient_id: Optional[str] = None
):
    """List all reports for the current user's organization, newest first."""
    try:
        if current_user.role == "practitioner":
            query = db.query(Report).filter(
                Report.user_id ==
                current_user.user_id
            )
        else:
            query = db.query(Report).filter(
                Report.organization_id ==
                current_user.organization_id
            )
        if patient_id:
            query = query.filter(Report.patient_id == patient_id)
        
        reports = query.order_by(Report.created_at.desc()).all()
        return [_serialize_report(r) for r in reports]
    except Exception as e:
        logger.error(f"Error listing reports: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/consultation/{consultation_id}")
def get_report_by_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Report).filter(
        Report.consultation_id == consultation_id
    )

    if current_user.role == "practitioner":
        query = query.filter(
            Report.user_id == current_user.user_id
        )
    else:
        query = query.filter(
            Report.organization_id ==
            current_user.organization_id
        )

    report = query.first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return _serialize_report(report)

@router.get("/{report_id}")
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    
    query = db.query(Report).filter(
        Report.report_id == report_id
    )

    if current_user.role == "practitioner":
        query = query.filter(
            Report.user_id ==
            current_user.user_id
        )
    else:
        query = query.filter(
            Report.organization_id ==
            current_user.organization_id
        )

    report = query.first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _serialize_report(report)

@router.put("/{report_id}")
def update_report(
    report_id: str,
    data: SoapReportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = ReportService.update_report(db, report_id, data, current_user.organization_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _serialize_report(report)

@router.post("/{report_id}/finalize")
def finalize_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Try by report_id first
    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    # Fallback to consultation_id
    if not report:
        report = db.query(Report).filter(
            Report.consultation_id == report_id,
            Report.organization_id == current_user.organization_id
        ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report = ReportService.finalize_report(
        db, report.report_id, current_user.user_id, current_user.organization_id
    )
    return _serialize_report(report)

@router.post("/{report_id}/approve")
def approve_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Try by report_id first
    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    # Fallback to consultation_id
    if not report:
        report = db.query(Report).filter(
            Report.consultation_id == report_id,
            Report.organization_id == current_user.organization_id
        ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check permissions: Admin/Supervisor can approve anything. 
    # Practitioners can only approve their own reports.
    if current_user.role not in ["admin", "supervisor"] and report.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    report.status = "approved"
    report.approved_by = current_user.user_id
    report.approved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(report)

    # --- RAG Integration: Index the newly approved report ---
    if report.patient_id:
        from app.services.rag_service import RagService
        content = f"SUBJECTIVE:\n{report.subjective}\n\nOBJECTIVE:\n{report.objective}\n\nASSESSMENT:\n{report.assessment}\n\nPLAN:\n{report.plan}"
        try:
            RagService.index_document(
                db,
                patient_id=report.patient_id,
                source_id=report.report_id,
                source_type="approved_report",
                content=content
            )
        except Exception as index_err:
            logger.error(f"RAG Indexing Error (Approve API): {index_err}")
    # --------------------------------------------------------

    return _serialize_report(report)

@router.post("/{report_id}/sign")
def sign_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):
    query = db.query(Report).filter(
        Report.report_id == report_id
    )

    if current_user.role == "practitioner":
        query = query.filter(
            Report.user_id ==
            current_user.user_id
        )
    else:
        query = query.filter(
            Report.organization_id ==
            current_user.organization_id
        )

    report = query.first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "signed"

    db.commit()

    return {"message": "Report signed"}

@router.post("/{report_id}/archive")
def archive_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin"])
    )
):
    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "archived"

    db.commit()

    return {"message": "Report archived"}




@router.delete("/{report_id}")
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Report).filter(
        Report.report_id == report_id
    )

    if current_user.role == "practitioner":
        query = query.filter(
            Report.user_id ==
            current_user.user_id
        )
    else:
        query = query.filter(
            Report.organization_id ==
            current_user.organization_id
        )

    report = query.first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()

    return {"message": "Report deleted successfully"}

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

    from app.models.organization import Organization
    organization = db.query(Organization).filter(
        Organization.organization_id == report.organization_id
    ).first()

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
                patient,
                organization
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
            file_bytes = (
                ExportService.generate_pdf_bytes(
                    report,
                    doctor,
                    patient,
                    organization
                )
            )
            filename = f"SOAP_Report_{safe_id}.pdf"

        media_type = "application/pdf"

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={
            "Content-Disposition":
            f'attachment; filename="{filename}"'
        },
    )