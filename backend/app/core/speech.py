"""
Speech transcription via AssemblyAI REST API (direct HTTP, no SDK).
Audio files are also uploaded to Backblaze B2 for permanent storage.
"""
import uuid
import os
import time
import boto3
import requests
from botocore.client import Config

from app.core.config import settings

ASSEMBLYAI_BASE = "https://api.assemblyai.com"


# ── Backblaze B2 client (S3-compatible) ──────────────────────────────────────

def _get_b2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.B2_ENDPOINT,
        aws_access_key_id=settings.B2_KEY_ID,
        aws_secret_access_key=settings.B2_APPLICATION_KEY,
        config=Config(signature_version="s3v4"),
    )


def upload_to_b2(file_path: str, object_key: str = None) -> str:
    """Upload a local file to Backblaze B2 for permanent storage."""
    if not object_key:
        ext = os.path.splitext(file_path)[1] or ".webm"
        object_key = f"audio/{uuid.uuid4()}{ext}"

    client = _get_b2_client()
    client.upload_file(
        file_path,
        settings.B2_BUCKET_NAME,
        object_key,
        ExtraArgs={"ContentType": "audio/webm"},
    )
    print(f"[B2] Uploaded {file_path} -> {object_key}")
    return object_key


def get_b2_presigned_url(object_key: str) -> str:
    """Generate a fresh pre-signed URL for an existing B2 object."""
    client = _get_b2_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.B2_BUCKET_NAME, "Key": object_key},
        ExpiresIn=3600,
    )


# ── AssemblyAI REST API helpers ───────────────────────────────────────────────

def _aai_headers() -> dict:
    return {"authorization": settings.ASSEMBLYAI_API_KEY}


def _upload_to_assemblyai(file_path: str) -> str:
    """Upload a local audio file to AssemblyAI and return the upload URL."""
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{ASSEMBLYAI_BASE}/v2/upload",
            headers=_aai_headers(),
            data=f,
            timeout=120,
        )
    resp.raise_for_status()
    upload_url = resp.json()["upload_url"]
    print(f"[AssemblyAI] File uploaded -> {upload_url[:60]}...")
    return upload_url


def _submit_transcript(upload_url: str) -> str:
    """Submit a transcription job and return the transcript ID."""
    # For B2 URLs, we need to ensure the URL is properly formatted
    # B2 presigned URLs already include auth, so we just pass them as-is
    payload = {
        "audio_url": upload_url,
        "speech_models": ["universal-2"],
        # Disable language_detection as it can fail on low-quality audio
        # "language_detection": True,
    }
    print(f"[AssemblyAI] Submitting transcript with audio_url: {upload_url[:80]}...")
    print(f"[AssemblyAI] Payload: {payload}")
    
    resp = requests.post(
        f"{ASSEMBLYAI_BASE}/v2/transcript",
        headers={**_aai_headers(), "content-type": "application/json"},
        json=payload,
        timeout=30,
    )
    
    if not resp.ok:
        print(f"[AssemblyAI] Submit error {resp.status_code}")
        print(f"[AssemblyAI] Response: {resp.text}")
        print(f"[AssemblyAI] Request headers: {resp.request.headers}")
        print(f"[AssemblyAI] Request body: {resp.request.body}")
    
    resp.raise_for_status()
    transcript_id = resp.json()["id"]
    print(f"[AssemblyAI] Job submitted -> {transcript_id}")
    return transcript_id


def _poll_transcript(transcript_id: str, timeout: int = 300) -> dict:
    """Poll until the transcript is completed or failed."""
    url = f"{ASSEMBLYAI_BASE}/v2/transcript/{transcript_id}"
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = requests.get(url, headers=_aai_headers(), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        status = data.get("status")
        if status == "completed":
            return data
        if status == "error":
            error_msg = data.get("error", "")
            # Treat "no spoken audio" as an empty completed transcript, not a hard error
            if "no spoken audio" in error_msg.lower() or "language_detection" in error_msg.lower():
                print(f"[AssemblyAI] No spoken audio detected — returning empty transcript")
                return {"status": "completed", "text": "", "confidence": 0.0}
            raise RuntimeError(f"AssemblyAI error: {error_msg}")
        print(f"[AssemblyAI] Status: {status} — waiting...")
        time.sleep(3)
    raise TimeoutError("AssemblyAI transcription timed out after 5 minutes")


# ── Main transcription function ───────────────────────────────────────────────

def transcribe_audio(audio_path: str) -> dict:
    """
    Upload audio directly to AssemblyAI via REST API, poll for result.
    Returns { text, job_id, status, confidence }.
    """
    job_id = str(uuid.uuid4())

    if not settings.ASSEMBLYAI_API_KEY:
        print("[AssemblyAI] No API key configured")
        return {"text": "", "job_id": job_id, "status": "failed", "confidence": 0}

    try:
        # 1. Upload file to AssemblyAI
        upload_url = _upload_to_assemblyai(audio_path)

        # 2. Submit transcription job
        transcript_id = _submit_transcript(upload_url)

        # 3. Poll for result
        result = _poll_transcript(transcript_id)

        text = result.get("text") or ""
        confidence = result.get("confidence") or 0.0

        if len(text.strip()) < 5:
            status = "failed"
            text = "Low quality or empty transcription"
        else:
            status = "completed"

        print(f"[AssemblyAI] Done. status={status}, confidence={confidence:.2f}, chars={len(text)}")

        return {
            "text": text,
            "job_id": transcript_id,
            "status": status,
            "confidence": round(float(confidence), 2),
        }

    except Exception as e:
        print(f"[AssemblyAI] Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "text": f"Transcription error: {str(e)}",
            "job_id": job_id,
            "status": "failed",
            "confidence": 0,
        }
