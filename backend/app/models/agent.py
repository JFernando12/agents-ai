from typing import Any
from pydantic import BaseModel
from datetime import datetime

class FrequentQuestion(BaseModel):
    id: str
    question: str
    order: int

class AgentTool(BaseModel):
    id: str
    enabled: bool = True

class Agent(BaseModel):
    id: str
    name: str
    description: str | None = None
    icon: str | None = None
    status: str
    custom_prompt: str | None = None
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    top_k: int | None = None
    is_public: bool | None = None
    tools: list[AgentTool] | None = None
    sub_agents: list[AgentTool] | None = None
    questions: list[FrequentQuestion] | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime

class AgentCreate(BaseModel):
    name: str
    description: str
    icon: str | None = None
    status: str | None = None
    custom_prompt: str
    model: str
    temperature: float
    max_tokens: int
    top_k: int
    is_public: bool
    tools: list[AgentTool]
    sub_agents: list[AgentTool] | None = None
    questions: list[FrequentQuestion] | None = None
    metadata: dict[str, Any] | None = None

class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    status: str | None = None
    custom_prompt: str | None = None
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    top_k: int | None = None
    is_public: bool | None = None
    tools: list[AgentTool] | None = None
    sub_agents: list[AgentTool] | None = None
    questions: list[FrequentQuestion] | None = None
    metadata: dict[str, Any] | None = None

class ImprovePromptRequest(BaseModel):
    prompt: str