"""
Eval Sets — data models
"""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field
import uuid


# ---------------------------------------------------------------------------
# Eval Set
# ---------------------------------------------------------------------------

class EvalSetItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    expected_answer: str | None = None
    notes: str | None = None


class EvalSetCreate(BaseModel):
    agent_id: str
    name: str
    description: str | None = None
    items: list[EvalSetItem] = []


class EvalSet(BaseModel):
    id: str
    agent_id: str
    name: str
    description: str | None = None
    items: list[EvalSetItem] = []
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Eval Run
# ---------------------------------------------------------------------------

class EvalRunResult(BaseModel):
    item_id: str
    question: str
    expected_answer: str | None = None
    answer: str | None = None
    rewritten_query: str | None = None
    chunks_used: int | None = None
    faithfulness: float | None = None
    answer_relevance: float | None = None
    context_precision: float | None = None
    answer_correctness: float | None = None   # set when expected_answer present
    latency_ms: int | None = None
    error: str | None = None


class EvalRunCreate(BaseModel):
    eval_set_id: str
    agent_id: str


class EvalRun(BaseModel):
    id: str
    eval_set_id: str
    agent_id: str
    eval_set_name: str | None = None
    status: Literal["pending", "running", "completed", "failed"] = "pending"
    rag_config_snapshot: dict | None = None
    results: list[EvalRunResult] = []
    created_at: str
    completed_at: str | None = None
    error: str | None = None


class EvalRunSummary(BaseModel):
    id: str
    eval_set_id: str
    eval_set_name: str | None = None
    agent_id: str
    status: Literal["pending", "running", "completed", "failed"]
    total_items: int = 0
    completed_items: int = 0
    avg_faithfulness: float | None = None
    avg_answer_relevance: float | None = None
    avg_context_precision: float | None = None
    avg_answer_correctness: float | None = None
    created_at: str
    completed_at: str | None = None
