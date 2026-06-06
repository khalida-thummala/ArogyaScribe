from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from sqlalchemy import cast, String
from app.core.deps import get_current_user
from uuid import UUID
from fastapi.responses import Response
from pydantic import BaseModel
from app.core.api_key_auth import validate_api_key
from app.services.radiology_service import (
    analyze_xray_image,
    generate_embedding
)

from app.services.storage_service import (
    upload_image,
    generate_signed_url,
    get_image_bytes
)

from app.services.dicom_service import (
    dicom_to_png_bytes
)

from app.services.export_service import ExportService

from app.models.radiology import RadiologyReport
from app.models.patient import Patient

from app.db.session import SessionLocal

router = APIRouter()


@router.post("/analyze-xray")
async def analyze_xray(
    patient_id: UUID,
    file: UploadFile = File(...),
    
):

    db: Session = SessionLocal()

    metadata = {}

    # Handle DICOM files
    if file.filename.lower().endswith(".dcm"):

        dicom_data = await file.read()

        image_bytes, metadata = dicom_to_png_bytes(
            dicom_data
        )

        print("DICOM Metadata:", metadata)

        raw_storage_bytes = dicom_data

    else:

        image_bytes = await file.read()

        raw_storage_bytes = image_bytes

    # Upload image to private storage
    image_key = upload_image(
        raw_storage_bytes,
        file.filename
    )

    # Fetch previous reports
    previous_reports = (
        db.query(RadiologyReport)
        .filter(
            RadiologyReport.patient_id == patient_id
        )
        .all()
    )

    # Build historical context
    history_text = ""

    for old_report in previous_reports:

        history_text += f"""
        Findings: {old_report.findings}

        Impression: {old_report.impression}

        Comparison: {old_report.comparison}
        """

    # Generate AI report
    report = await analyze_xray_image(
        image_bytes,
        history_text
    )

    # Generate embedding
    embedding = await generate_embedding(
        report["findings"]
    )

    # Save report
    db_report = RadiologyReport(

        patient_id=patient_id,

        image_url=image_key,

        modality=metadata.get("modality", ""),

        body_part=metadata.get("body_part", ""),

        study_date=metadata.get("study_date", ""),

        indication=report.get("indication", ""),

        technique=report.get("technique", ""),

        findings=report["findings"],

        impression=report["impression"],

        abnormalities=", ".join(
            report["abnormalities"]
        ),

        comparison=report.get(
            "comparison",
            ""
        ),

        status="DRAFT",

        embedding=embedding
    )

    db.add(db_report)

    db.commit()

    db.refresh(db_report)

    signed_image_url = generate_signed_url(
        db_report.image_url
    )

    db.close()

    return {
        "success": True,

        "patient_id": str(patient_id),

        "report_id": str(db_report.id),

        "previous_reports_count": len(
            previous_reports
        ),

        "image_url": signed_image_url,

        "dicom_metadata": metadata,

        "report": {
            **report,
            "status": "DRAFT"
        }
    }


@router.get("/image/{report_id}")
async def get_radiology_image(report_id: UUID):
    db: Session = SessionLocal()
    report = db.query(RadiologyReport).filter(RadiologyReport.id == report_id).first()
    db.close()
    
    if not report:
        return Response(status_code=404, content="Report not found")
        
    try:
        file_bytes = get_image_bytes(report.image_url)
        
        if report.image_url.lower().endswith('.dcm'):
            png_bytes, _ = dicom_to_png_bytes(file_bytes)
            return Response(content=png_bytes, media_type="image/png")
        else:
            return Response(content=file_bytes, media_type="application/octet-stream")
            
    except Exception as e:
        return Response(status_code=500, content=f"Failed to fetch image: {str(e)}")

@router.get("/patient-radiology-history/{patient_id}")
async def get_patient_radiology_history(
    patient_id: UUID
):

    db: Session = SessionLocal()

    reports = (
        db.query(RadiologyReport)
        .filter(
            RadiologyReport.patient_id == patient_id
        )
        .order_by(
            RadiologyReport.created_at.desc()
        )
        .all()
    )

    history = []

    for report in reports:

        signed_image_url = generate_signed_url(
            report.image_url
        )

        history.append({

            "report_id": str(report.id),

            "image_url": signed_image_url,

            "modality": report.modality,

            "body_part": report.body_part,

            "study_date": report.study_date,

            "indication": report.indication,

            "technique": report.technique,

            "findings": report.findings,

            "impression": report.impression,

            "comparison": report.comparison,

            "status": report.status,

            "created_at": (
                report.created_at.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if report.created_at
                else ""
            )
        })

    db.close()

    return {
        "patient_id": str(patient_id),
        "history": history
    }


