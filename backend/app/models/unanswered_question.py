from datetime import datetime
from pydantic import BaseModel

class Unanswered(BaseModel):
    id: str
    question: str
    agent_id: str
    agent_name: str
    user: str
    timestamp: datetime
    context: str | None = None
    attempted_response: str | None = None
    status: str  # pending, resolved, reviewing
    was_fed_to_agent: bool = False
    fed_date: datetime | None = None
    comment: str | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    category: str | None = None
    tags: list[str] | None = None
    created_at: datetime
    updated_at: datetime

class UnansweredCreate(BaseModel):
    question: str
    agent_id: str
    agent_name: str
    user: str
    context: str | None = None
    attempted_response: str | None = None
    category: str | None = None
    tags: list[str] | None = None

class UnansweredUpdate(BaseModel):
    question: str | None = None
    status: str | None = None
    was_fed_to_agent: bool | None = None
    comment: str | None = None
    reviewed_by: str | None = None
    reviewed_at: str | None = None
    category: str | None = None
    tags: list[str] | None = None

class UnansweredMarkFed(BaseModel):
    was_fed_to_agent: bool
    fed_date: str | None = None
    comment: str | None = None

class UnansweredStatusUpdate(BaseModel):
    status: str
    comment: str | None = None
    reviewed_at: str | None = None

class UnansweredCommentRequest(BaseModel):
    comment: str

class UnansweredComment(BaseModel):
    id: str
    question_id: str
    user: str
    comment: str
    created_at: datetime
    updated_at: datetime

class UnansweredCommentCreate(BaseModel):
    question_id: str
    user: str
    comment: str
