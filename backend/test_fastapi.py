import asyncio
from uuid import UUID
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.api.external_radiology import analyze_xray_external
import traceback

class MockAPIKey:
    def __init__(self, key_id, org_id):
        self.api_key_id = key_id
        self.organization_id = org_id

async def test():
    patient_id = UUID("d3cca837-041c-47dc-aa82-48b416c6d0e5")
    api_key = MockAPIKey("7d1b6715ee5282c896a1a2a1773e30c6f639178759db9a24ec8ac3f21ad95a9c", "test_org_id")
    
    with open("C:/Users/khali/Downloads/MRBRAIN.DCM", "rb") as f:
        file = UploadFile(filename="MRBRAIN.DCM", file=f)
        
        try:
            result = await analyze_xray_external(patient_id=patient_id, file=file, api_key=api_key)
            print("SUCCESS:")
            print(result)
        except Exception as e:
            print("ERROR TRACEBACK:")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
