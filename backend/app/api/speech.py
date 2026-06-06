import os
import uuid

from fastapi import APIRouter, UploadFile, File

from app.core.speech import transcribe_audio
from app.core.config import settings
import requests
from fastapi import HTTPException

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    Accepts an audio file, saves it temporarily, uploads to B2,
    transcribes with AssemblyAI, and returns the transcript.
    """
    local_path = None
    try:
        filename = f"{uuid.uuid4()}.webm"
        local_path = os.path.join(UPLOAD_DIR, filename)

        with open(local_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        result = transcribe_audio(local_path)

        return {
            "transcription": result["text"],
            "status": result["status"],
            "job_id": result["job_id"],
            "confidence": result["confidence"],
        }

    except Exception as e:
        return {"transcription": str(e), "status": "failed"}

    finally:
        # Clean up local temp file after upload to B2
        if local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception:
                pass

@router.get("/assemblyai-token")
def get_assemblyai_token():
    """
    Generates a temporary token for the frontend to connect directly
    to AssemblyAI's Real-Time WebSocket without exposing our API key.
    """
    if not settings.ASSEMBLYAI_API_KEY:
        raise HTTPException(status_code=500, detail="AssemblyAI API Key not configured")

    headers = {
        "authorization": settings.ASSEMBLYAI_API_KEY,
        "content-type": "application/json"
    }

    response = requests.get(
        "https://streaming.assemblyai.com/v3/token",
        params={"expires_in_seconds": 600},
        headers=headers
    )

    if response.status_code == 200:
        return response.json()
    else:
        raise HTTPException(status_code=response.status_code, detail="Failed to get temporary token")
