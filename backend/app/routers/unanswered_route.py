from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.middleware import get_current_user
from app.utils import success_response, error_response
from app.services import unanswered_service
from app.models import (
    User, 
    UnansweredUpdate,
    UnansweredMarkFed,
    UnansweredStatusUpdate,
    UnansweredCommentRequest
)

unanswered_router = APIRouter(tags=["unanswered"], prefix="/unanswered")

@unanswered_router.get("/")
def get_unanswered_questions(
    status: Optional[str] = Query(default=None, description="Filter by status (pending, reviewed, resolved, dismissed)"),
    agentId: Optional[str] = Query(default=None, description="Filter by agent ID"),
    wasFedToAgent: Optional[bool] = Query(default=None, description="Filter by whether info was fed (true/false)"),
    startDate: Optional[str] = Query(default=None, description="Filter questions after this date (ISO format)"),
    endDate: Optional[str] = Query(default=None, description="Filter questions before this date (ISO format)"),
    current_user: User = Depends(get_current_user)
):
    questions = unanswered_service.get_all_with_filters(
        status=status,
        agent_id=agentId,
        was_fed_to_agent=wasFedToAgent,
        start_date=startDate,
        end_date=endDate
    )
    
    return JSONResponse(
        content=success_response(questions),
        status_code=200
    )

@unanswered_router.get("/{question_id}")
def get_question(
    question_id: str,
    current_user: User = Depends(get_current_user)
):
    question = unanswered_service.get_question_by_id(question_id)
    
    if not question:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Question not found.")
        )
    
    return JSONResponse(
        content=success_response(question),
        status_code=200
    )

@unanswered_router.patch("/{question_id}")
def update_question(
    question_id: str,
    update_data: UnansweredUpdate,
    current_user: User = Depends(get_current_user)
):
    success = unanswered_service.update_question(question_id, update_data)
    
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Question not found or update failed.")
        )
    
    # Get the updated question to return
    question = unanswered_service.get_question_by_id(question_id)
    
    return JSONResponse(
        status_code=200,
        content=success_response(question)
    )

@unanswered_router.patch("/{question_id}/mark-fed")
def mark_question_as_fed(
    question_id: str,
    mark_fed_data: UnansweredMarkFed,
    current_user: User = Depends(get_current_user)
):
    success = unanswered_service.mark_as_fed(question_id, mark_fed_data)
    
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Question not found or update failed.")
        )
    
    # Get the updated question to return
    question = unanswered_service.get_question_by_id(question_id)
    
    return JSONResponse(
        status_code=200,
        content=success_response(question)
    )

@unanswered_router.patch("/{question_id}/status")
def update_question_status(
    question_id: str,
    status_data: UnansweredStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    success = unanswered_service.update_status(question_id, status_data)
    
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Question not found or update failed.")
        )
    
    # Get the updated question to return
    question = unanswered_service.get_question_by_id(question_id)
    
    return JSONResponse(
        status_code=200,
        content=success_response(question)
    )

@unanswered_router.post("/{question_id}/comments")
def add_comment_to_question(
    question_id: str,
    comment_request: UnansweredCommentRequest,
    current_user: User = Depends(get_current_user)
):
    # Verify question exists
    question = unanswered_service.get_question_by_id(question_id)
    if not question:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Question not found.")
        )
    
    # Create the comment
    comment_id = unanswered_service.add_comment_to_question(
        question_id=question_id,
        comment_request=comment_request,
        user=current_user.email
    )
    
    # Get the created comment to return
    comment = unanswered_service.get_comment_by_id(comment_id)
    
    return JSONResponse(
        content=success_response(comment),
        status_code=201
    )

@unanswered_router.get("/{question_id}/comments")
def get_question_comments(
    question_id: str,
    current_user: User = Depends(get_current_user)
):
    result = unanswered_service.get_comments_by_question(question_id, limit=100)
    comments = result.get('comments', [])
    
    return JSONResponse(
        content=success_response(comments),
        status_code=200
    )

@unanswered_router.delete("/{question_id}")
def delete_question(
    question_id: str,
    current_user: User = Depends(get_current_user)
):
    success = unanswered_service.delete_question(question_id)
    
    if not success:
        return JSONResponse(
            status_code=404,
            content=error_response(message="Question not found or delete failed.")
        )
    
    return JSONResponse(
        status_code=200,
        content=success_response(message="Question deleted successfully")
    )


