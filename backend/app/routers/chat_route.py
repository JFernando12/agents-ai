from fastapi import APIRouter, Depends, Form, File, UploadFile
from fastapi.responses import JSONResponse

from app.middleware import get_chat_user
from app.utils import success_response, error_response
from app.models import User, ChatRequest
from app.services import chat_service

chat_router = APIRouter(tags=["chat"], prefix="/chat")

@chat_router.post("/")
def converse(
    chat_data: ChatRequest,
    current_user: User = Depends(get_chat_user),
):
    result = chat_service.chat(user=current_user, chat_data=chat_data, file=None)

    if not result:
        return JSONResponse(
            content=error_response(message="Failed to process chat request"),
            status_code=400
        )

    return JSONResponse(
        content=success_response(data=result),
        status_code=200
    )