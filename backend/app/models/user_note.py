from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class UserNote(Document):
    user_id: str
    note_text: str
    related_document_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "user_notes"
        indexes = ["user_id"]
