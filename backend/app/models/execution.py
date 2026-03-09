from datetime import datetime

from pydantic import BaseModel

from app.models.agent import AgentTool


class AgentConfig(BaseModel):
    model: str
    custom_prompt: str | None
    temperature: float
    max_tokens: int
    top_k: int | None
    tools: list[AgentTool] | None


class AgentResponse(BaseModel):
    agent_name: str
    response: str
    configuration: AgentConfig
    contexts: list = []
    wa_messages_queued: int = 0


# ── Execution trace models ────────────────────────────────────────────────────

class ToolCallTrace(BaseModel):
    tool_name: str
    tool_use_id: str
    input: dict
    output: str | None = None
    success: bool
    error: str | None = None
    iteration: int


class ExecutionTraceCreate(BaseModel):
    agent_id: str
    agent_name: str
    user: str
    account_id: str = "default"
    conversation_id: str | None = None
    user_message: str
    final_response: str
    tool_calls: list[ToolCallTrace] = []
    total_iterations: int
    duration_ms: int
    was_answered: bool


class ExecutionTrace(BaseModel):
    id: str
    agent_id: str
    agent_name: str
    user: str
    account_id: str
    conversation_id: str | None = None
    user_message: str
    final_response: str
    tool_calls: list[ToolCallTrace] = []
    total_iterations: int
    duration_ms: int
    was_answered: bool
    created_at: datetime


class ExecutionTracesResponse(BaseModel):
    items: list[ExecutionTrace]
    lastKey: dict | None = None
    hasMore: bool
