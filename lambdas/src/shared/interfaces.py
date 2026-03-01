from typing import Any
from pydantic import BaseModel
from datetime import datetime
from .enums import DocumentStatus

class Document(BaseModel):
    id: str
    agent_id: str
    file_name: str
    category: str | None = None
    medio: str | None = None
    link: str | None = None
    status: DocumentStatus
    s3_key: str
    processed_chunks: int | None = None
    error_message: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime