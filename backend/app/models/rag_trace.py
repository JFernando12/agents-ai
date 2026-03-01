from datetime import datetime
from pydantic import BaseModel


class RAGTraceCreate(BaseModel):
    agent_id: str
    conversation_id: str | None = None
    query: str
    rewritten_query: str | None = None
    chunks_retrieved: int
    chunks_used: int
    avg_score: float
    max_score: float
    min_score: float
    latency_ms: int
    embedding_model: str
    top_k_requested: int
    score_threshold: float | None
    documents_hit: list[str]
    # Fase 4 — eval scores (populated asynchronously after save)
    faithfulness: float | None = None
    answer_relevance: float | None = None
    context_precision: float | None = None
    # Fase 5 — hybrid search flag
    hybrid_search_used: bool = False


class RAGTrace(BaseModel):
    id: str
    agent_id: str
    conversation_id: str | None = None
    query: str
    rewritten_query: str | None = None
    chunks_retrieved: int
    chunks_used: int
    avg_score: float
    max_score: float
    min_score: float
    latency_ms: int
    embedding_model: str
    top_k_requested: int
    score_threshold: float | None
    documents_hit: list[str]
    # Fase 4 — eval scores
    faithfulness: float | None = None
    answer_relevance: float | None = None
    context_precision: float | None = None
    # Fase 5 — hybrid search flag
    hybrid_search_used: bool = False
    created_at: datetime


class RAGTracesResponse(BaseModel):
    items: list[RAGTrace]
    last_key: dict | None = None
    has_more: bool


class RAGMetrics(BaseModel):
    agent_id: str
    total_queries: int
    queries_with_results: int
    queries_without_results: int
    hit_rate: float
    avg_chunks_retrieved: float
    avg_chunks_used: float
    avg_score: float
    avg_latency_ms: float
    top_documents: list[dict]
    # Fase 4 — avg eval scores (None when no evaluated traces yet)
    avg_faithfulness: float | None = None
    avg_answer_relevance: float | None = None
    avg_context_precision: float | None = None
    evaluated_traces: int = 0
