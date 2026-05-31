from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime


class CaseTimeline(Document):
    user_id: str
    event: str
    date: datetime
    legal_significance: Optional[str] = None

    class Settings:
        name = "case_timeline"
        indexes = ["user_id"]
