"""
Email OTP Service

WHY Email OTP instead of passwords?
- No password storage = reduced attack surface
- Each OTP is single-use and time-limited (10 minutes)
- Users don't need to remember passwords
- Follows modern passwordless authentication best practices
"""
import random
import hashlib
import smtplib
import ssl
import traceback
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings


def generate_otp() -> str:
    """Generate a 6-digit random OTP."""
    return str(random.randint(100000, 999999))


def hash_otp(otp: str) -> str:
    """One-way hash the OTP before storing."""
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp_hash(otp: str, hashed: str) -> bool:
    """Verify OTP against stored hash."""
    return hashlib.sha256(otp.encode()).hexdigest() == hashed


def _build_otp_email(to_email: str, otp: str) -> MIMEMultipart:
    """Build a beautiful HTML OTP email."""
    msg = MIMEMultipart("alternative")
    # Gmail requires From to match the authenticated SMTP_USER
    sender = settings.SMTP_USER if settings.SMTP_USER else settings.FROM_EMAIL
    msg["From"] = f"NyayaGuide <{sender}>"
    msg["To"] = to_email
    msg["Subject"] = f"{otp} is your NyayaGuide verification code"

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:linear-gradient(135deg,#1e293b,#0f172a);
                      border:1px solid rgba(255,255,255,0.1);
                      border-radius:20px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);
                       padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:12px;
                             padding:10px 14px;margin-right:10px;">
                    <span style="font-size:24px;">⚖️</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:24px;font-weight:800;color:#fff;
                                 letter-spacing:-0.5px;">NyayaGuide</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#f1f5f9;font-size:22px;font-weight:700;
                         margin:0 0 8px;">Your Verification Code</h2>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 32px;line-height:1.6;">
                Use the code below to verify your identity. It expires in
                <strong style="color:#f1f5f9;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.15));
                          border:1px solid rgba(59,130,246,0.3);border-radius:16px;
                          padding:28px;text-align:center;margin-bottom:32px;">
                <p style="color:#94a3b8;font-size:12px;font-weight:600;
                           text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">
                  One-Time Password
                </p>
                <p style="color:#f1f5f9;font-size:48px;font-weight:800;
                           letter-spacing:12px;margin:0;font-family:monospace;">
                  {otp}
                </p>
              </div>

              <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
                🔒 If you didn't request this code, you can safely ignore this email.
                Your account is secure.
              </p>
              <p style="color:#64748b;font-size:13px;margin:0;">
                ⚠️ Never share this code with anyone, including NyayaGuide support.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.05);
                       padding:20px 40px;text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">
                © 2025 NyayaGuide · DPDP Act Compliant · 
                <a href="#" style="color:#3b82f6;text-decoration:none;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    plain = f"Your NyayaGuide verification code is: {otp}\n\nThis code expires in 10 minutes.\nIf you didn't request this, please ignore this email.\n\n- NyayaGuide Team"

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))
    return msg


def _send_otp_sync(email: str, otp: str):
    """
    Synchronous fallback email sender using smtplib.
    Used when aiosmtplib fails.
    """
    msg = _build_otp_email(email, otp)
    port = int(settings.SMTP_PORT)

    try:
        if port == 465:
            # SSL/TLS connection
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_HOST, port, context=context) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.sendmail(settings.SMTP_USER, email, msg.as_string())
        else:
            # STARTTLS connection (port 587)
            with smtplib.SMTP(settings.SMTP_HOST, port) as server:
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.sendmail(settings.SMTP_USER, email, msg.as_string())
        print(f"[EMAIL] ✅ Successfully sent OTP email to {email} (sync fallback)")
        return True
    except Exception as e:
        print(f"[EMAIL] ❌ Sync fallback also failed: {e}")
        traceback.print_exc()
        return False


async def send_otp_email(email: str, otp: str):
    """
    Send OTP to user's email using real SMTP (Gmail/any SMTP).
    Tries aiosmtplib first, falls back to sync smtplib.
    """
    # Always log to console (useful for debugging)
    print(f"\n{'='*50}")
    print(f"[EMAIL] OTP for {email}: {otp}")
    print(f"[EMAIL] SMTP_HOST={settings.SMTP_HOST}, SMTP_PORT={settings.SMTP_PORT}")
    print(f"[EMAIL] SMTP_USER={settings.SMTP_USER}")
    print(f"{'='*50}\n")

    # Only send real email if SMTP credentials are configured
    if not settings.SMTP_USER or settings.SMTP_USER in ("your-email@gmail.com", ""):
        print("[EMAIL] ⚠️ SMTP not configured — OTP shown in console only.")
        print("[EMAIL] Please set SMTP_USER and SMTP_PASS in your .env file.")
        return

    if not settings.SMTP_PASS or settings.SMTP_PASS in ("your-app-password", ""):
        print("[EMAIL] ⚠️ SMTP_PASS not configured — OTP shown in console only.")
        print("[EMAIL] Please set a valid App Password in your .env file.")
        return

    # Try async first (aiosmtplib)
    try:
        msg = _build_otp_email(email, otp)
        port = int(settings.SMTP_PORT)

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=port,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASS,
            start_tls=(port == 587),
            use_tls=(port == 465),
        )
        print(f"[EMAIL] ✅ Successfully sent OTP email to {email}")
        return
    except Exception as e:
        print(f"[EMAIL] ⚠️ aiosmtplib failed: {e}")
        traceback.print_exc()
        print("[EMAIL] Trying synchronous fallback...")

    # Fallback to synchronous smtplib
    _send_otp_sync(email, otp)
