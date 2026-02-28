from datetime import datetime
from pydantic import BaseModel
from app.models import Agent

class Log(BaseModel):
    id: str
    user: str
    agent_id: str
    agent_name: str
    action: str
    agent_before_state: Agent | None = None
    agent_after_state: Agent | None = None
    detail: str | None = None
    created_at: datetime

class CreateLog(BaseModel):
    user: str
    agent_id: str
    agent_name: str
    action: str
    account_id: str = 'default'
    agent_before_state: Agent | None = None
    agent_after_state: Agent | None = None
    detail: str | None = None

class LogsResponse(BaseModel):
    items: list[Log]
    lastKey: dict | None = None
    pageSize: int
    hasMore: bool