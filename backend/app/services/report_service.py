from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.models.report import Report, ReportVersion
from app.schemas.report import SoapReportCreate, SoapReportUpdate
from app.services.rag_service import RagService

# Alias for clarity
SoapReport = Report

class ReportService:
    @staticmethod
    def create_report(db: Session, data: SoapReportCreate, user_id: str, organization_id: str):
        new_report = Report(
            **data.dict(),
            user_id=user_id,
            organization_id=organization_id,
            status="draft"
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report

    @staticmethod
    def get_report_by_consultation(db: Session, consultation_id: str, organization_id: str):
        return db.query(Report).filter(
            Report.consultation_id == consultation_id,
            Report.organization_id == organization_id
        ).first()

    @staticmethod
    def update_report(db: Session, report_id: str, data: SoapReportUpdate, organization_id: str):
        report = db.query(Report).filter(
            Report.report_id == report_id,
            Report.organization_id == organization_id
        ).first()

        if not report:
            return None

        # Create version history record
        version_record = ReportVersion(
            report_id=report.report_id,
            version_number=report.version,
            subjective=report.subjective,
            objective=report.objective,
            assessment=report.assessment,
            plan=report.plan,
            medications=report.medications,
            key_entities=report.key_entities,
            report_type=report.report_type,
            content=report.content,
        )
        db.add(version_record)

        for key, value in data.dict(exclude_unset=True).items():
            setattr(report, key, value)

        report.version += 1
        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def finalize_report(db: Session, report_id: str, user_id: str, organization_id: str):
        report = db.query(Report).filter(
            Report.report_id == report_id,
            Report.organization_id == organization_id
        ).first()

        if report:
            report.status = "finalized"
            report.approved_at = datetime.utcnow()
            report.approved_by = user_id
            db.commit()
            db.refresh(report)

            # --- RAG Integration: Index the finalized report ---
            if report.patient_id:
                if report.content:
                    content_str = "\n\n".join([f"{k.upper()}:\n{v}" for k, v in report.content.items()])
                else:
                    content_str = f"SUBJECTIVE:\n{report.subjective}\n\nOBJECTIVE:\n{report.objective}\n\nASSESSMENT:\n{report.assessment}\n\nPLAN:\n{report.plan}"
                
                try:
                    RagService.index_document(
                        db,
                        patient_id=report.patient_id,
                        source_id=report.report_id,
                        source_type="finalized_report",
                        content=content_str
                    )
                except Exception as index_err:
                    print(f"RAG Indexing Error (Finalize): {index_err}")
            # --------------------------------------------------

        return report
    @staticmethod
    def generate_report(db: Session, consultation_id: str, organization_id: str, template_type_key: str = "soap_note"):
        """
        Uses OpenAI GPT-4 to generate a structured SOAP report from transcription.
        """
        from app.models.consultation import Consultation
        from app.core.config import settings
        import openai

        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()

        if not consultation or not consultation.transcription_text:
            return None

        # Call OpenAI (Support both Standard and Azure OpenAI)
        is_azure = settings.ENDPOINT and ("azure.com" in settings.ENDPOINT or "cognitiveservices" in settings.ENDPOINT)
        if is_azure:
            client = openai.AzureOpenAI(
                api_key=settings.OPENAI_API_KEY,
                api_version="2025-01-01-preview",
                azure_endpoint=settings.ENDPOINT.split("/openai/")[0]
            )
        else:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Fetch template
        from app.models.report_template import ReportTemplate
        template = db.query(ReportTemplate).filter(
            ReportTemplate.type_key == template_type_key,
            (ReportTemplate.organization_id == None) | (ReportTemplate.organization_id == organization_id)
        ).first()

        import json
        if template and template.schema_json:
            expected_keys = [f["name"] for f in template.schema_json.get("fields", [])]
            template_desc = template.description or f"a {template.name} report"
            json_schema_instruction = f"Keys: {', '.join(expected_keys)}"
        else:
            template_desc = "a structured SOAP note"
            json_schema_instruction = 'Keys: "subjective", "objective", "assessment", "plan"'

        system_prompt = f"""
        You are a professional medical scribe. Convert the following clinical consultation transcription into {template_desc}.
        Return the result in JSON format with exactly the following {json_schema_instruction}.
        If information for a specific section is not present in the transcript, leave the value as an empty string. Do not hallucinate information.
        Maintain medical accuracy and professional terminology.
        """
        
        user_prompt = f"Transcription: {consultation_id}\n\nActual Transcript: {consultation.transcription_text}"
        
        # Determine model name from endpoint or default
        model_name = "gpt-5.4" if is_azure else "gpt-4o"
        if settings.ENDPOINT and "deployments/" in settings.ENDPOINT:
            model_name = settings.ENDPOINT.split("deployments/")[1].split("/")[0]

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        report_data = json.loads(response.choices[0].message.content)
        
        # Helper to convert dict to string if needed
        def stringify(val):
            if isinstance(val, (dict, list)):
                return json.dumps(val, indent=2)
            return str(val) if val is not None else ""

        # For backwards compatibility, populate SOAP fields if it's a soap_note
        is_soap = template_type_key == "soap_note"

        # Create the report record
        new_report = Report(
            consultation_id=consultation_id,
            patient_id=consultation.patient_id,
            user_id=consultation.user_id,
            organization_id=organization_id,
            report_type=template_type_key,
            content=report_data,
            subjective=stringify(report_data.get("subjective")) if is_soap else None,
            objective=stringify(report_data.get("objective")) if is_soap else None,
            assessment=stringify(report_data.get("assessment")) if is_soap else None,
            plan=stringify(report_data.get("plan")) if is_soap else None,
            status="draft"
        )
        
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report

