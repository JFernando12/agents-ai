from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.utils import success_response, error_response
from app.services import agent_service
from app.models import User, AgentCreate, AgentUpdate, ImprovePromptRequest
from app.enums import ModelType

agent_router = APIRouter(tags=["agents"], prefix="/agents")

@agent_router.get("/models")
def get_models(current_user: User = Depends(get_current_user)):
    models = [model.value for model in ModelType]
    return JSONResponse(
        status_code=200,
        content=success_response(models, "Models retrieved successfully")
    )

@agent_router.get("/")
def get_agents(
    is_public: bool | None = None,
    current_user: User = Depends(get_current_user)
):
    agents = agent_service.get_all(is_public=is_public)
    
    return JSONResponse(
        status_code=200,
        content=success_response(agents, "Agents retrieved successfully")
    )

@agent_router.get("/{agent_id}")
def get_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    agent = agent_service.get_one(agent_id)
    if not agent:
        return JSONResponse(
            status_code=404,
            content=error_response("Agent not found")
        )
    
    return JSONResponse(
        status_code=200,
        content=success_response(agent, "Agent retrieved successfully")
    )

@agent_router.post("/")
def create_agent(
    agent_data: AgentCreate,
    current_user: User = Depends(get_current_user)
):
    new_agent_id = agent_service.create(
        agent_data=agent_data,
        user=current_user.email
    )

    if not new_agent_id:
        return JSONResponse(
            status_code=500,
            content=error_response("Failed to create agent")
        )

    return JSONResponse(
        status_code=201,
        content=success_response({"agent_id": new_agent_id}, "Agent created successfully")
    )

@agent_router.put("/{agent_id}")
def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    current_user: User = Depends(get_current_user)
):
    success = agent_service.update(
        agent_id=agent_id,
        agent_data=agent_data,
        user=current_user.email
    )

    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response("Agent not found")
        )

    return JSONResponse(
        status_code=200,
        content=success_response(None, "Agent updated successfully")
    )
    
@agent_router.delete("/{agent_id}")
def delete_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    success = agent_service.delete(
        agent_id=agent_id,
        user=current_user.email
    )

    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response("Agent not found")
        )

    return JSONResponse(
        status_code=200,
        content=success_response(None, "Agent deleted successfully")
    )

@agent_router.post("/improve-prompt")
def improve_prompt(
    request: ImprovePromptRequest,
    current_user: User = Depends(get_current_user)
):
    improved_prompt = agent_service.improve_prompt(request.prompt)
    
    return JSONResponse(
        status_code=200,
        content=success_response(
            {"improved_prompt": improved_prompt}, 
            "Prompt improved successfully"
        )
    )
