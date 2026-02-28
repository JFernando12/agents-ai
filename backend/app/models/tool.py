from pydantic import BaseModel
from typing import Any
from datetime import datetime


class Tool(BaseModel):
    id: str
    section: str | None = None
    name: str           # snake_case function name used by the LLM
    display_name: str   # human-readable label
    description: str    # description sent to the LLM
    url: str
    method: str         # GET | POST | PUT | PATCH | DELETE
    headers: dict[str, str] | None = None
    input_schema: dict[str, Any]  # JSON Schema { type, properties, required }
    all_tools: str | None = None  # GSI partition key for get_all() queries
    created_at: datetime
    updated_at: datetime


class ToolCreate(BaseModel):
    section: str | None = None
    name: str
    display_name: str
    description: str
    url: str
    method: str
    headers: dict[str, str] | None = None
    input_schema: dict[str, Any]

class ToolUpdate(BaseModel):
    section: str | None = None
    name: str | None = None
    display_name: str | None = None
    description: str | None = None
    url: str | None = None
    method: str | None = None
    headers: dict[str, str] | None = None
    input_schema: dict[str, Any] | None = None


# Legacy models kept for backward compatibility
class ToolConfig(BaseModel):
    name: str
    description: str
    input_schema: dict[str, Any]
    type: str = "api"
    config: dict[str, Any] | None = None


class ToolResult(BaseModel):
    tool_name: str
    success: bool
    result: Any
    error: str | None = None


class ParseToolDocsRequest(BaseModel):
    docs: str


class ToolPage(BaseModel):
    """Paginated tools response (only returned when ?limit= is used)."""
    items: list[Tool]
    next_cursor: str | None = None
    count: int