@router.get("/similar-reports")
async def get_similar_reports(
    query: str
):

    db: Session = SessionLocal()

    query_embedding = await generate_embedding(
        query
    )

    results = (
        db.query(RadiologyReport)
        .order_by(
            RadiologyReport.embedding.cosine_distance(
                query_embedding
            )
        )
        .limit(5)
        .all()
    )

    matches = []

    for report in results:

        patient = (
            db.query(Patient)
            .filter(
                Patient.patient_id == str(
                    report.patient_id
                )
            )
            .first()
        )

        patient_name = (
            f"{patient.first_name} "
            f"{patient.last_name}"
            if patient
            else "Unknown Patient"
        )

        signed_image_url = generate_signed_url(
            report.image_url
        )

        matches.append({

            "patient_id": str(
                report.patient_id
            ),

            "patient_name": patient_name,

            "image_url": signed_image_url,

            "modality": report.modality,

            "body_part": report.body_part,

            "study_date": report.study_date,

            "indication": report.indication,

            "technique": report.technique,

            "findings": report.findings,

            "impression": report.impression,

            "comparison": report.comparison
        })

    db.close()

    return {
        "query": query,
        "matches": matches
    }


@router.get("/all-reports")
async def get_all_reports(current_user=Depends(get_current_user)):

    db: Session = SessionLocal()

    reports = (
        db.query(RadiologyReport)
        .join(Patient, Patient.patient_id == cast(RadiologyReport.patient_id, String))
        .filter(Patient.user_id == current_user.user_id)
        .order_by(
            RadiologyReport.created_at.desc()
        )
        .all()
    )

    history = []

    for report in reports:

        patient = (
            db.query(Patient)
            .filter(
                Patient.patient_id == str(
                    report.patient_id
                )
            )
            .first()
        )

        patient_name = (
            f"{patient.first_name} "
            f"{patient.last_name}"
            if patient
            else "Unknown Patient"
        )

        signed_image_url = generate_signed_url(
            report.image_url
        )

        history.append({

            "report_id": str(report.id),

            "patient_id": str(
                report.patient_id
            ),

            "patient_name": patient_name,

            "image_url": signed_image_url,

            "modality": report.modality,

            "body_part": report.body_part,

            "study_date": report.study_date,

            "indication": report.indication,

            "technique": report.technique,

            "findings": report.findings,

            "impression": report.impression,

            "comparison": report.comparison,

            "status": report.status,

            "created_at": (
                report.created_at.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if report.created_at
                else ""
            )
        })

    db.close()

    return {
        "reports": history
    }


@router.get("/export/{report_id}")
async def export_radiology_report(
    report_id: UUID,
    format: str = "pdf"
):

    db: Session = SessionLocal()

    report = (
        db.query(RadiologyReport)
        .filter(
            RadiologyReport.id == report_id
        )
        .first()
    )

    if not report:

        db.close()

        return Response(
            status_code=404,
            content="Report not found"
        )

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == str(
                report.patient_id
            )
        )
        .first()
    )

    if not patient:

        db.close()

        return Response(
            status_code=404,
            content="Patient not found"
        )

    try:

        pdf_bytes = (
            ExportService
            .generate_radiology_pdf_bytes(
                report,
                patient
            )
        )

    except Exception as e:

        db.close()

        return Response(
            status_code=500,
            content=f"Failed to generate PDF: {str(e)}"
        )

    finally:

        db.close()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f'attachment; filename="Radiology_Report_{str(report.id)[:8]}.pdf"'
        }
    )


class RadiologyReportUpdate(
    BaseModel
):

    indication: str = None

    technique: str = None

    findings: str = None

    impression: str = None

    comparison: str = None

    status: str = None


@router.put("/{report_id}")
async def update_radiology_report(
    report_id: UUID,
    req: RadiologyReportUpdate
):

    db: Session = SessionLocal()

    report = (
        db.query(RadiologyReport)
        .filter(
            RadiologyReport.id == report_id
        )
        .first()
    )

    if not report:

        db.close()

        return Response(
            status_code=404,
            content="Report not found"
        )

    if req.indication is not None:
        report.indication = req.indication

    if req.technique is not None:
        report.technique = req.technique

    if req.findings is not None:
        report.findings = req.findings

    if req.impression is not None:
        report.impression = req.impression

    if req.comparison is not None:
        report.comparison = req.comparison

    if req.status is not None:
        report.status = req.status

    db.commit()

    db.refresh(report)

    db.close()

    return {
        "success": True,
        "message":
        "Report updated successfully"
    }


@router.delete("/{report_id}")
async def delete_radiology_report(
    report_id: UUID
):

    db: Session = SessionLocal()

    report = (
        db.query(RadiologyReport)
        .filter(
            RadiologyReport.id == report_id
        )
        .first()
    )

    if not report:

        db.close()

        return Response(
            status_code=404,
            content="Report not found"
        )

    db.delete(report)

    db.commit()

    db.close()

    return {
        "success": True,
        "message":
        "Report deleted successfully"
    }