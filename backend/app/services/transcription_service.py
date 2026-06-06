from app.core.speech import transcribe_audio
import asyncio

class TranscriptionService:
    @staticmethod
    async def transcribe(audio_content: bytes):
        # transcribe_audio is synchronous — run it in a thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, transcribe_audio, audio_content)
