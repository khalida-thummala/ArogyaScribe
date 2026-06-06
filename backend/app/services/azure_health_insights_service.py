import json
import asyncio

class AzureHealthInsightsMockService:
    """
    Mock service for Azure AI Health Insights - Radiology Insights API.
    Simulates extracting structured clinical codes and critical flags from unstructured text.
    """
    
    @staticmethod
    async def extract_clinical_insights(findings_text: str, impression_text: str) -> dict:
        """
        In a real deployment, this would use azure-ai-healthinsights-clinicalmatching 
        to return fully coded SNOMED and LOINC responses.
        For now, we mock the logic using basic keyword checks.
        """
        # Simulate network/processing delay
        await asyncio.sleep(0.5)
        
        combined_text = f"{findings_text} {impression_text}".lower()
        
        clinical_codes = []
        critical_findings = False
        follow_up_recommendation = "No specific follow-up recommended at this time based on automated analysis."
        
        # Mock detection logic
        if "atelecta" in combined_text:
            clinical_codes.append({
                "system": "SNOMED CT",
                "code": "46621007",
                "display": "Atelectasis (disorder)"
            })
            
        if "enlarge" in combined_text and "cardiomediastinal" in combined_text:
            clinical_codes.append({
                "system": "SNOMED CT",
                "code": "164873001",
                "display": "Cardiomegaly (disorder)"
            })
            
        if "pneumothorax" in combined_text and "no pneumothorax" not in combined_text:
            clinical_codes.append({
                "system": "SNOMED CT",
                "code": "36118008",
                "display": "Pneumothorax"
            })
            critical_findings = True
            follow_up_recommendation = "URGENT: Immediate clinical correlation and potential chest tube placement indicated for pneumothorax."
            
        if "fracture" in combined_text and "no fracture" not in combined_text:
            clinical_codes.append({
                "system": "SNOMED CT",
                "code": "125605004",
                "display": "Fracture of bone"
            })
            critical_findings = True
            follow_up_recommendation = "Orthopedic consultation recommended for fracture evaluation."
            
        if "catheter" in combined_text or "line" in combined_text:
            clinical_codes.append({
                "system": "LOINC",
                "code": "72288-4",
                "display": "Radiology Catheter placement"
            })
            
        # Add a default if nothing specific matches
        if not clinical_codes:
            clinical_codes.append({
                "system": "SNOMED CT",
                "code": "118247008",
                "display": "Radiologic finding (finding)"
            })
            
        return {
            "clinical_codes": json.dumps(clinical_codes),
            "critical_findings": "true" if critical_findings else "false",
            "follow_up_recommendation": follow_up_recommendation
        }

azure_health_insights_service = AzureHealthInsightsMockService()
