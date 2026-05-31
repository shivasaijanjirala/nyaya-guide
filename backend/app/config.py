"""
NyayaGuide Backend Configuration

WHY Pydantic Settings?
- Type-safe environment variable loading
- Validation on startup (fail fast if config is missing)
- Single source of truth for all config values
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── MongoDB ──
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "nyayaguide"

    # ── JWT ──
    JWT_SECRET: str = "change-me-to-a-strong-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── AES-256 Encryption ──
    ENCRYPTION_KEY: str = "change-me-base64-encoded-32-byte-key"

    # ── Email (SMTP) ──
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    FROM_EMAIL: str = "noreply@nyayaguide.in"

    # ── Google Gemini (Free LLM) ──
    GEMINI_API_KEY: str = ""

    # ── AWS S3 / MinIO ──
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET: str = "nyayaguide-documents"
    S3_REGION: str = "ap-south-1"

    # ── Google OAuth ──
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/calendar/callback"

    # ── App ──
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
