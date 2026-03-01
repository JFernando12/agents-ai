import json

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.models import User
from app.services.rag_trace_service import rag_trace_service
from app.utils import success_response, error_response

rag_trace_router = APIRouter(tags=["rag-traces"], prefix="/rag-traces")


@rag_trace_router.get("/")
def list_rag_traces(
    agent_id: str = Query(..., description="Agent ID to fetch RAG traces for"),
    limit: int = Query(default=50, ge=1, le=200),
    lastKey: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """Return paginated RAG traces for a given agent."""
    parsed_last_key = json.loads(lastKey) if lastKey else None
    data = rag_trace_service.get_traces(
        agent_id=agent_id,
        limit=limit,
        last_key=parsed_last_key,
    )
    return JSONResponse(
        status_code=200,
        content=success_response(data.model_dump(mode="json"), "RAG traces retrieved"),
    )


@rag_trace_router.get("/metrics")
def get_rag_metrics(
    agent_id: str = Query(..., description="Agent ID to compute metrics for"),
    current_user: User = Depends(get_current_user),
):
    """Return aggregate RAG quality metrics for a given agent."""
    metrics = rag_trace_service.get_metrics(agent_id=agent_id)
    return JSONResponse(
        status_code=200,
        content=success_response(metrics.model_dump(mode="json"), "RAG metrics retrieved"),
    )
