from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class AuditLog(Document):
    """
    DPDP Act compliance: immutable audit trail of all significant user actions.
    WHY? The DPDP Act requires data fiduciaries to maintain logs of data processing.
    """
    action: str           # e.g., USER_LOGIN, DOCUMENT_UPLOAD, AI_CHAT, CONSENT_GRANTED
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    details: str = ""
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_logs"
        indexes = ["user_id", "action", "timestamp"]
