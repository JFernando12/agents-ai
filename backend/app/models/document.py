from datetime import datetime
from typing import Any
from pydantic import BaseModel

class Document(BaseModel):
    id: str
    agent_id: str
    file_name: str
    status: str
    s3_key: str
    processed_chunks: int | None = None
    error_message: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime

class DocumentUpload(BaseModel):
    agent_id: str
    file_name: str
    s3_key: str | None = None

class DocumentUpdate(BaseModel):
    agent_id: str
    file_name: str
    status: str | None = None
    s3_key: str
    processed_chunks: int | None = None
    error_message: str | None = None
    metadata: dict[str, Any] | None = None
