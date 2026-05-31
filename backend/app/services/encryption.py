"""
AES-256 Encryption Service

WHY AES-256?
- Industry standard symmetric encryption
- Required by DPDP Act for sensitive personal data at rest
- Same key used to encrypt and decrypt (symmetric)

We use Fernet (built on AES-128-CBC) from the cryptography library for simplicity;
for true AES-256, we use AES-GCM with a 256-bit key.
"""
import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings


def _get_key() -> bytes:
    """Derive a 32-byte (256-bit) key from the config."""
    raw = settings.ENCRYPTION_KEY.encode()
    # Pad or hash to exactly 32 bytes
    try:
        key = base64.urlsafe_b64decode(raw)
    except Exception:
        key = raw
    if len(key) < 32:
        key = key.ljust(32, b'\0')
    return key[:32]


def encrypt_field(plaintext: str) -> str:
    """Encrypt a string field using AES-256-GCM. Returns base64-encoded ciphertext."""
    if not plaintext:
        return plaintext
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
    # Store nonce + ciphertext together
    return base64.urlsafe_b64encode(nonce + ciphertext).decode('utf-8')


def decrypt_field(encrypted: str) -> str:
    """Decrypt an AES-256-GCM encrypted field."""
    if not encrypted:
        return encrypted
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.urlsafe_b64decode(encrypted.encode('utf-8'))
    nonce = raw[:12]
    ciphertext = raw[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode('utf-8')
