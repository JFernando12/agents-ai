from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.utils import success_response, error_response
from app.services import conversation_service
from app.models import User, ConversationCreate

conversation_router = APIRouter(tags=["conversations"], prefix="/conversations")

@conversation_router.get("/all")
def get_all_conversations(
    agent_id: str | None = Query(default=None),
    current_user: User = Depends(get_current_user)
):
    conversations = conversation_service.get_all_by_account(agent_id=agent_id)
    return JSONResponse(
        content=success_response(conversations),
        status_code=200
    )

@conversation_router.get("/")
def get_conversations(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    conversations = conversation_service.get_all(user=current_user.email, agent_id=agent_id)
    
    return JSONResponse(
        content=success_response(conversations),
        status_code=200
    )

@conversation_router.post("/")
def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    conversation_id = conversation_service.create(conversation_data)
    
    return JSONResponse(
        content=success_response({"conversation_id": conversation_id}),
        status_code=201
    )

@conversation_router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    success = conversation_service.delete(conversation_id)
    
    if not success:
        return JSONResponse(
            status_code=400,
            content=error_response(message="Failed to delete conversation.")
        )
    
    return JSONResponse(
        status_code=200,
        content=success_response(message="Conversation deleted successfully.")
    )