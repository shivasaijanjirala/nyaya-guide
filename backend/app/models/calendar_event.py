from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime


class CalendarEvent(Document):
    user_id: str
    title: str
    start: datetime
    end: datetime
    description: Optional[str] = None
    event_type: str = "deadline"  # deadline | hearing | meeting | reminder

    class Settings:
        name = "calendar_events"
        indexes = ["user_id"]
