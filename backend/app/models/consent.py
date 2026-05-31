from beanie import Document
from pydantic import Field
from datetime import datetime, timezone


class Consent(Document):
    """
    DPDP Act compliance: every consent action is logged immutably.
    consent_text stores exactly what the user agreed to.
    """
    user_id: str
    consent_text: str
    consent_type: str = "data_processing"  # data_processing | calendar_access | etc.
    granted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "consents"
        indexes = ["user_id"]
