import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.session import engine, SessionLocal
from app.services.analysis_service import AnalysisService
from fastapi import UploadFile
import io

async def test_full_flow():
    db = SessionLocal()
    try:
        from app.models.user import User
        from app.models.patient import Patient
        user = db.query(User).first()
        patient = db.query(Patient).first()
        if not user or not patient:
            print("No users or patients in DB!")
            return
            
        print(f"Testing with user {user.user_id}, org {user.organization_id}, patient {patient.patient_id}")
        
        content = b"This is a test patient document for RAG analysis."
        file_mock = UploadFile(filename="manual_entry.txt", file=io.BytesIO(content))
        
        print("\n--- 1. UPLOADING ---")
        record = await AnalysisService.process_upload(
            db=db,
            file=file_mock,
            file_type="txt", 
            user_id=user.user_id,
            organization_id=user.organization_id,
            patient_id=patient.patient_id
        )
        print("Upload successful! ID:", record.analysis_id)
        
        print("\n--- 2. ANALYZING ---")
        analysis_record = AnalysisService.analyze_document(
            db=db, 
            analysis_id=record.analysis_id, 
            organization_id=user.organization_id
        )
        print("Analysis successful! Status:", analysis_record.analysis_status)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Exception caught in test script:", e)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_full_flow())
