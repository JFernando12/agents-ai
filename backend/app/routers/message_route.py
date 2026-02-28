from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.utils import success_response
from app.services import message_service
from app.models import User

message_router = APIRouter(tags=["messages"], prefix="/messages")

@message_router.get("/")
def get_messages(
    conversation_id: str,
    limit: int | None = 50,
    current_user: User = Depends(get_current_user)
):
    messages = message_service.get_all(
        conversation_id=conversation_id,
        limit=limit
    )
    
    return JSONResponse(
        status_code=200,
        content=success_response(messages, "Logs retrieved successfully")
    )