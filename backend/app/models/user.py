"""
User Document Model

WHY encrypt sensitive fields?
Because the DPDP Act requires that personal data like phone, address,
and date of birth be protected. We store these as AES-256 encrypted
strings in MongoDB and decrypt only when needed.
"""
from beanie import Document
from pydantic import Field, EmailStr
from typing import Optional
from datetime import datetime, timezone


class User(Document):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    dob: Optional[str] = None          # Encrypted at rest
    gender: Optional[str] = None
    address: Optional[str] = None       # Encrypted at rest
    encrypted_fields: list[str] = Field(default_factory=lambda: ["phone", "dob", "address"])
    calendar_linked: bool = False
    google_refresh_token: Optional[str] = None  # Encrypted
    google_id: Optional[str] = None             # Google OAuth sub ID
    language_preference: str = "en"
    role: str = "user"                  # "user" | "admin"
    otp: Optional[str] = None          # Temporary OTP hash
    otp_expires: Optional[datetime] = None
    consent_given: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = ["email"]
