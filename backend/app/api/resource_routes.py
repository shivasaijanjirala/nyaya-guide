"""
Document, Notes, Timeline, Calendar, Legal Trends, and Admin Routes

Consolidated resource routes for CRUD operations.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.models.user import User
from app.models.document import DocumentModel
from app.models.user_note import UserNote
from app.models.case_timeline import CaseTimeline
from app.models.audit_log import AuditLog
from app.models.consent import Consent
from app.services.auth import get_current_user, get_admin_user

# ══════════════════════════════════════════════════
# DOCUMENTS
# ══════════════════════════════════════════════════
doc_router = APIRouter(prefix="/documents", tags=["Documents"])


@doc_router.get("")
async def list_documents(user: User = Depends(get_current_user)):
    docs = await DocumentModel.find(DocumentModel.user_id == str(user.id)).to_list()
    return {
        "documents": [
            {
                "id": str(d.id),
                "_id": str(d.id),
                "file_name": d.file_name,
                "file_type": d.file_type,
                "storage_path": d.storage_path,
                "extracted_metadata": d.extracted_metadata,
                "uploadedAt": d.uploaded_at.isoformat(),
            }
            for d in docs
        ]
    }


@doc_router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    user: User = Depends(get_current_user),
):
    """Upload files. In production, these go to S3 with AES-256 encryption."""
    uploaded = []
    for f in files:
        # In production: upload to S3 with encryption
        # For now, store metadata only
        doc = DocumentModel(
            user_id=str(user.id),
            file_name=f.filename or "unknown",
            file_type=f.content_type or "application/octet-stream",
            storage_path=f"uploads/{user.id}/{f.filename}",
            encrypted_key="dev-key-placeholder",  # In production: generate per-file AES key
        )
        await doc.insert()
        uploaded.append(str(doc.id))

    await AuditLog(
        action="DOCUMENT_UPLOAD",
        user_id=str(user.id),
        user_email=user.email,
        details=f"Uploaded {len(files)} file(s)",
    ).insert()

    return {"message": f"{len(files)} file(s) uploaded", "ids": uploaded}


@doc_router.delete("/{doc_id}")
async def delete_document(doc_id: str, user: User = Depends(get_current_user)):
    from beanie import PydanticObjectId
    doc = await DocumentModel.get(PydanticObjectId(doc_id))
    if not doc or doc.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Document not found")
    await doc.delete()
    return {"message": "Deleted"}


# ══════════════════════════════════════════════════
# NOTES
# ══════════════════════════════════════════════════
notes_router = APIRouter(prefix="/notes", tags=["Notes"])


class NoteCreate(BaseModel):
    note_text: str
    related_document_id: Optional[str] = None


@notes_router.get("")
async def list_notes(user: User = Depends(get_current_user)):
    notes = await UserNote.find(UserNote.user_id == str(user.id)).sort("-created_at").to_list()
    return {
        "notes": [
            {
                "id": str(n.id),
                "_id": str(n.id),
                "note_text": n.note_text,
                "related_document_id": n.related_document_id,
                "createdAt": n.created_at.isoformat(),
            }
            for n in notes
        ]
    }


@notes_router.post("")
async def create_note(req: NoteCreate, user: User = Depends(get_current_user)):
    note = UserNote(user_id=str(user.id), note_text=req.note_text, related_document_id=req.related_document_id)
    await note.insert()
    return {"message": "Note saved", "id": str(note.id)}


@notes_router.delete("/{note_id}")
async def delete_note(note_id: str, user: User = Depends(get_current_user)):
    from beanie import PydanticObjectId
    note = await UserNote.get(PydanticObjectId(note_id))
    if not note or note.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Note not found")
    await note.delete()
    return {"message": "Deleted"}


# ══════════════════════════════════════════════════
# TIMELINE
# ══════════════════════════════════════════════════
timeline_router = APIRouter(prefix="/timeline", tags=["Timeline"])


class TimelineCreate(BaseModel):
    event: str
    date: str
    legal_significance: Optional[str] = None


@timeline_router.get("")
async def list_timeline(user: User = Depends(get_current_user)):
    events = await CaseTimeline.find(CaseTimeline.user_id == str(user.id)).sort("-date").to_list()
    return {
        "events": [
            {
                "id": str(e.id),
                "_id": str(e.id),
                "event": e.event,
                "date": e.date.isoformat(),
                "legal_significance": e.legal_significance,
            }
            for e in events
        ]
    }


@timeline_router.post("")
async def create_timeline_event(req: TimelineCreate, user: User = Depends(get_current_user)):
    event = CaseTimeline(
        user_id=str(user.id),
        event=req.event,
        date=datetime.fromisoformat(req.date),
        legal_significance=req.legal_significance,
    )
    await event.insert()
    return {"message": "Event added", "id": str(event.id)}


@timeline_router.delete("/{event_id}")
async def delete_timeline_event(event_id: str, user: User = Depends(get_current_user)):
    from beanie import PydanticObjectId
    ev = await CaseTimeline.get(PydanticObjectId(event_id))
    if not ev or ev.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    await ev.delete()
    return {"message": "Deleted"}


# ══════════════════════════════════════════════════
# CALENDAR (built-in events + optional Google link)
# ══════════════════════════════════════════════════
calendar_router = APIRouter(prefix="/calendar", tags=["Calendar"])


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start: str        # ISO datetime string
    end: str          # ISO datetime string
    event_type: Optional[str] = "deadline"  # deadline | hearing | meeting | reminder


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    event_type: Optional[str] = None


@calendar_router.get("/status")
async def calendar_status(user: User = Depends(get_current_user)):
    return {"linked": user.calendar_linked}


@calendar_router.get("/events")
async def calendar_events(user: User = Depends(get_current_user)):
    from app.models.calendar_event import CalendarEvent
    events = await CalendarEvent.find(CalendarEvent.user_id == str(user.id)).sort("start").to_list()
    return {
        "events": [
            {
                "id": str(e.id),
                "_id": str(e.id),
                "title": e.title,
                "start": e.start.isoformat(),
                "end": e.end.isoformat(),
                "description": e.description,
                "event_type": getattr(e, "event_type", "deadline"),
            }
            for e in events
        ]
    }


@calendar_router.post("/events")
async def create_event(req: EventCreate, user: User = Depends(get_current_user)):
    from app.models.calendar_event import CalendarEvent
    event = CalendarEvent(
        user_id=str(user.id),
        title=req.title,
        description=req.description,
        start=datetime.fromisoformat(req.start),
        end=datetime.fromisoformat(req.end),
        event_type=req.event_type or "deadline",
    )
    await event.insert()

    await AuditLog(
        action="CALENDAR_EVENT_CREATED",
        user_id=str(user.id),
        user_email=user.email,
        details=f"Created event: {req.title}",
    ).insert()

    return {"message": "Event created", "id": str(event.id)}


@calendar_router.put("/events/{event_id}")
async def update_event(event_id: str, req: EventUpdate, user: User = Depends(get_current_user)):
    from beanie import PydanticObjectId
    from app.models.calendar_event import CalendarEvent
    event = await CalendarEvent.get(PydanticObjectId(event_id))
    if not event or event.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")

    if req.title is not None:
        event.title = req.title
    if req.description is not None:
        event.description = req.description
    if req.start is not None:
        event.start = datetime.fromisoformat(req.start)
    if req.end is not None:
        event.end = datetime.fromisoformat(req.end)
    if req.event_type is not None:
        event.event_type = req.event_type

    await event.save()
    return {"message": "Event updated"}


@calendar_router.delete("/events/{event_id}")
async def delete_event(event_id: str, user: User = Depends(get_current_user)):
    from beanie import PydanticObjectId
    from app.models.calendar_event import CalendarEvent
    event = await CalendarEvent.get(PydanticObjectId(event_id))
    if not event or event.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Event not found")
    await event.delete()
    return {"message": "Event deleted"}


@calendar_router.get("/auth-url")
async def calendar_auth_url(user: User = Depends(get_current_user)):
    """Return Google OAuth URL for calendar linking. Implement full OAuth flow in production."""
    from app.config import settings
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=https://www.googleapis.com/auth/calendar.readonly&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    return {"url": url}


@calendar_router.post("/unlink")
async def calendar_unlink(user: User = Depends(get_current_user)):
    user.calendar_linked = False
    user.google_refresh_token = None
    await user.save()
    return {"message": "Calendar unlinked"}


# ══════════════════════════════════════════════════
# LEGAL TRENDS (curated articles — in production, fetch from trusted sources)
# ══════════════════════════════════════════════════
trends_router = APIRouter(prefix="/legal-trends", tags=["Legal Trends"])

# Curated legal articles — updated March 2026
CURATED_ARTICLES = [
    {
        "id": "1",
        "title": "Supreme Court Allows Withdrawal of Life-Sustaining Treatment in Landmark Passive Euthanasia Ruling",
        "summary": "In Harish Rana v. Union of India (March 11, 2026), the Supreme Court ruled that Clinically Assisted Nutrition and Hydration (CANH) constitutes 'medical treatment' rather than primary care. Doctors may exercise clinical judgment to withhold it for patients in a persistent vegetative state, affirming the right to die with dignity under Article 21.",
        "category": "Constitutional Law",
        "date": "2026-03-11",
        "source": "Supreme Court of India",
    },
    {
        "id": "2",
        "title": "Transgender Persons (Protection of Rights) Amendment Bill, 2026 Passed by Parliament",
        "summary": "Introduced on March 13 and passed by both Houses by March 25, 2026, this Bill amends the 2019 Act. It introduces new requirements for identity certification involving medical boards and narrows the definition of transgender identity, sparking significant debate regarding the right to self-identification.",
        "category": "Human Rights",
        "date": "2026-03-25",
        "source": "Parliament of India",
    },
    {
        "id": "3",
        "title": "Jan Vishwas Bill 2026: Decriminalizing 717 Minor Offenses Across 79 Acts",
        "summary": "Introduced in the Lok Sabha in late March 2026, this bill seeks to amend 79 central acts to decriminalize 717 minor offenses and rationalize penalties. It aims to improve 'ease of doing business' and 'ease of living,' building upon the reforms initiated in the 2023 Act.",
        "category": "Administrative Law",
        "date": "2026-03-22",
        "source": "Lok Sabha / Ministry of Law",
    },
    {
        "id": "4",
        "title": "DPDP Rules 2025: Phase I Now Active — Data Protection Board Operational",
        "summary": "The Digital Personal Data Protection Rules, 2025 took effect on November 13, 2025, establishing the Data Protection Board of India. Phase II (Consent Manager registration) is due by November 2026, with full compliance required by May 13, 2027. Organizations must now map data, update privacy policies, and implement technical safeguards.",
        "category": "Data Protection",
        "date": "2026-03-15",
        "source": "MeitY / Data Protection Board",
    },
    {
        "id": "5",
        "title": "Bharatiya Nyaya Sanhita (BNS): Implementation Progress and Key Changes",
        "summary": "Since July 1, 2024, all new FIRs are registered under the BNS, BNSS, and BSA — replacing the IPC, CrPC, and Indian Evidence Act. Key reforms include e-FIRs, electronic summons, digital evidence, new offenses for organized crime and mob lynching, and community service for minor offenses. Full implementation expected within 3 years.",
        "category": "Criminal Law",
        "date": "2026-03-10",
        "source": "Ministry of Home Affairs",
    },
    {
        "id": "6",
        "title": "Supreme Court: No Mandatory Valuation Report for Reduction of Share Capital",
        "summary": "In Pannalal Bhansali v. Bharti Telecom Ltd. (March 10, 2026), the Supreme Court held that a formal valuation report is not a mandatory statutory requirement for reduction of share capital under Section 66 of the Companies Act, 2013, provided the reduction is approved by a special resolution and confirmed by the tribunal.",
        "category": "Corporate Law",
        "date": "2026-03-10",
        "source": "Supreme Court of India",
    },
    {
        "id": "7",
        "title": "Supreme Court Affirms State Obligation for COVID-19 Vaccine Adverse Event Redressal",
        "summary": "The Supreme Court affirmed that under Article 21, the State has an obligation to provide a structured mechanism for redressal when grave harm is alleged due to state-led public health interventions. The ruling highlights constitutional concerns regarding the absence of frameworks to address adverse events following immunisation (AEFI).",
        "category": "Constitutional Law",
        "date": "2026-03-08",
        "source": "Supreme Court of India",
    },
    {
        "id": "8",
        "title": "Chhattisgarh Freedom of Religion (Amendment) Act, 2026 Enacted",
        "summary": "Passed by the State Assembly on March 19, 2026, this state-level law redefines provisions regarding religious conversion and imposes stricter penalties. It has drawn criticism from various groups concerned about potential impacts on minority rights and freedom of conscience.",
        "category": "Constitutional Law",
        "date": "2026-03-19",
        "source": "Chhattisgarh State Assembly",
    },
    {
        "id": "9",
        "title": "Consumer Protection: DPDP Act Works Alongside Consumer Protection Act 2019",
        "summary": "Legal experts confirm that the DPDP Act 2023 operates alongside the Consumer Protection Act 2019. While the CPA addresses fair trade and quality of services, the DPDP Act secures informational privacy, with both frameworks empowering citizens with rights to data access, correction, erasure, and grievance redressal.",
        "category": "Consumer Law",
        "date": "2026-03-05",
        "source": "Legal Research / MeitY",
    },
    {
        "id": "10",
        "title": "Seven Former High Court Judges Designated as Senior Advocates by Supreme Court",
        "summary": "In March 2026, the Supreme Court designated seven former High Court judges as Senior Advocates, recognizing their distinguished service to the legal profession and expertise in Indian jurisprudence.",
        "category": "Legal Profession",
        "date": "2026-03-07",
        "source": "Supreme Court of India",
    },
]


@trends_router.get("")
async def legal_trends():
    """Return recent legal trends — curated articles updated March 2026."""
    return {"articles": CURATED_ARTICLES}


# ══════════════════════════════════════════════════
# ADMIN
# ══════════════════════════════════════════════════
admin_router = APIRouter(prefix="/admin", tags=["Admin"])


@admin_router.get("/logs")
async def admin_logs(admin: User = Depends(get_admin_user)):
    logs = await AuditLog.find_all().sort("-timestamp").limit(100).to_list()
    return {
        "logs": [
            {
                "id": str(l.id),
                "action": l.action,
                "user_email": l.user_email or "",
                "details": l.details,
                "timestamp": l.timestamp.isoformat(),
            }
            for l in logs
        ]
    }


@admin_router.get("/consents")
async def admin_consents(admin: User = Depends(get_admin_user)):
    consents = await Consent.find_all().sort("-granted_at").limit(100).to_list()
    results = []
    for c in consents:
        from beanie import PydanticObjectId
        user = await User.get(PydanticObjectId(c.user_id)) if c.user_id else None
        results.append({
            "id": str(c.id),
            "user_email": user.email if user else "unknown",
            "user_name": user.name if user else "unknown",
            "consent_text": c.consent_text,
            "granted_at": c.granted_at.isoformat(),
        })
    return {"consents": results}
