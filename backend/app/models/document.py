from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class DocumentModel(Document):
    """
    Represents an uploaded document (FIR, ID card, notice, contract, etc.)
    The actual file is stored in S3/MinIO; this holds metadata + encryption key.
    """
    user_id: str
    file_name: str
    file_type: str                        # e.g., "pdf", "jpg"
    storage_path: str                     # S3 key / path
    encrypted_key: str                    # AES key used for this file
    extracted_metadata: Optional[dict] = None  # AI-extracted fields (JSON)
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "documents"
        indexes = ["user_id"]
