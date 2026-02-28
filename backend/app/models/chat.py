from typing import Any
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    agent_id: str | None = None
    conversation_id: str | None = None
    type: str | None = "normal"
    context: dict[str, Any] | None = None