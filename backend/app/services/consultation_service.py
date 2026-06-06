from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
import os
from app.models.subscription import OrganizationSubscription
import json
from app.models.consultation import Consultation
from app.schemas.consultation import ConsultationCreate
from app.models.report import Report
import hashlib
from app.services.audit_service import audit_service
from app.services.report_service import ReportService
from app.db.session import SessionLocal

class ConsultationService:
    @staticmethod
    def _stringify_soap_value(value):
        if isinstance(value, (dict, list)):
            return json.dumps(value, indent=2)
        return str(value) if value is not None else ""

    @staticmethod
    def create_consultation(db: Session, data: ConsultationCreate, user_id: str, organization_id: str):
        try:
            new_consultation = Consultation(
                **data.model_dump(),
                user_id=user_id,
                organization_id=organization_id,
                status="scheduled"
            )
            db.add(new_consultation)
            db.commit()
            db.refresh(new_consultation)
            
            # Log audit event (failsafe)
            try:
                audit_service.log_event(
                    db, 
                    action="consultation_created", 
                    user_id=user_id, 
                    organization_id=organization_id,
                    resource_type="consultation",
                    resource_id=new_consultation.consultation_id
                )
            except Exception as audit_err:
                print(f"Audit logging failed: {str(audit_err)}")
                
            return new_consultation
        except Exception as e:
            import traceback
            print(f"CRITICAL: Consultation creation failed! Error type: {type(e).__name__}, Message: {str(e)}")
            print(traceback.format_exc())
            db.rollback()
            raise e


    @staticmethod
    def get_consultations(
        db: Session,
        current_user,
        patient_id: Optional[str] = None
    ):
        query = db.query(Consultation)

        # Doctor sees only their consultations
        if current_user.role == "practitioner":
            query = query.filter(
                Consultation.user_id ==
                current_user.user_id
            )

        # Organization Admin / Admin see organization consultations
        else:
            query = query.filter(
                Consultation.organization_id ==
                current_user.organization_id
            )

        # Optional patient filter
        if patient_id:
            query = query.filter(
                Consultation.patient_id == patient_id
            )

        return query.order_by(
            Consultation.created_at.desc()
        ).all()
        @staticmethod
        def get_consultation_by_id(db: Session, consultation_id: str, organization_id: str):
            return db.query(Consultation).filter(
                Consultation.consultation_id == consultation_id,
                Consultation.organization_id == organization_id
            ).first()

    @staticmethod
    def start_consultation(db: Session, consultation_id: str, organization_id: str):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if consultation:
            consultation.status = "in_progress"
            consultation.started_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(consultation)
            audit_service.log_event(db, action="consultation_started", user_id=consultation.user_id, organization_id=organization_id, resource_id=consultation_id)
        return consultation
    @staticmethod
    def end_consultation_init(
        db: Session,
        consultation_id: str,
        organization_id: str,
        audio_file_path: str
    ):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()

        if not consultation:
            return None

        consultation.status = "processing"
        consultation.ended_at = datetime.now(timezone.utc)
        if consultation.started_at:
            delta = consultation.ended_at - consultation.started_at
            consultation.duration_minutes = int(delta.total_seconds() / 60)

        consultation.audio_file_id = audio_file_path
        
        # Save checksum initially
        try:
            with open(audio_file_path, "rb") as f:
                checksum = hashlib.sha256(f.read()).hexdigest()
            consultation.audio_checksum = checksum
        except Exception:
            pass

        db.commit()
        db.refresh(consultation)
        return consultation

    @staticmethod
    def process_consultation_background(
        consultation_id: str,
        organization_id: str,
        audio_file_path: str
    ):
        db = SessionLocal()
        try:
            consultation = db.query(Consultation).filter(
                Consultation.consultation_id == consultation_id,
                Consultation.organization_id == organization_id
            ).first()

            if not consultation:
                return None


            # Save audio path (will be updated to B2 key after upload)
            consultation.audio_file_id = audio_file_path

            # Generate checksum
            with open(audio_file_path, "rb") as f:

                raw_audio = f.read()

            checksum = hashlib.sha256(
                raw_audio
            ).hexdigest()

            consultation.audio_checksum = checksum


            # =========================
            # ASSEMBLYAI TRANSCRIPTION
            # (direct file upload — no B2 URL needed)
            # =========================

            from app.core.speech import transcribe_audio, upload_to_b2

            # Transcribe directly from local file FIRST
            result = transcribe_audio(audio_file_path)
            subscription = db.query(
                OrganizationSubscription
            ).filter(
                OrganizationSubscription.organization_id == organization_id
            ).first()

            if subscription:
                if (
                    subscription.transcriptions_used
                    >=
                    subscription.transcription_limit
                ):
                    consultation.status = "limit_reached"
                    db.commit()
                    return consultation

            print("TRANSCRIPTION RESULT:", result)

            consultation.transcription_text = (
                result["text"]
            )

            consultation.transcription_status = (
                result["status"]
            )

            consultation.transcription_confidence = (
                result["confidence"]
            )

            # Upload to B2 for permanent storage AFTER transcription succeeds
            if result["status"] == "completed":
                if subscription:
                    subscription.transcriptions_used += 1
                try:
                    b2_key = upload_to_b2(audio_file_path)
                    consultation.audio_file_id = b2_key
                    print(f"[B2] Successfully uploaded audio to B2: {b2_key}")
                except Exception as b2_err:
                    print(f"[B2] Upload failed, keeping local path: {b2_err}")
                    # Keep the local path if B2 upload fails
            else:
                # If transcription failed, still try to upload to B2 for debugging
                try:
                    b2_key = upload_to_b2(audio_file_path)
                    consultation.audio_file_id = b2_key
                except Exception as b2_err:
                    print(f"[B2] Upload failed: {b2_err}")


            # =========================
            # SOAP GENERATION
            # =========================

            if result["status"] == "completed":

                from app.core.ai import (
                    generate_soap,
                    check_drug_interactions
                )

                from app.models.report import Report

                print("GENERATING SOAP...")

                ai_output = generate_soap(
                    consultation.transcription_text or ""
                )

                print("AI OUTPUT:", ai_output)

                try:

                    soap = json.loads(ai_output)

                    if soap.get("_error"):
                        raise ValueError(soap["_error"])

                    print("SOAP PARSED SUCCESSFULLY")

                except Exception as e:

                    print("JSON ERROR:", str(e))

                    print("RAW AI OUTPUT:")
                    print(ai_output)

                    consultation.status = "failed_soap"

                    db.commit()

                    return consultation
                meds = soap.get(
                    "medications",
                    []
                )

                interactions = (
                    check_drug_interactions(meds)
                    if meds else []
                )


                # =========================
                # CREATE REPORT
                # =========================

                existing_report = db.query(Report).filter(
                    Report.consultation_id == consultation.consultation_id,
                    Report.organization_id == organization_id
                ).first()

                report = existing_report or Report(
                    consultation_id=consultation.consultation_id,
                    patient_id=consultation.patient_id,
                    user_id=consultation.user_id,
                    organization_id=organization_id,
                    status="draft"
                )

                report.subjective = ConsultationService._stringify_soap_value(
                    soap.get("subjective")
                )
                report.objective = ConsultationService._stringify_soap_value(
                    soap.get("objective")
                )
                report.assessment = ConsultationService._stringify_soap_value(
                    soap.get("assessment")
                )
                report.plan = ConsultationService._stringify_soap_value(
                    soap.get("plan")
                )
                report.medications = meds
                report.key_entities = {"interactions": interactions}
                report.follow_up_needed = soap.get("follow_up_needed", False)
                report.follow_up_days = soap.get("follow_up_days")

                if not existing_report:
                    db.add(report)
                print("REPORT ADDED")

                consultation.status = "completed"

                print("SOAP REPORT SAVED")

            else:

                consultation.status = (
                    "failed_transcription"
                )

        except Exception as e:
            print(f"END CONSULTATION ERROR: {str(e)}")
            if consultation:
                consultation.status = "failed"
                db.commit()

        if consultation:
            db.commit()
            print("REPORT SAVED")
            db.refresh(consultation)

        # Clean up local temp audio file after B2 upload
        try:
            if os.path.exists(audio_file_path):
                os.remove(audio_file_path)
                print(f"[Cleanup] Removed local file: {audio_file_path}")
        except Exception as cleanup_err:
            print(f"[Cleanup] Could not remove local file: {cleanup_err}")

        db.close()
        return consultation
    
    @staticmethod
    def update_consultation(db: Session, consultation_id: str, organization_id: str, data: dict):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if not consultation:
            return None
            
        for key, value in data.items():
            if hasattr(consultation, key):
                setattr(consultation, key, value)
        
        db.commit()
        db.refresh(consultation)
        return consultation

    
    @staticmethod
    def delete_consultation(
        db: Session,
        consultation_id: str,
        organization_id: str
    ):
        try:

            consultation = db.query(Consultation).filter(
                Consultation.consultation_id == consultation_id
            ).first()

            if not consultation:
                print("CONSULTATION NOT FOUND")
                return False

            reports = db.query(Report).filter(
                Report.consultation_id == consultation_id
            ).all()

            for report in reports:
                db.delete(report)

            # Flush the report deletions so they are removed from DB before deleting the parent consultation
            db.flush()

            db.delete(consultation)

            db.commit()

            print("DELETE SUCCESS")

            return True

        except Exception as e:

            db.rollback()

            print("DELETE ERROR:", str(e))

            return False
        

    @staticmethod
    def get_consultation_by_id(
        db: Session,
        consultation_id: str,
        current_user
    ):
        query = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id
        )

        if current_user.role == "practitioner":
            query = query.filter(
                Consultation.user_id ==
                current_user.user_id
            )
        else:
            query = query.filter(
                Consultation.organization_id ==
                current_user.organization_id
            )

        return query.first()