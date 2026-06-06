from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import SessionLocal
from app.core.api_key_auth import validate_api_key

from app.services.radiology_service import (
    analyze_xray_image,
    generate_embedding
)

from app.services.storage_service import (
    upload_image,
    generate_signed_url
)

from app.services.dicom_service import (
    dicom_to_png_bytes
)

from app.services.azure_health_insights_service import azure_health_insights_service
from app.services.audit_service import audit_service
from app.models.radiology import RadiologyReport

router = APIRouter()


@router.post("/analyze-xray")
async def analyze_xray_external(

    patient_id: UUID,

    file: UploadFile = File(...),

    api_key = Depends(validate_api_key)

):

    db: Session = SessionLocal()

    metadata = {}

    # Handle DICOM
    if file.filename.lower().endswith(".dcm"):

        dicom_data = await file.read()

        image_bytes, metadata = dicom_to_png_bytes(
            dicom_data
        )

        raw_storage_bytes = dicom_data

    else:

        image_bytes = await file.read()

        raw_storage_bytes = image_bytes

    # Upload image
    image_key = upload_image(
        raw_storage_bytes,
        file.filename
    )

    # Previous reports
    previous_reports = (
        db.query(RadiologyReport)
        .filter(
            RadiologyReport.patient_id == patient_id
        )
        .all()
    )

    history_text = ""

    for old_report in previous_reports:

        history_text += f"""

        Findings: {old_report.findings}

        Impression: {old_report.impression}

        Comparison: {old_report.comparison}

        """

    # AI Analysis
    report = await analyze_xray_image(
        image_bytes,
        history_text
    )

    # Embedding
    embedding = await generate_embedding(
        report["findings"]
    )

    # Phase 3: Layer 2 Azure Health Insights Extraction
    health_insights = await azure_health_insights_service.extract_clinical_insights(
        findings_text=report["findings"],
        impression_text=report["impression"]
    )

    # Save report
    db_report = RadiologyReport(

        patient_id=str(patient_id),

        image_url=image_key,

        modality=metadata.get(
            "modality",
            ""
        ),

        body_part=metadata.get(
            "body_part",
            ""
        ),

        study_date=metadata.get(
            "study_date",
            ""
        ),

        indication=report.get(
            "indication",
            ""
        ),

        technique=report.get(
            "technique",
            ""
        ),

        findings=report["findings"],

        impression=report["impression"],

        abnormalities=", ".join(
            report["abnormalities"]
        ),

        comparison=report.get(
            "comparison",
            ""
        ),
        
        clinical_codes=health_insights["clinical_codes"],
        
        critical_findings=health_insights["critical_findings"],
        
        follow_up_recommendation=health_insights["follow_up_recommendation"],

        status="DRAFT",

        embedding=str(embedding)
    )

    db.add(db_report)

    db.commit()

    db.refresh(db_report)

    signed_image_url = generate_signed_url(
        db_report.image_url
    )

    # Audit Logging for B2B Compliance
    audit_service.log_event(
        db=db,
        action="external_api.analyze_xray",
        user_id=None,
        organization_id=api_key.organization_id,
        resource_type="radiology_report",
        resource_id=str(db_report.id),
        details={"api_key_id": str(api_key.api_key_id), "patient_id": str(patient_id), "status": "DRAFT", "critical_findings": health_insights["critical_findings"]},
        status="success"
    )

    response_data = {
        "success": True,
        "patient_id": str(patient_id),
        "report_id": str(db_report.id),
        "previous_reports_count": len(previous_reports),
        "image_url": signed_image_url,
        "dicom_metadata": metadata,
        "report": {
            **report,
            "clinical_codes": health_insights["clinical_codes"],
            "critical_findings": health_insights["critical_findings"],
            "follow_up_recommendation": health_insights["follow_up_recommendation"],
            "status": "DRAFT"
        }
    }

    db.close()

    return response_data