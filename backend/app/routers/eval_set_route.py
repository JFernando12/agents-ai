from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.utils import success_response, error_response
from app.services.eval_set_service import eval_set_service
from app.models.eval_set import EvalSetCreate
from app.models import User

eval_set_router = APIRouter(tags=["eval-sets"], prefix="/eval-sets")


# ---------------------------------------------------------------------------
# EvalSet CRUD
# ---------------------------------------------------------------------------

@eval_set_router.get("/")
def list_eval_sets(
    agent_id: str,
    current_user: User = Depends(get_current_user),
):
    items = eval_set_service.list_by_agent(agent_id)
    return JSONResponse(
        content=success_response([i.model_dump(mode="json") for i in items]),
        status_code=200,
    )


@eval_set_router.post("/")
def create_eval_set(
    data: EvalSetCreate,
    current_user: User = Depends(get_current_user),
):
    eval_set = eval_set_service.create(data)
    return JSONResponse(
        content=success_response(eval_set.model_dump(mode="json")),
        status_code=201,
    )


@eval_set_router.get("/{eval_set_id}")
def get_eval_set(
    eval_set_id: str,
    current_user: User = Depends(get_current_user),
):
    eval_set = eval_set_service.get(eval_set_id)
    if not eval_set:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Eval set not found."),
        )
    return JSONResponse(
        content=success_response(eval_set.model_dump(mode="json")),
        status_code=200,
    )


@eval_set_router.put("/{eval_set_id}")
def update_eval_set(
    eval_set_id: str,
    data: EvalSetCreate,
    current_user: User = Depends(get_current_user),
):
    updated = eval_set_service.update(eval_set_id, data)
    if not updated:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Eval set not found."),
        )
    return JSONResponse(
        content=success_response(updated.model_dump(mode="json")),
        status_code=200,
    )


@eval_set_router.delete("/{eval_set_id}")
def delete_eval_set(
    eval_set_id: str,
    current_user: User = Depends(get_current_user),
):
    success = eval_set_service.delete(eval_set_id)
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Eval set not found."),
        )
    return JSONResponse(
        content=success_response(message="Eval set deleted."),
        status_code=200,
    )


# ---------------------------------------------------------------------------
# EvalRun
# ---------------------------------------------------------------------------

@eval_set_router.post("/{eval_set_id}/runs")
def trigger_run(
    eval_set_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        run = eval_set_service.trigger_run(eval_set_id)
        return JSONResponse(
            content=success_response(run.model_dump(mode="json")),
            status_code=202,
        )
    except ValueError as exc:
        return JSONResponse(
            status_code=404,
            content=error_response(message=str(exc)),
        )


@eval_set_router.get("/{eval_set_id}/runs")
def list_runs(
    eval_set_id: str,
    current_user: User = Depends(get_current_user),
):
    summaries = eval_set_service.list_runs(eval_set_id)
    return JSONResponse(
        content=success_response([s.model_dump(mode="json") for s in summaries]),
        status_code=200,
    )


@eval_set_router.get("/runs/{run_id}")
def get_run(
    run_id: str,
    current_user: User = Depends(get_current_user),
):
    run = eval_set_service.get_run(run_id)
    if not run:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Eval run not found."),
        )
    return JSONResponse(
        content=success_response(run.model_dump(mode="json")),
        status_code=200,
    )
