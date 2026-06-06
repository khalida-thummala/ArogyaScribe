from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    BackgroundTasks
)

from sqlalchemy.orm import Session

from typing import List, Optional

from app.db.deps import get_db

from app.schemas.analysis import (
    AIAnalysisRecord,
    AIAnalysisCreate
)

from app.core.deps import get_current_user

from app.core.roles import require_role

from app.services.analysis_service import AnalysisService


router = APIRouter()


# ==========================================
# CREATE ANALYSIS
# ==========================================

@router.post(
    "",
    response_model=AIAnalysisRecord
)
def create_analysis(

    data: AIAnalysisCreate,

    db: Session = Depends(get_db),

    current_user = Depends(
        require_role(
            ["admin", "practitioner", "supervisor"]
        )
    )
):

    return AnalysisService.create_analysis_record(

        db,

        data,

        current_user.user_id,

        current_user.organization_id
    )


# ==========================================
# GET ANALYSES
# ==========================================

@router.get(
    "",
    response_model=List[AIAnalysisRecord]
)
def get_analyses(

    db: Session = Depends(get_db),

    current_user = Depends(get_current_user)
):

    return AnalysisService.get_analysis_records(

        db,

        current_user.organization_id
    )


# ==========================================
# UPLOAD + BACKGROUND AI
# ==========================================

@router.post("/upload")
async def upload_document(

    background_tasks: BackgroundTasks,

    file: UploadFile = File(...),

    file_type: str = Form(...),

    patient_id: Optional[str] = Form(None),

    db: Session = Depends(get_db),

    current_user = Depends(
        require_role(
            ["admin", "practitioner", "supervisor"]
        )
    )
):

    # STEP 1 — SAVE UPLOAD
    record = await AnalysisService.process_upload(

        db,

        file,

        file_type,

        current_user.user_id,

        current_user.organization_id,

        patient_id=patient_id
    )

    # STEP 2 — QUEUE STATUS
    record.analysis_status = "queued"

    db.commit()

    # STEP 3 — BACKGROUND AI
    background_tasks.add_task(

        AnalysisService.analyze_document,

        db,

        record.analysis_id,

        current_user.organization_id
    )

    # STEP 4 — IMMEDIATE RESPONSE
    return {

        "success": True,

        "analysis_id": record.analysis_id,

        "status": "queued",

        "message": "AI processing started in background"
    }


# ==========================================
# MANUAL ANALYZE
# ==========================================

@router.post(
    "/{analysis_id}/analyze",
    response_model=AIAnalysisRecord
)
def analyze_document(

    analysis_id: str,

    db: Session = Depends(get_db),

    current_user = Depends(
        require_role(
            ["admin", "practitioner", "supervisor"]
        )
    )
):

    analysis = AnalysisService.analyze_document(

        db,

        analysis_id,

        current_user.organization_id
    )

    if not analysis:

        raise HTTPException(

            status_code=404,

            detail="Analysis record not found"
        )

    return analysis


# ==========================================
# APPROVE REPORT
# ==========================================

@router.post("/{analysis_id}/approve")
def approve_analysis(

    analysis_id: str,

    data: dict,

    db: Session = Depends(get_db),

    current_user = Depends(
        require_role(
            ["admin", "supervisor"]
        )
    )
):

    notes = data.get("notes", "")

    analysis = AnalysisService.approve_analysis(

        db,

        analysis_id,

        current_user.organization_id,

        notes
    )

    if not analysis:

        raise HTTPException(

            status_code=404,

            detail="Analysis record not found"
        )

    return analysis


# ==========================================
# GET SINGLE ANALYSIS
# ==========================================

@router.get(
    "/{analysis_id}",
    response_model=AIAnalysisRecord
)
def get_analysis(

    analysis_id: str,

    db: Session = Depends(get_db),

    current_user = Depends(get_current_user)
):

    analysis = AnalysisService.get_analysis_by_id(

        db,

        analysis_id,

        current_user.organization_id
    )

    if not analysis:

        raise HTTPException(

            status_code=404,

            detail="Analysis not found"
        )

    return analysis
@router.post("/{analysis_id}/reject")
def reject_analysis(

    analysis_id: str,

    data: dict,

    db: Session = Depends(get_db),

    current_user = Depends(
        require_role(
            ["admin", "supervisor"]
        )
    )
):

    notes = data.get("notes", "")

    analysis = AnalysisService.reject_analysis(

        db,

        analysis_id,

        current_user.organization_id,

        notes
    )

    if not analysis:

        raise HTTPException(

            status_code=404,

            detail="Analysis not found"
        )

    return analysis