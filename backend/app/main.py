import sys
try:
    sys.stdout.reconfigure(write_through=True, line_buffering=True)
    sys.stderr.reconfigure(write_through=True, line_buffering=True)
except Exception:
    pass

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.db.base import Base
from app.db.session import engine
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("arogyascribe")
print("ACTIVE DATABASE:", settings.DATABASE_URL)
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade healthcare documentation platform",
    version=settings.VERSION
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
        "https://localhost:5173",
        "https://127.0.0.1:5173",
        "https://[::1]:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://[::1]:5174",
        "https://localhost:5174",
        "https://127.0.0.1:5174",
        "https://[::1]:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://[::1]:3000",
        "https://localhost:3000",
        "https://127.0.0.1:3000",
        "https://[::1]:3000",
        "https://arogyascribe-kohl.vercel.app",
        "https://mediscribe-kohl.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
import traceback

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"--> [REQUEST] {request.method} {request.url}")
    logger.info(f"--> [HEADERS] {dict(request.headers)}")
    try:
        response = await call_next(request)
        logger.info(f"<-- [RESPONSE] {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"[ERROR] Request failed: {e}")
        logger.error(traceback.format_exc())
        raise e

# models
from app.models.user import User
from app.models.organization import Organization
from app.models.patient import Patient
from app.models.subscription import OrganizationSubscription
from app.models.consultation import Consultation
from app.models.report import Report
from app.models.report_template import ReportTemplate
from app.models.analysis import Analysis
from app.models.audit import AuditLog
from app.models.subscription import OrganizationSubscription
from app.models.radiology import RadiologyReport
from app.models.document_embedding import DocumentEmbedding  # RAG embeddings table
from app.models.upgrade_request import UpgradeRequest
from app.models.patient_chat import PatientChatHistory

# routers
from app.api.auth import router as auth_router

from app.api.patient import router as patient_router
from app.api.consultation import router as consultation_router
from app.api.report import router as report_router
from app.api.analysis import router as analysis_router
from app.api.analytics import router as analytics_router
from app.api.audit import router as audit_router
from app.api.speech import router as speech_router
from app.api.radiology import router as radiology_router
from app.api.dictation import router as dictation_router
from app.api.api_keys import router as api_keys
from app.api.admin import router as admin_router
from app.api.external_radiology import router as external_radiology_router
from app.api.report_template import router as report_template_router
from app.api import patient_portal


# Create all database tables (Note: In production with migrations, this might be handled by Alembic)
@app.on_event("startup")
def on_startup():
    logger.info("Starting ArogyaScribe API...")
    
    # Enable pgvector extension for non-sqlite databases before table creation
    if not settings.DATABASE_URL.startswith("sqlite"):
        from sqlalchemy import text
        try:
            logger.info("Enabling pgvector extension if not exists...")
            with engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            logger.info("pgvector extension check/enable completed.")
        except Exception as ext_err:
            logger.warning(f"Could not check/enable pgvector extension dynamically: {ext_err}. Proceeding...")

    Base.metadata.create_all(bind=engine)

    # --- Schema migrations for columns added after initial deployment ---
    from sqlalchemy import text, inspect
    with engine.begin() as conn:
        inspector = inspect(engine)

        # Add patient_id to analysis_records if missing
        analysis_cols = [c["name"] for c in inspector.get_columns("analysis_records")]
        if "patient_id" not in analysis_cols:
            logger.info("Migrating: adding patient_id column to analysis_records...")
            conn.execute(text("ALTER TABLE analysis_records ADD COLUMN patient_id VARCHAR REFERENCES patients(patient_id)"))
            logger.info("Migration complete: patient_id added to analysis_records.")
            
        # Add version to reports if missing
        report_cols = [c["name"] for c in inspector.get_columns("reports")]
        if "version" not in report_cols:
            logger.info("Migrating: adding version column to reports...")
            conn.execute(text("ALTER TABLE reports ADD COLUMN version INTEGER DEFAULT 1 NOT NULL"))
            logger.info("Migration complete: version added to reports.")

        # Add dynamic report fields to reports
        if "report_type" not in report_cols:
            logger.info("Migrating: adding report_type and content to reports...")
            conn.execute(text("ALTER TABLE reports ADD COLUMN report_type VARCHAR DEFAULT 'soap_note'"))
            # For JSON column, fallback to VARCHAR if sqlite has issues, but JSON usually works in recent sqlite
            try:
                conn.execute(text("ALTER TABLE reports ADD COLUMN content JSON"))
            except Exception:
                conn.execute(text("ALTER TABLE reports ADD COLUMN content VARCHAR"))
            logger.info("Migration complete: dynamic fields added to reports.")
            
        # Add dynamic report fields to report_versions
        version_cols = [c["name"] for c in inspector.get_columns("report_versions")]
        if "report_type" not in version_cols:
            logger.info("Migrating: adding report_type and content to report_versions...")
            conn.execute(text("ALTER TABLE report_versions ADD COLUMN report_type VARCHAR DEFAULT 'soap_note'"))
            try:
                conn.execute(text("ALTER TABLE report_versions ADD COLUMN content JSON"))
            except Exception:
                conn.execute(text("ALTER TABLE report_versions ADD COLUMN content VARCHAR"))

        # Add branding columns to organizations
        org_cols = [c["name"] for c in inspector.get_columns("organizations")]
        if "logo_url" not in org_cols:
            logger.info("Migrating: adding branding fields to organizations...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN logo_url VARCHAR"))
            conn.execute(text("ALTER TABLE organizations ADD COLUMN letterhead_url VARCHAR"))
            conn.execute(text("ALTER TABLE organizations ADD COLUMN address VARCHAR"))
            conn.execute(text("ALTER TABLE organizations ADD COLUMN contact_info VARCHAR"))
            conn.execute(text("ALTER TABLE organizations ADD COLUMN hospital_name_override VARCHAR"))

        # Add signature to users
        user_cols = [c["name"] for c in inspector.get_columns("users")]
        if "signature_url" not in user_cols:
            logger.info("Migrating: adding signature_url to users...")
            conn.execute(text("ALTER TABLE users ADD COLUMN signature_url VARCHAR"))
            
        # Add new radiology Phase 3 columns if missing
        if "radiology_reports" in inspector.get_table_names():
            rad_cols = [c["name"] for c in inspector.get_columns("radiology_reports")]
            if "clinical_codes" not in rad_cols:
                logger.info("Migrating: adding Phase 3 columns to radiology_reports...")
                conn.execute(text("ALTER TABLE radiology_reports ADD COLUMN clinical_codes TEXT"))
                conn.execute(text("ALTER TABLE radiology_reports ADD COLUMN critical_findings VARCHAR DEFAULT 'false'"))
                conn.execute(text("ALTER TABLE radiology_reports ADD COLUMN follow_up_recommendation TEXT"))
                logger.info("Migration complete: Phase 3 columns added.")
                
    # Seed default templates
    try:
        from app.db.seed import seed_default_templates
        from app.db.session import SessionLocal
        with SessionLocal() as session:
            seed_default_templates(session)
    except Exception as e:
        logger.warning(f"Template seeding skipped or failed: {e}")
    # -------------------------------------------------------------------

