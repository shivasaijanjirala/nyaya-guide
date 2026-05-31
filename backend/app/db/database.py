"""
MongoDB Connection & Beanie ODM Initialization

WHY Beanie?
- Async MongoDB ODM built on Motor + Pydantic
- Documents are Pydantic models → automatic validation
- First-class async/await support with FastAPI
"""
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings


async def init_db():
    """Initialize MongoDB connection and register all document models."""
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]

    # Import all Beanie document models
    from app.models.user import User
    from app.models.document import Document
    from app.models.consent import Consent
    from app.models.calendar_event import CalendarEvent
    from app.models.legal_chat import LegalChat
    from app.models.case_timeline import CaseTimeline
    from app.models.user_note import UserNote
    from app.models.audit_log import AuditLog

    await init_beanie(
        database=db,
        document_models=[
            User, Document, Consent, CalendarEvent,
            LegalChat, CaseTimeline, UserNote, AuditLog,
        ],
    )

    print("[OK] MongoDB connected and Beanie initialized")
