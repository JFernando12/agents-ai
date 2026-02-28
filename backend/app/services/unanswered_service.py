from typing import Optional
from app.repositories import unanswered_repository
from app.models import (
    UnansweredCreate,
    UnansweredUpdate,
    UnansweredCommentCreate,
    UnansweredMarkFed,
    UnansweredStatusUpdate,
    UnansweredCommentRequest
)

class UnansweredService:
    def create_question(self, question_data: UnansweredCreate) -> str:
        question_id = unanswered_repository.create_question(question_data)
        return question_id
    
    def get_question_by_id(self, question_id: str) -> Optional[dict]:
        question = unanswered_repository.get_question_by_id(question_id)
        if not question:
            return None
        return question.model_dump(mode='json')
    
    def get_questions_by_agent(
        self, 
        agent_id: str, 
        limit: int = 50,
        last_evaluated_key: Optional[dict] = None
    ) -> dict:
        questions, next_key = unanswered_repository.get_questions_by_agent(
            agent_id, limit, last_evaluated_key
        )
        return {
            'questions': [q.model_dump(mode='json') for q in questions],
            'last_evaluated_key': next_key
        }
    
    def get_questions_by_status(
        self, 
        status: str, 
        limit: int = 50,
        last_evaluated_key: Optional[dict] = None
    ) -> dict:
        questions, next_key = unanswered_repository.get_questions_by_status(
            status, limit, last_evaluated_key
        )
        return {
            'questions': [q.model_dump(mode='json') for q in questions],
            'last_evaluated_key': next_key
        }
    
    def get_questions_by_user(
        self, 
        user: str, 
        limit: int = 50,
        last_evaluated_key: Optional[dict] = None
    ) -> dict:
        questions, next_key = unanswered_repository.get_questions_by_user(
            user, limit, last_evaluated_key
        )
        return {
            'questions': [q.model_dump(mode='json') for q in questions],
            'last_evaluated_key': next_key
        }
    
    def update_question(self, question_id: str, update_data: UnansweredUpdate) -> bool:
        success = unanswered_repository.update_question(question_id, update_data)
        return success
    
    def delete_question(self, question_id: str) -> bool:
        success = unanswered_repository.delete_question(question_id)
        return success
    
    def create_comment(self, comment_data: UnansweredCommentCreate) -> str:
        comment_id = unanswered_repository.create_comment(comment_data)
        return comment_id
    
    def get_comment_by_id(self, comment_id: str) -> Optional[dict]:
        comment = unanswered_repository.get_comment_by_id(comment_id)
        if not comment:
            return None
        return comment.model_dump(mode='json')
    
    def get_comments_by_question(
        self, 
        question_id: str,
        limit: int = 50,
        last_evaluated_key: Optional[dict] = None
    ) -> dict:
        comments, next_key = unanswered_repository.get_comments_by_question(
            question_id, limit, last_evaluated_key
        )
        return {
            'comments': [c.model_dump(mode='json') for c in comments],
            'last_evaluated_key': next_key
        }
    
    def delete_comment(self, comment_id: str) -> bool:
        success = unanswered_repository.delete_comment(comment_id)
        return success
    
    def get_all_with_filters(
        self,
        status: Optional[str] = None,
        agent_id: Optional[str] = None,
        was_fed_to_agent: Optional[bool] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> list[dict]:
        questions = unanswered_repository.get_all_questions_with_filters(
            status=status,
            agent_id=agent_id,
            was_fed_to_agent=was_fed_to_agent,
            start_date=start_date,
            end_date=end_date
        )
        return [q.model_dump(mode='json') for q in questions]
    
    def mark_as_fed(self, question_id: str, mark_fed_data: UnansweredMarkFed) -> bool:
        update_data = UnansweredUpdate(
            was_fed_to_agent=mark_fed_data.was_fed_to_agent,
            comment=mark_fed_data.comment
        )
        # Note: fedDate is set automatically in repository when was_fed_to_agent is True
        success = unanswered_repository.update_question(question_id, update_data)
        return success
    
    def update_status(self, question_id: str, status_data: UnansweredStatusUpdate) -> bool:
        update_data = UnansweredUpdate(
            status=status_data.status,
            comment=status_data.comment,
            reviewed_at=status_data.reviewed_at
        )
        success = unanswered_repository.update_question(question_id, update_data)
        return success
    
    def add_comment_to_question(self, question_id: str, comment_request: UnansweredCommentRequest, user: str) -> str:
        comment_data = UnansweredCommentCreate(
            question_id=question_id,
            user=user,
            comment=comment_request.comment
        )
        comment_id = unanswered_repository.create_comment(comment_data)
        return comment_id

unanswered_service = UnansweredService()