api_v1 = APIRouter(prefix="/api/v1")

api_v1.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_v1.include_router(patient_router, prefix="/patients", tags=["Patients"])
api_v1.include_router(consultation_router, prefix="/consultations", tags=["Consultations"])
api_v1.include_router(speech_router, prefix="/speech", tags=["Speech"])
api_v1.include_router(dictation_router, prefix="/dictation", tags=["Dictation"])
api_v1.include_router(report_router, prefix="/reports", tags=["Reports"])
api_v1.include_router(analysis_router, prefix="/ai-analysis", tags=["AI Analysis"])
api_v1.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_v1.include_router(audit_router, prefix="/audit", tags=["Audit Logs"])
api_v1.include_router(radiology_router,prefix="/radiology",tags=["Radiology"])
api_v1.include_router(api_keys,prefix="/api-keys",tags=["API Keys"])
api_v1.include_router(admin_router,prefix="/admin",  tags=["Admin"])
api_v1.include_router(external_radiology_router,prefix="/external/radiology",tags=["External Radiology"])
api_v1.include_router(report_template_router, prefix="/report-templates", tags=["Report Templates"])
api_v1.include_router(
    patient_portal.router,
    prefix="/patient",
    tags=["Patient Portal"]
)
app.include_router(api_v1)

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {
        "message": "ArogyaScribe Backend API is running.",
        "docs": "/docs"
    }