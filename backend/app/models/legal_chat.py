from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class LegalChat(Document):
    """
    Stores each AI chat interaction with the structured JSON response.
    laws_referenced and ai_response are stored as full dicts for auditability.
    """
    user_id: str
    user_message: str
    ai_response: dict                     # Full JSON response from LLM
    laws_referenced: list[dict] = Field(default_factory=list)
    risk_level: str = "Low"               # Low | Medium | High
    confidence_score: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "legal_chats"
        indexes = ["user_id"]
