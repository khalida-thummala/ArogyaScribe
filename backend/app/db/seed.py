from sqlalchemy.orm import Session
from app.models.report_template import ReportTemplate
import logging

logger = logging.getLogger(__name__)

STANDARD_TEMPLATES = [
    {
        "type_key": "soap_note",
        "name": "SOAP Note",
        "description": "Standard Subjective, Objective, Assessment, Plan format.",
        "schema_json": {
            "fields": [
                {"name": "subjective", "label": "Subjective", "type": "textarea"},
                {"name": "objective", "label": "Objective", "type": "textarea"},
                {"name": "assessment", "label": "Assessment", "type": "textarea"},
                {"name": "plan", "label": "Plan", "type": "textarea"}
            ]
        }
    },
    {
        "type_key": "general_opd",
        "name": "General OPD Consultation",
        "description": "Standard OPD Consultation format.",
        "schema_json": {
            "fields": [
                {"name": "patient_details", "label": "Patient Details", "type": "textarea"},
                {"name": "chief_complaint", "label": "Chief Complaint", "type": "textarea"},
                {"name": "history_present_illness", "label": "History of Present Illness", "type": "textarea"},
                {"name": "vitals", "label": "Vitals", "type": "textarea"},
                {"name": "examination", "label": "Examination", "type": "textarea"},
                {"name": "diagnosis", "label": "Diagnosis", "type": "textarea"},
                {"name": "prescription", "label": "Prescription", "type": "textarea"},
                {"name": "advice", "label": "Advice", "type": "textarea"},
                {"name": "follow_up", "label": "Follow-up", "type": "textarea"}
            ]
        }
    },
    {
        "type_key": "specialist_consult",
        "name": "Specialist Consultation",
        "description": "Consultation report for specialists.",
        "schema_json": {
            "fields": [
                {"name": "referral_reason", "label": "Referral Reason", "type": "textarea"},
                {"name": "medical_history", "label": "Medical History", "type": "textarea"},
                {"name": "examination", "label": "Examination", "type": "textarea"},
                {"name": "findings", "label": "Findings", "type": "textarea"},
                {"name": "impression", "label": "Impression", "type": "textarea"},
                {"name": "specialist_recommendations", "label": "Specialist Recommendations", "type": "textarea"}
            ]
        }
    },
    {
        "type_key": "cardiology",
        "name": "Cardiology Consultation",
        "description": "Specific to cardiology with ECG and Echo findings.",
        "schema_json": {
            "fields": [
                {"name": "cardiac_symptoms", "label": "Cardiac Symptoms", "type": "textarea"},
                {"name": "risk_factors", "label": "Risk Factors", "type": "textarea"},
                {"name": "ecg_findings", "label": "ECG Findings", "type": "textarea"},
                {"name": "echo_findings", "label": "Echo Findings", "type": "textarea"},
                {"name": "assessment", "label": "Assessment", "type": "textarea"},
                {"name": "cardiac_diagnosis", "label": "Cardiac Diagnosis", "type": "textarea"},
                {"name": "treatment_plan", "label": "Treatment Plan", "type": "textarea"}
            ]
        }
    },
    {
        "type_key": "orthopedic",
        "name": "Orthopedic Consultation",
        "description": "Musculoskeletal and injury-focused report.",
        "schema_json": {
            "fields": [
                {"name": "injury_history", "label": "Injury History", "type": "textarea"},
                {"name": "musculoskeletal_examination", "label": "Musculoskeletal Examination", "type": "textarea"},
                {"name": "range_of_motion", "label": "Range of Motion", "type": "textarea"},
                {"name": "imaging_findings", "label": "Imaging Findings", "type": "textarea"},
                {"name": "diagnosis", "label": "Diagnosis", "type": "textarea"},
                {"name": "management_plan", "label": "Management Plan", "type": "textarea"}
            ]
        }
    },
    {
        "type_key": "lab_investigation",
        "name": "Laboratory Investigation",
        "description": "Report for lab test findings.",
        "schema_json": {
            "fields": [
                {"name": "test_information", "label": "Test Information", "type": "textarea"},
                {"name": "findings", "label": "Findings", "type": "textarea"},
                {"name": "reference_values", "label": "Reference Values", "type": "textarea"},
                {"name": "interpretation", "label": "Interpretation", "type": "textarea"},
                {"name": "remarks", "label": "Remarks", "type": "textarea"}
            ]
        }
    },
    {
        "type_key": "discharge_summary",
        "name": "Discharge Summary",
        "description": "Summary generated upon patient discharge.",
        "schema_json": {
            "fields": [
                {"name": "admission_details", "label": "Admission Details", "type": "textarea"},
                {"name": "hospital_course", "label": "Hospital Course", "type": "textarea"},
                {"name": "investigations", "label": "Investigations", "type": "textarea"},
                {"name": "final_diagnosis", "label": "Final Diagnosis", "type": "textarea"},
                {"name": "treatment_given", "label": "Treatment Given", "type": "textarea"},
                {"name": "condition_at_discharge", "label": "Condition At Discharge", "type": "textarea"},
                {"name": "discharge_medications", "label": "Discharge Medications", "type": "textarea"},
                {"name": "followup_instructions", "label": "Follow-up Instructions", "type": "textarea"}
            ]
        }
    },
    {
        "type_key": "operative_note",
        "name": "Operative / Procedure Note",
        "description": "Details of an operation or procedure.",
        "schema_json": {
            "fields": [
                {"name": "procedure_name", "label": "Procedure Name", "type": "text"},
                {"name": "indication", "label": "Indication", "type": "textarea"},
                {"name": "findings", "label": "Findings", "type": "textarea"},
                {"name": "procedure_details", "label": "Procedure Details", "type": "textarea"},
                {"name": "complications", "label": "Complications", "type": "textarea"},
                {"name": "post_procedure_plan", "label": "Post-Procedure Plan", "type": "textarea"}
            ]
        }
    },
    {
        "type_key": "follow_up",
        "name": "Follow-Up Visit",
        "description": "Report for follow-up visits.",
        "schema_json": {
            "fields": [
                {"name": "previous_diagnosis", "label": "Previous Diagnosis", "type": "textarea"},
                {"name": "progress_since_last_visit", "label": "Progress Since Last Visit", "type": "textarea"},
                {"name": "current_findings", "label": "Current Findings", "type": "textarea"},
                {"name": "updated_assessment", "label": "Updated Assessment", "type": "textarea"},
                {"name": "updated_treatment_plan", "label": "Updated Treatment Plan", "type": "textarea"}
            ]
        }
    }
]

def seed_default_templates(db: Session):
    for template_data in STANDARD_TEMPLATES:
        existing = db.query(ReportTemplate).filter(
            ReportTemplate.type_key == template_data["type_key"]
        ).first()
        if not existing:
            template = ReportTemplate(
                organization_id=None, # Global
                name=template_data["name"],
                type_key=template_data["type_key"],
                description=template_data["description"],
                schema_json=template_data["schema_json"]
            )
            db.add(template)
            logger.info(f"Seeded template: {template_data['name']}")
    db.commit()
