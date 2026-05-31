"""
AI Legal Chat & Application Generator Routes

GET  /api/chat/history          - Get paginated chat history
GET  /api/chat/history/{id}     - Get a single chat by ID
DELETE /api/chat/history/{id}   - Delete a chat by ID
DELETE /api/chat/history        - Clear all chat history
POST /api/chat                  - Send message to AI legal assistant
POST /api/applications/generate - Generate application draft
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.models.user import User
from app.models.legal_chat import LegalChat
from app.models.audit_log import AuditLog
from app.services.auth import get_current_user
from app.services.llm import get_legal_response, generate_application

router = APIRouter(tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str

class ApplicationRequest(BaseModel):
    type: str
    details: str


# ── Chat History Endpoints ──────────────────────────────────

@router.get("/chat/history")
async def get_chat_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
):
    """
    Get paginated chat history for the current user.
    Returns chats sorted by most recent first.
    Supports optional text search on user_message.
    """
    query = {"user_id": str(user.id)}

    # Optional text search
    if search and search.strip():
        query["user_message"] = {"$regex": search.strip(), "$options": "i"}

    # Get total count
    total = await LegalChat.find(query).count()

    # Get paginated results, newest first
    chats = (
        await LegalChat.find(query)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "chats": [
            {
                "id": str(chat.id),
                "user_message": chat.user_message,
                "ai_response": chat.ai_response,
                "risk_level": chat.risk_level,
                "confidence_score": chat.confidence_score,
                "created_at": chat.created_at.isoformat(),
            }
            for chat in chats
        ],
    }


@router.get("/chat/history/{chat_id}")
async def get_chat_by_id(
    chat_id: str,
    user: User = Depends(get_current_user),
):
    """Get a single chat by ID (must belong to the current user)."""
    from beanie import PydanticObjectId

    try:
        chat = await LegalChat.get(PydanticObjectId(chat_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Chat not found")

    if not chat or chat.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Chat not found")

    return {
        "id": str(chat.id),
        "user_message": chat.user_message,
        "ai_response": chat.ai_response,
        "risk_level": chat.risk_level,
        "confidence_score": chat.confidence_score,
        "laws_referenced": chat.laws_referenced,
        "created_at": chat.created_at.isoformat(),
    }


@router.delete("/chat/history/{chat_id}")
async def delete_chat(
    chat_id: str,
    user: User = Depends(get_current_user),
):
    """Delete a single chat by ID."""
    from beanie import PydanticObjectId

    try:
        chat = await LegalChat.get(PydanticObjectId(chat_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Chat not found")

    if not chat or chat.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Chat not found")

    await chat.delete()

    await AuditLog(
        action="CHAT_DELETED",
        user_id=str(user.id),
        user_email=user.email,
        details=f"Deleted chat: {chat.user_message[:80]}",
    ).insert()

    return {"detail": "Chat deleted"}


@router.delete("/chat/history")
async def clear_chat_history(
    user: User = Depends(get_current_user),
):
    """Delete all chats for the current user."""
    result = await LegalChat.find(
        {"user_id": str(user.id)}
    ).delete()

    await AuditLog(
        action="CHAT_HISTORY_CLEARED",
        user_id=str(user.id),
        user_email=user.email,
        details="Cleared all chat history",
    ).insert()

    return {"detail": "Chat history cleared"}


# ── Chat & Application Endpoints ───────────────────────────

@router.post("/chat")
async def chat(req: ChatRequest, user: User = Depends(get_current_user)):
    """Send a message to the AI legal assistant."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Get AI response
    ai_response = await get_legal_response(req.message, user.language_preference)

    # Save chat to database
    chat_record = LegalChat(
        user_id=str(user.id),
        user_message=req.message,
        ai_response=ai_response,
        laws_referenced=ai_response.get("applicable_laws", []),
        risk_level=ai_response.get("risk_level", "Low"),
        confidence_score=ai_response.get("confidence_score", 0),
    )
    await chat_record.insert()

    # Audit log
    await AuditLog(
        action="AI_CHAT",
        user_id=str(user.id),
        user_email=user.email,
        details=f"Legal chat session - Risk: {ai_response.get('risk_level', 'Low')}",
    ).insert()

    return ai_response


@router.post("/applications/generate")
async def generate_app(req: ApplicationRequest, user: User = Depends(get_current_user)):
    """Generate an application draft (police complaint, RTI, etc.)."""
    result = await generate_application(req.type, req.details, user.language_preference)

    await AuditLog(
        action="APPLICATION_GENERATED",
        user_id=str(user.id),
        user_email=user.email,
        details=f"Generated {req.type} application",
    ).insert()

    return result
