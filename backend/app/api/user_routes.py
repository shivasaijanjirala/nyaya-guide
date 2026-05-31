"""
User Profile, Data Export, and Account Deletion Routes

DPDP Act compliance:
- Users can update their profile
- Users can export ALL their data (Right to Data Portability)
- Users can delete their account and ALL data (Right to Erasure)
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.responses import JSONResponse

from app.models.user import User
from app.models.document import DocumentModel
from app.models.consent import Consent
from app.models.legal_chat import LegalChat
from app.models.case_timeline import CaseTimeline
from app.models.user_note import UserNote
from app.models.audit_log import AuditLog
from app.services.auth import get_current_user
from app.services.encryption import encrypt_field

router = APIRouter(prefix="/users", tags=["Users"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    language_preference: Optional[str] = None


@router.put("/profile")
async def update_profile(req: ProfileUpdate, user: User = Depends(get_current_user)):
    """Update user profile. Sensitive fields are encrypted before storage."""
    if req.name is not None:
        user.name = req.name
    if req.phone is not None:
        user.phone = encrypt_field(req.phone)
    if req.dob is not None:
        user.dob = encrypt_field(req.dob)
    if req.gender is not None:
        user.gender = req.gender
    if req.address is not None:
        user.address = encrypt_field(req.address)
    if req.language_preference is not None:
        user.language_preference = req.language_preference

    await user.save()
    await AuditLog(action="PROFILE_UPDATE", user_id=str(user.id), user_email=user.email, details="Profile updated").insert()

    return {
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "dob": user.dob,
            "gender": user.gender,
            "address": user.address,
            "role": user.role,
            "language_preference": user.language_preference,
        }
    }


@router.get("/export-data")
async def export_data(user: User = Depends(get_current_user)):
    """Export ALL user data as JSON (DPDP Right to Data Portability)."""
    user_id = str(user.id)

    documents = await DocumentModel.find(DocumentModel.user_id == user_id).to_list()
    chats = await LegalChat.find(LegalChat.user_id == user_id).to_list()
    notes = await UserNote.find(UserNote.user_id == user_id).to_list()
    timeline = await CaseTimeline.find(CaseTimeline.user_id == user_id).to_list()
    consents = await Consent.find(Consent.user_id == user_id).to_list()

    export = {
        "profile": {
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "dob": user.dob,
            "gender": user.gender,
            "address": user.address,
            "language_preference": user.language_preference,
        },
        "documents": [{"file_name": d.file_name, "file_type": d.file_type, "uploaded_at": str(d.uploaded_at)} for d in documents],
        "chats": [{"message": c.user_message, "response": c.ai_response, "created_at": str(c.created_at)} for c in chats],
        "notes": [{"text": n.note_text, "created_at": str(n.created_at)} for n in notes],
        "timeline": [{"event": t.event, "date": str(t.date), "significance": t.legal_significance} for t in timeline],
        "consents": [{"text": c.consent_text, "granted_at": str(c.granted_at)} for c in consents],
    }

    await AuditLog(action="DATA_EXPORT", user_id=user_id, user_email=user.email, details="User exported personal data (DPDP)").insert()

    return JSONResponse(content=export)


@router.delete("/delete-account")
async def delete_account(user: User = Depends(get_current_user)):
    """Delete user account and ALL associated data (DPDP Right to Erasure)."""
    user_id = str(user.id)

    # Delete all user data across collections
    await DocumentModel.find(DocumentModel.user_id == user_id).delete()
    await LegalChat.find(LegalChat.user_id == user_id).delete()
    await UserNote.find(UserNote.user_id == user_id).delete()
    await CaseTimeline.find(CaseTimeline.user_id == user_id).delete()
    await Consent.find(Consent.user_id == user_id).delete()

    # Log the deletion before deleting user
    await AuditLog(action="ACCOUNT_DELETED", user_email=user.email, details="User deleted account and all data (DPDP Right to Erasure)").insert()

    # Finally delete the user
    await user.delete()

    return {"message": "Account and all data permanently deleted"}
