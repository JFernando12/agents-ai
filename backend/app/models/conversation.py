from typing import Any
from datetime import datetime
from pydantic import BaseModel

class Conversation(BaseModel):
    id: str
    title: str | None = None
    user: str
    agent_id: str
    created_at: datetime
    updated_at: datetime

class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime
    metadata: dict[str, Any] | None = None
    context_data: dict[str, Any] | None = None
    attachments: list[str] | None = None

class ConversationCreate(BaseModel):
    user: str
    agent_id: str
    title: str