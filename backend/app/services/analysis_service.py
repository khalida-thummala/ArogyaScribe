from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import List, Optional
import uuid
from app.models.report import Report
from app.services.audit_service import audit_service
import os
from app.services.notification_service import NotificationService
from app.models.analysis import Analysis
from app.schemas.analysis import AIAnalysisCreate
from app.core.ai import generate_soap_from_image
from app.services.rag_service import RagService

# Use the correct ORM model class name
AIAnalysisRecord = Analysis

class AnalysisService:
    @staticmethod
    def _extract_text(file_path: str, file_type: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()

        if file_type == "pdf" or ext == ".pdf":
            try:
                try:
                    from pypdf import PdfReader
                except ImportError:
                    from PyPDF2 import PdfReader  # type: ignore

                reader = PdfReader(file_path)
                return "\n\n".join((page.extract_text() or "") for page in reader.pages).strip()
            except Exception as e:
                print(f"PDF extraction failed: {e}")

        if file_type == "docx" or ext in (".docx", ".doc"):
            try:
                from docx import Document

                doc = Document(file_path)
                return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
            except Exception as e:
                print(f"DOCX extraction failed: {e}")

        if ext in (".txt", ".md", ".csv"):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read().strip()
            except Exception as e:
                print(f"Text extraction failed: {e}")

        return ""

    @staticmethod
    def _stringify_soap_value(value):
        if isinstance(value, (dict, list)):
            import json
            return json.dumps(value, indent=2)
        return str(value) if value is not None else ""

    @staticmethod
    def _find_analysis_report(db: Session, analysis_id: str, organization_id: str):
        from app.models.report import Report

        reports = db.query(Report).filter(Report.organization_id == organization_id).all()
        for report in reports:
            if isinstance(report.key_entities, dict) and report.key_entities.get("analysis_id") == analysis_id:
                return report
        return None

    @staticmethod
    def _upsert_report_from_analysis(db: Session, record: Analysis, status: str = "draft"):
        

        report = AnalysisService._find_analysis_report(
            db, record.analysis_id, record.organization_id
        ) or Report(
            user_id=record.user_id,
            organization_id=record.organization_id,
            patient_id=record.patient_id,
            status=status,
        )

        report.patient_id = record.patient_id
        report.subjective = AnalysisService._stringify_soap_value(record.generated_subjective)
        report.objective = AnalysisService._stringify_soap_value(record.generated_objective)
        report.assessment = AnalysisService._stringify_soap_value(record.generated_assessment)
        report.plan = AnalysisService._stringify_soap_value(record.generated_plan)
        report.structured_findings = (record.structured_findings)
        report.medications = record.generated_medications or []
        report.key_entities = {
            **(record.key_entities if isinstance(record.key_entities, dict) else {}),
            "analysis_id": record.analysis_id,
            "source_file_name": record.source_file_name,
            "source_file_type": record.source_file_type,
        }
        report.status = status

        if status == "approved":
            report.approved_by = record.user_id
            report.approved_at = datetime.utcnow()

        if not report.report_id:
            db.add(report)
        elif report not in db:
            db.add(report)

        return report

    @staticmethod
    def create_analysis_record(db: Session, data: AIAnalysisCreate, user_id: str, organization_id: str):
        new_record = Analysis(
            **data.dict(),
            user_id=user_id,
            organization_id=organization_id,
            analysis_status="pending"
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record

    @staticmethod
    def get_analysis_records(db: Session, organization_id: str) -> List[Analysis]:
        return db.query(Analysis).filter(
            Analysis.organization_id == organization_id
        ).order_by(Analysis.created_at.desc()).all()

    @staticmethod
    def get_analysis_by_id(db: Session, analysis_id: str, organization_id: str):
        return db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()

    @staticmethod
    def update_analysis_status(db: Session, analysis_id: str, status: str, results: Optional[dict] = None):
        record = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
        if record:
            record.analysis_status = status
            if results:
                for key, value in results.items():
                    if hasattr(record, key):
                        setattr(record, key, value)
            db.commit()
            db.refresh(record)
        return record

    @staticmethod
    async def process_upload(db: Session, file, file_type: str, user_id: str, organization_id: str, patient_id: Optional[str] = None):
        if patient_id:
            patient_id = patient_id.strip()
            if not patient_id:
                patient_id = None
        else:
            patient_id = None
        try:
            upload_id = str(uuid.uuid4())
            
            # Ensure uploads directory exists
            upload_dir = "uploads"
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
                
            file_path = os.path.join(upload_dir, f"{upload_id}_{file.filename}")
            
            # Save file
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            extracted_text = AnalysisService._extract_text(file_path, file_type)
            if not extracted_text and file_type != "image":
                extracted_text = (
                    f"Medical document uploaded: {file.filename}. "
                    "No readable text could be extracted automatically."
                )
            
            new_record = Analysis(
                analysis_id=str(uuid.uuid4()),
                upload_id=upload_id,
                user_id=user_id,
                organization_id=organization_id,
                patient_id=patient_id,
                source_file_name=file.filename,
                source_file_type=file_type,
                extracted_text=extracted_text,
                key_entities={"file_path": file_path},
                analysis_status="pending"
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            audit_service.log_event(

                db=db,

                action="UPLOAD_ANALYSIS",

                user_id=user_id,

                organization_id=organization_id,

                resource_type="Analysis",

                resource_id=new_record.analysis_id,

                details={

                    "file_name": file.filename,

                    "file_type": file_type,

                    "patient_id": patient_id
                },

                status="success"
            )
                        # --- RAG Integration: Index the extracted text ---
            if extracted_text and new_record.patient_id:
                try:
                    RagService.index_document(
                        db, 
                        patient_id=new_record.patient_id,
                        source_id=new_record.analysis_id,
                        source_type="document",
                        content=extracted_text
                    )
                except Exception as index_err:
                    print(f"RAG Indexing Error: {index_err}")
                    db.rollback()

            # --- RAG Integration: Index patient profile data if not yet indexed ---
            if new_record.patient_id:
                try:
                    from app.models.document_embedding import DocumentEmbedding
                    existing_profile = db.query(DocumentEmbedding).filter(
                        DocumentEmbedding.patient_id == new_record.patient_id,
                        DocumentEmbedding.source_type == "patient_profile"
                    ).first()
                    if not existing_profile:
                        profile_text = AnalysisService._get_patient_profile_context(db, new_record.patient_id)
                        if profile_text and profile_text.strip():
                            RagService.index_document(
                                db,
                                patient_id=new_record.patient_id,
                                source_id=new_record.patient_id,
                                source_type="patient_profile",
                                content=profile_text,
                            )
                            print("Patient profile indexed into RAG.")
                except Exception as profile_index_err:
                    print(f"Patient Profile RAG Indexing Error: {profile_index_err}")
            # ------------------------------------------------

            return new_record
        except Exception as e:
            print(f"UPLOAD ERROR: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    @staticmethod
    def _get_patient_profile_context(db: Session, patient_id: str) -> str:
        """
        Fetch the patient's profile data (allergies, medical history, medications)
        directly from the patients table and format it as context for the AI prompt.
        This is the primary source of patient history — independent of RAG embeddings.
        """
        from app.models.patient import Patient
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not patient:
            return ""

        parts = []
        name = f"{patient.first_name} {patient.last_name}".strip()
        if name:
            parts.append(f"Patient Name: {name}")
        if patient.date_of_birth:
            parts.append(f"Date of Birth: {patient.date_of_birth}")
        if patient.gender:
            parts.append(f"Gender: {patient.gender}")
        if patient.blood_type:
            parts.append(f"Blood Type: {patient.blood_type}")
        if patient.allergies and patient.allergies.strip():
            parts.append(f"Allergies: {patient.allergies.strip()}")
        else:
            parts.append("Allergies: None on record")
        if patient.medical_history and patient.medical_history.strip():
            parts.append(f"Past Medical History: {patient.medical_history.strip()}")
        else:
            parts.append("Past Medical History: None on record")
        if patient.current_medications and patient.current_medications.strip():
            parts.append(f"Current Medications: {patient.current_medications.strip()}")

        if not parts:
            return ""

        return "PATIENT PROFILE:\n" + "\n".join(parts)

    @staticmethod
    def analyze_document(db: Session, analysis_id: str, organization_id: str):
        record = db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()
        
        if not record:
            return None
        
        record.analysis_status = "analyzing"
        db.commit()
        
        # 0a. Always inject patient profile data (allergies, medical history) directly
        patient_profile_context = ""
        if record.patient_id:
            try:
                patient_profile_context = AnalysisService._get_patient_profile_context(
                    db, record.patient_id
                )
                print("PATIENT PROFILE CONTEXT:", patient_profile_context[:200] if patient_profile_context else "None")
            except Exception as profile_err:
                print(f"Patient Profile Fetch Error: {profile_err}")

        # 0b. RAG: Retrieve historical context from previous analyses/documents
        rag_context = ""
        if record.patient_id:
            try:
                # For images: use a meaningful medical query instead of empty fields
                if record.source_file_type == "image":
                    query_for_rag = (
                        f"medical imaging radiology chest x-ray findings history {record.source_file_name}"
                    )
                else:
                    query_for_rag = (
                        record.extracted_text
                        or record.source_file_name
                        or "medical document"
                    )

                rag_context = RagService.get_augmented_context(
                    db,
                    patient_id=record.patient_id,
                    query_text=query_for_rag,
                )

                print("RAG QUERY:", query_for_rag[:100])
                print("RAG CONTEXT:", rag_context[:200] if rag_context else "None")

            except Exception as rag_err:
                print(f"RAG Retrieval Error: {rag_err}")

        # Combine patient profile + RAG history into one historical_context block
        historical_context_parts = []
        if patient_profile_context:
            historical_context_parts.append(patient_profile_context)
        if rag_context:
            historical_context_parts.append("PREVIOUS CLINICAL RECORDS (from RAG):\n" + rag_context)

        historical_context = "\n\n".join(historical_context_parts)

        # 1. Generate SOAP from document
        import json
        from app.core.ai import generate_soap, compare_medical_reports, generate_population_report
        from app.models.report import Report

        file_path = record.key_entities.get("file_path") if isinstance(record.key_entities, dict) else None
        
        if not record.patient_id:
            # Population Research Mode
            try:
                population_context = RagService.get_population_context(db, record.extracted_text or "")
                
                if record.source_file_type == "image" and file_path and os.path.exists(file_path):
                    from app.core.ai import generate_soap_from_image
                    soap_json = generate_soap_from_image(file_path, context=record.extracted_text or "", population_context=population_context)
                else:
                    soap_json = generate_population_report(record.extracted_text or "", population_context)
            except Exception as pop_err:
                print(f"Population RAG Error: {pop_err}")
                soap_json = generate_soap(record.extracted_text or "")
        elif record.source_file_type == "image" and file_path and os.path.exists(file_path):
            from app.core.ai import generate_soap_from_image
            soap_json = generate_soap_from_image(file_path,context=f"""
                                    Historical Context:
                                    {historical_context} Current Study: {record.source_file_name}    """,historical_context=historical_context)
        else:
            # Standard Patient RAG Mode
            soap_json = generate_soap(
                record.extracted_text or "", 
                historical_context=historical_context
            )

        try:
            print(f"DEBUG: Starting AI analysis for {analysis_id}...")
            soap_data = json.loads(soap_json)
            if soap_data.get("_error"):
                print(f"DEBUG: AI returned error: {soap_data['_error']}")
                raise ValueError(soap_data["_error"])

            print("DEBUG: AI generated SOAP successfully. Updating record...")
            record.generated_subjective = soap_data.get("subjective")
            record.generated_objective = soap_data.get("objective")
            record.generated_assessment = soap_data.get("assessment")
            record.generated_plan = soap_data.get("plan")
            record.structured_findings = (
                    soap_data.get(
                        "structured_findings",
                        []
                    )
                )
            # Ensure medications is a list of dicts
            raw_meds = soap_data.get("medications", [])
            sanitized_meds = []
            if isinstance(raw_meds, list):
                for m in raw_meds:
                    if isinstance(m, dict):
                        sanitized_meds.append(m)
                    elif isinstance(m, str):
                        sanitized_meds.append({"name": m})
            record.generated_medications = sanitized_meds

            # ==========================================
            # SAVE FINAL SOAP INTO RAG
            # ==========================================

            try:

                clean_subjective = (
                    record.generated_subjective or ""
                ).replace(
                    "No historical medical records found for this patient.",
                    ""
                ).replace(
                    "No historical medical records found.",
                    ""
                ).replace(
                    "No historical medical records, past medical history, or allergies available in the provided context.",
                    ""
                )

                rag_content = f"""

                SUBJECTIVE:
                {clean_subjective}

                OBJECTIVE:
                {record.generated_objective}

                ASSESSMENT:
                {record.generated_assessment}

                PLAN:
                {record.generated_plan}

                """

                RagService.index_document(

                    db,

                    patient_id=record.patient_id,

                    source_id=record.analysis_id,

                    source_type="soap_note",

                    content=rag_content
                )

                print(
                    "SOAP indexed into RAG"
                )

            except Exception as rag_index_err:
                print("SOAP RAG INDEX ERROR:", str(rag_index_err))
                # Roll back the failed RAG insert so the session is usable again
                try:
                    db.rollback()
                except Exception:
                    pass

            record.confidence_score = 94.2
            
            # 2. Intelligent Comparison (Phase 5
            if record.patient_id:
                print(f"DEBUG: Checking for previous reports for patient {record.patient_id}...")
                latest_report = db.query(Report).filter(
                    Report.patient_id == record.patient_id,
                    Report.status.in_(["draft", "approved"])
                ).order_by(Report.created_at.desc()).first()

                if latest_report:
                    print(f"DEBUG: Found latest report {latest_report.report_id}. Comparing...")
                    existing_data = {
                        "subjective": latest_report.subjective,
                        "objective": latest_report.objective,
                        "assessment": latest_report.assessment,
                        "plan": latest_report.plan
                    }
                    record.comparison_data = compare_medical_reports(existing_data, soap_data)
            
            record.analysis_status = "review_pending"
            NotificationService.create_notification(

            db=db,

            user_id=record.user_id,

            title="AI Report Ready",

            message=(
                f"Analysis {record.analysis_id} "
                "is ready for review."
            ),

            type="review_pending"
        )
            
            print("DEBUG: Saving report draft...")
            AnalysisService._upsert_report_from_analysis(db, record, status="draft")
        except Exception as e:
            print(f"CRITICAL ANALYSIS ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            record.analysis_status = "failed"
            
            try:
                db.rollback()
            except Exception:
                pass
            
        try:
            db.commit()
            db.refresh(record)
            if record.analysis_status == "review_pending":

                audit_service.log_event(

                    db=db,

                    action="AI_ANALYSIS_COMPLETED",

                    user_id=record.user_id,

                    organization_id=record.organization_id,

                    resource_type="Analysis",

                    resource_id=record.analysis_id,

                    details={

                        "patient_id": record.patient_id,

                        "confidence_score": str(
                            record.confidence_score
                        )
                    },

                    status="success"
                )

            elif record.analysis_status == "failed":

                audit_service.log_event(

                    db=db,

                    action="AI_ANALYSIS_FAILED",

                    user_id=record.user_id,

                    organization_id=record.organization_id,

                    resource_type="Analysis",

                    resource_id=record.analysis_id,

                    details={
                        "error": "AI processing failed"
                    },

                    status="failure"
                )
        except Exception as commit_err:
            print(f"FINAL COMMIT ERROR: {commit_err}")
            db.rollback()
        print(f"DEBUG: Analysis for {analysis_id} finished with status {record.analysis_status}")
        return record

    @staticmethod
    def approve_analysis(db: Session, analysis_id: str, organization_id: str, notes: str):
        record = db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()
        
        if not record:
            return None
            
        # 1. Update analysis record
        record.approved_at = datetime.utcnow()
        record.notes = notes
        record.analysis_status = "approved"
        
        AnalysisService._upsert_report_from_analysis(db, record, status="approved")
        db.commit()
        db.refresh(record)
        return record
    
@staticmethod
def reject_analysis(

    db: Session,

    analysis_id: str,

    organization_id: str,

    notes: str
):

    record = db.query(Analysis).filter(

        Analysis.analysis_id == analysis_id,

        Analysis.organization_id == organization_id

    ).first()

    if not record:

        return None

    record.analysis_status = "rejected"

    record.review_notes = notes

    db.commit()

    db.refresh(record)
    NotificationService.create_notification(

    db=db,

    user_id=record.user_id,

    title="Report Rejected",

    message=(
        f"Analysis {record.analysis_id} "
        "requires corrections."
    ),

    type="rejected"
)

    return record

