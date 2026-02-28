import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.models import User
from app.services.execution_trace_service import execution_trace_service
from app.utils import success_response

execution_trace_router = APIRouter(tags=["execution-traces"], prefix="/execution-traces")


@execution_trace_router.get("/")
def list_traces(
    agent_id: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    lastKey: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    parsed_last_key = json.loads(lastKey) if lastKey else None
    data = execution_trace_service.get_all(
        account_id=current_user.account_id,
        agent_id=agent_id,
        limit=limit,
        last_key=parsed_last_key,
    )
    return JSONResponse(
        status_code=200,
        content=success_response(data, "Execution traces retrieved successfully"),
    )


@execution_trace_router.get("/{trace_id}")
def get_trace(
    trace_id: str,
    current_user: User = Depends(get_current_user),
):
    trace = execution_trace_service.get_by_id(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Execution trace not found")
    return JSONResponse(
        status_code=200,
        content=success_response(trace, "Execution trace retrieved successfully"),
    )
