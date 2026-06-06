import os
import io
import uuid
import base64
from datetime import datetime
from typing import Optional

from app.core.speech import transcribe_audio
from app.core.ai import generate_dictation_report


class DictationService:

    @staticmethod
    def _save_temp_file(content: bytes, ext: str) -> str:
        """Save bytes to a temp file in uploads/ and return the path."""
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}.{ext}"
        path = os.path.join(upload_dir, filename)
        with open(path, "wb") as f:
            f.write(content)
        return path

    @staticmethod
    def _cleanup(path: Optional[str]):
        """Remove a temp file silently."""
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

    @staticmethod
    def transcribe_and_generate(
        audio_bytes: bytes,
        audio_ext: str = "webm",
        letterhead_bytes: Optional[bytes] = None,
        letterhead_ext: str = "png",
        patient_context: str = "",
    ) -> dict:
        """
        Full Phase 1 pipeline:
        1. Save audio → 2. Transcribe (AssemblyAI) → 3. Generate report (GPT-4) → 4. Return data
        """
        audio_path = None
        try:
            if audio_ext == 'txt':
                transcript = audio_bytes.decode('utf-8')
                transcription_result = {"confidence": 1.0}
            else:
                # Step 1: Save audio
                audio_path = DictationService._save_temp_file(audio_bytes, audio_ext)

                # Step 2: Transcribe
                transcription_result = transcribe_audio(audio_path)
                transcript = transcription_result.get("text", "")

            if not transcript:
                return {
                    "success": False,
                    "error": "Transcription returned empty text. Please speak clearly and try again.",
                    "transcript": "",
                    "report": None,
                }

            # Step 3: Generate structured report
            report_data = generate_dictation_report(transcript, patient_context)

            # Step 4: Encode letterhead as base64 for frontend rendering
            letterhead_b64 = None
            letterhead_mime = "image/png"
            if letterhead_bytes:
                letterhead_b64 = base64.b64encode(letterhead_bytes).decode("utf-8")
                mime_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "gif": "image/gif", "webp": "image/webp"}
                letterhead_mime = mime_map.get(letterhead_ext.lower(), "image/png")

            return {
                "success": True,
                "transcript": transcript,
                "transcription_confidence": transcription_result.get("confidence"),
                "report": report_data,
                "letterhead_b64": letterhead_b64,
                "letterhead_mime": letterhead_mime,
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            print(f"[DictationService] Error: {e}")
            return {
                "success": False,
                "error": str(e),
                "transcript": "",
                "report": None,
            }
        finally:
            DictationService._cleanup(audio_path)

    @staticmethod
    def generate_pdf(
        report: dict,
        letterhead_bytes: Optional[bytes] = None,
        letterhead_ext: str = "png",
        template_id: str = "minimal",
        template_config: dict = None,
    ) -> bytes:
        """
        Build a professional print-ready PDF using dynamic templates.
        """
        from app.templates.manager import TemplateManager
        template = TemplateManager.get_template(template_id, config=template_config)
        return template.render(report, letterhead_bytes, letterhead_ext)

