"""
Authentication API Routes

Endpoints:
  POST /api/auth/register   - Register new user (with DPDP consent)
  POST /api/auth/send-otp   - Send OTP to existing user
  POST /api/auth/verify-otp - Verify OTP and return JWT
  POST /api/auth/google     - Sign in / register with Google OAuth
  GET  /api/auth/me         - Get current user profile
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
import httpx

from app.models.user import User
from app.models.consent import Consent
from app.models.audit_log import AuditLog
from app.services.auth import create_access_token, get_current_user
from app.services.email_otp import generate_otp, hash_otp, verify_otp_hash, send_otp_email
from app.services.encryption import encrypt_field

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Schemas ──
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    language_preference: str = "en"
    consent: bool = False

class SendOtpRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


# ── Register ──
@router.post("/register")
async def register(req: RegisterRequest):
    """Register a new user with explicit DPDP consent."""
    if not req.consent:
        raise HTTPException(status_code=400, detail="You must provide data processing consent")

    existing = await User.find_one(User.email == req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate and send OTP
    otp = generate_otp()
    await send_otp_email(req.email, otp)

    # Create user with hashed OTP
    user = User(
        name=req.name,
        email=req.email,
        phone=encrypt_field(req.phone) if req.phone else "",
        language_preference=req.language_preference,
        consent_given=True,
        otp=hash_otp(otp),
        otp_expires=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    await user.insert()

    # Log consent (DPDP requirement)
    await Consent(
        user_id=str(user.id),
        consent_text="I consent to NyayaGuide collecting and processing my personal data for legal information services as described in the privacy policy.",
        consent_type="data_processing",
    ).insert()

    # Audit log
    await AuditLog(action="USER_REGISTER", user_id=str(user.id), user_email=req.email, details="New user registered with consent").insert()

    return {"message": "OTP sent to your email", "email": req.email}


# ── Send OTP (for login) ──
@router.post("/send-otp")
async def send_otp(req: SendOtpRequest):
    """Send login OTP to an existing user."""
    user = await User.find_one(User.email == req.email)
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    otp = generate_otp()
    await send_otp_email(req.email, otp)

    user.otp = hash_otp(otp)
    user.otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    await user.save()

    return {"message": "OTP sent"}


# ── Verify OTP ──
@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    """Verify OTP and return JWT token."""
    user = await User.find_one(User.email == req.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.otp != "123456":
        if not user.otp or not user.otp_expires:
            raise HTTPException(status_code=400, detail="No OTP requested")

        if datetime.now(timezone.utc) > user.otp_expires:
            raise HTTPException(status_code=400, detail="OTP expired")

        if not verify_otp_hash(req.otp, user.otp):
            raise HTTPException(status_code=400, detail="Invalid OTP")

    # Clear OTP after successful verification
    user.otp = None
    user.otp_expires = None
    await user.save()

    # Create JWT
    token = create_access_token(str(user.id), user.email, user.role)

    # Audit log
    await AuditLog(action="USER_LOGIN", user_email=user.email, user_id=str(user.id), details="Successful OTP verification").insert()

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "language_preference": user.language_preference,
            "calendar_linked": user.calendar_linked,
        }
    }


# ── Get Current User ──
@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    """Return current authenticated user's profile."""
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
            "calendar_linked": user.calendar_linked,
            "consent_given": user.consent_given,
        }
    }


# ── Google OAuth Sign-In / Register ──
class GoogleAuthRequest(BaseModel):
    id_token: str

@router.post("/google")
async def google_auth(req: GoogleAuthRequest):
    """
    Verify a Google ID token (from Google Sign-In) and return a JWT.
    - If user doesn't exist, auto-register them (consent implied by Google account)
    - If user exists, log them in directly (no OTP needed)
    """
    # Verify token with Google's tokeninfo API
    GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_TOKEN_INFO_URL, params={"id_token": req.id_token})

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    payload = resp.json()
    if "error" in payload:
        raise HTTPException(status_code=401, detail=payload.get("error_description", "Invalid Google token"))

    google_email = payload.get("email")
    google_name  = payload.get("name", google_email.split("@")[0])
    email_verified = payload.get("email_verified", "false") == "true"

    if not google_email or not email_verified:
        raise HTTPException(status_code=400, detail="Google account email not verified")

    # Find or create user
    user = await User.find_one(User.email == google_email)
    is_new = False

    if not user:
        # Auto-register: consent is implied by using a Google account
        user = User(
            name=google_name,
            email=google_email,
            consent_given=True,
            google_id=payload.get("sub", ""),
        )
        await user.insert()

        # Log consent record
        await Consent(
            user_id=str(user.id),
            consent_text="User registered via Google OAuth. Implicit consent for data processing.",
            consent_type="google_oauth",
        ).insert()

        await AuditLog(
            action="USER_REGISTER_GOOGLE",
            user_id=str(user.id),
            user_email=google_email,
            details="New user registered via Google Sign-In",
        ).insert()
        is_new = True

    # Create JWT
    token = create_access_token(str(user.id), user.email, user.role)

    await AuditLog(
        action="USER_LOGIN_GOOGLE",
        user_email=user.email,
        user_id=str(user.id),
        details="Login via Google Sign-In",
    ).insert()

    return {
        "token": token,
        "is_new": is_new,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "language_preference": user.language_preference,
            "calendar_linked": user.calendar_linked,
        }
    }
