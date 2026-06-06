import sys
try:
    sys.stdout.reconfigure(write_through=True, line_buffering=True)
    sys.stderr.reconfigure(write_through=True, line_buffering=True)
except Exception:
    pass

from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file explicitly from the backend directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "ArogyaScribe"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "DEVELOPMENT_SECRET_KEY_REPLACE_IN_PROD")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./arogyascribe.db")
    
     # Supabase
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_SECRET_KEY: Optional[str] = os.getenv("SUPABASE_SECRET_KEY")

    # External APIs
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ENDPOINT: Optional[str] = os.getenv("ENDPOINT")

    # AssemblyAI - Speech Transcription
    ASSEMBLYAI_API_KEY: Optional[str] = os.getenv("ASSEMBLYAI_API_KEY")

    # Backblaze B2 - Object Storage (S3-compatible)
    B2_KEY_ID: Optional[str] = os.getenv("B2_KEY_ID")
    B2_APPLICATION_KEY: Optional[str] = os.getenv("B2_APPLICATION_KEY")
    B2_ENDPOINT: Optional[str] = os.getenv("B2_ENDPOINT")
    B2_BUCKET_NAME: str = os.getenv("B2_BUCKET_NAME", "arogyascribe-audio")
    
    # File Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    def __init__(self, **values):
        super().__init__(**values)
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgres://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
            elif self.DATABASE_URL.startswith("postgresql://") and not self.DATABASE_URL.startswith("postgresql+psycopg2://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Debug: Print loaded settings on startup
print("[CONFIG] ASSEMBLYAI_API_KEY:", "SET" if settings.ASSEMBLYAI_API_KEY else "NOT SET")
print("[CONFIG] B2_KEY_ID:", settings.B2_KEY_ID)
print("[CONFIG] B2_ENDPOINT:", settings.B2_ENDPOINT)
print("[CONFIG] B2_BUCKET_NAME:", settings.B2_BUCKET_NAME)
