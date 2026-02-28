from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.utils import success_response
from app.services import log_service
from app.models import User

log_router = APIRouter(tags=["logs"], prefix="/logs")

@log_router.get("/")
def get_logs(
    current_user: User = Depends(get_current_user)
):
    logs = log_service.get_all(account_id=current_user.account_id)
    
    return JSONResponse(
        status_code=200,
        content=success_response(logs, "Logs retrieved successfully")
    )