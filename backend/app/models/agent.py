from typing import Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class FrequentQuestion(BaseModel):
    id: str
    question: str
    order: int

class AgentTool(BaseModel):
    id: str
    enabled: bool = True

class RAGConfig(BaseModel):
    """Per-agent RAG configuration. All fields are optional and fall back to env defaults."""
    enabled: bool = True
    embedding_model: str = "amazon.titan-embed-text-v2:0"
    top_k: int = Field(default=5, ge=1, le=50)
    score_threshold: float | None = Field(default=None, ge=0.0, le=1.0)
    chunk_size: int = Field(default=1500, ge=200, le=8000)
    chunk_overlap: int = Field(default=200, ge=0, le=1000)
    context_max_chars: int = Field(default=8000, ge=500, le=32000)
    search_type: Literal["semantic"] = "semantic"
    # ── Query Rewriting (Fase 2) ───────────────────────────────────────────
    query_rewriting_enabled: bool = False
    query_rewriting_model: str = "amazon.nova-micro-v1:0"

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
    rag_config: RAGConfig | None = None
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
    rag_config: RAGConfig | None = None

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
    rag_config: RAGConfig | None = None

class ImprovePromptRequest(BaseModel):
    prompt: str