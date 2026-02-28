import uuid
from typing import Optional, Any
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr

from app.config import env
from app.models import (
    Unanswered, 
    UnansweredCreate,
    UnansweredUpdate,
    UnansweredComment,
    UnansweredCommentCreate
)
from .base_dynamodb_repository import BaseDynamoDBRepository

class UnansweredRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.question_table = self.dynamodb.Table(env.unanswered_table) # type: ignore
        self.comment_table = self.dynamodb.Table(env.unanswered_comment_table) # type: ignore
    
    # Unanswered methods
    def create_question(self, question_data: UnansweredCreate) -> str:
        question_id = str(uuid.uuid4())
        current_time = datetime.now()
        current_time_iso = current_time.isoformat()
        
        item = {
            'id': question_id,
            'question': question_data.question,
            'agent_id': question_data.agent_id,
            'agent_name': question_data.agent_name,
            'user': question_data.user,
            'timestamp': current_time_iso,
            'status': 'pending',
            'was_fed_to_agent': False,
            'created_at': current_time_iso,
            'updated_at': current_time_iso
        }
        
        if question_data.context:
            item['context'] = question_data.context
        if question_data.attempted_response:
            item['attempted_response'] = question_data.attempted_response
        if question_data.category:
            item['category'] = question_data.category
        if question_data.tags:
            item['tags'] = question_data.tags
        
        self.question_table.put_item(Item=item)
        return question_id
    
    def get_question_by_id(self, question_id: str) -> Optional[Unanswered]:
        response = self.question_table.get_item(
            Key={'id': question_id}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        return self._item_to_question(item)
    
    def get_questions_by_agent(
        self, 
        agent_id: str, 
        limit: int = 50,
        last_evaluated_key: Optional[dict] = None
    ) -> tuple[list[Unanswered], Optional[dict]]:
        query_params = {
            'IndexName': 'AgentIdTimestampIndex',
            'KeyConditionExpression': Key('agent_id').eq(agent_id),
            'ScanIndexForward': False,
            'Limit': limit
        }
        
        if last_evaluated_key:
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        response = self.question_table.query(**query_params)
        
        questions = [self._item_to_question(item) for item in response.get('Items', [])]
        next_key = response.get('LastEvaluatedKey')
        
        return questions, next_key
    
    def get_questions_by_status(
        self, 
        status: str, 
        limit: int = 50,
        last_evaluated_key: Optional[dict] = None
    ) -> tuple[list[Unanswered], Optional[dict]]:
        query_params = {
            'IndexName': 'StatusTimestampIndex',
            'KeyConditionExpression': Key('status').eq(status),
            'ScanIndexForward': False,
            'Limit': limit
        }
        
        if last_evaluated_key:
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        response = self.question_table.query(**query_params)
        
        questions = [self._item_to_question(item) for item in response.get('Items', [])]
        next_key = response.get('LastEvaluatedKey')
        
        return questions, next_key
    
    def get_questions_by_user(
        self, 
        user: str, 
        limit: int = 50,
        last_evaluated_key: Optional[dict] = None
    ) -> tuple[list[Unanswered], Optional[dict]]:
        query_params = {
            'IndexName': 'UserTimestampIndex',
            'KeyConditionExpression': Key('user').eq(user),
            'ScanIndexForward': False,
            'Limit': limit
        }
        
        if last_evaluated_key:
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        response = self.question_table.query(**query_params)
        
        questions = [self._item_to_question(item) for item in response.get('Items', [])]
        next_key = response.get('LastEvaluatedKey')
        
        return questions, next_key
    
    def update_question(self, question_id: str, update_data: UnansweredUpdate) -> bool:
        question = self.get_question_by_id(question_id)
        if not question:
            return False
        
        update_expression = "SET updatedAt = :updated_at"
        expression_values: dict[str, Any] = {
            ':updated_at': datetime.now().isoformat()
        }
        expression_names = {}
        
        if update_data.question is not None:
            update_expression += ", question = :question"
            expression_values[':question'] = update_data.question
        
        if update_data.status is not None:
            update_expression += ", #status = :status"
            expression_values[':status'] = update_data.status
            expression_names['#status'] = 'status'
            
            if update_data.status == 'resolved':
                update_expression += ", reviewed_at = :reviewed_at"
                expression_values[':reviewed_at'] = datetime.now().isoformat()
        
        if update_data.was_fed_to_agent is not None:
            update_expression += ", was_fed_to_agent = :was_fed"
            expression_values[':was_fed'] = update_data.was_fed_to_agent
            
            if update_data.was_fed_to_agent:
                update_expression += ", fed_date = :fed_date"
                expression_values[':fed_date'] = datetime.now().isoformat()
        
        if update_data.comment is not None:
            update_expression += ", #comment = :comment"
            expression_values[':comment'] = update_data.comment
            expression_names['#comment'] = 'comment'
        
        if update_data.reviewed_by is not None:
            update_expression += ", reviewedBy = :reviewed_by"
            expression_values[':reviewed_by'] = update_data.reviewed_by
        
        if update_data.category is not None:
            update_expression += ", category = :category"
            expression_values[':category'] = update_data.category
        
        if update_data.tags is not None:
            update_expression += ", tags = :tags"
            expression_values[':tags'] = update_data.tags
        
        update_params = {
            'Key': {'id': question_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values
        }
        
        if expression_names:
            update_params['ExpressionAttributeNames'] = expression_names
        
        self.question_table.update_item(**update_params)
        return True
    
    def delete_question(self, question_id: str) -> bool:
        question = self.get_question_by_id(question_id)
        if not question:
            return False
        
        # Delete all comments associated with this question
        comments, _ = self.get_comments_by_question(question_id, limit=1000)
        for comment in comments:
            self.comment_table.delete_item(Key={'id': comment.id})
        
        self.question_table.delete_item(Key={'id': question_id})
        return True
    
    # UnansweredQuestionComment methods
    def create_comment(self, comment_data: UnansweredCommentCreate) -> str:
        comment_id = str(uuid.uuid4())
        current_time = datetime.now()
        current_time_iso = current_time.isoformat()
        
        item = {
            'id': comment_id,
            'question_id': comment_data.question_id,
            'user': comment_data.user,
            'comment': comment_data.comment,
            'created_at': current_time_iso,
            'updated_at': current_time_iso
        }
        
        self.comment_table.put_item(Item=item)
        return comment_id
    
    def get_comment_by_id(self, comment_id: str) -> Optional[UnansweredComment]:
        response = self.comment_table.get_item(
            Key={'id': comment_id}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        return self._item_to_comment(item)
    
    def get_comments_by_question(
        self, 
        question_id: str,
        limit: int = 50,
        last_evaluated_key: Optional[dict] = None
    ) -> tuple[list[UnansweredComment], Optional[dict]]:
        query_params = {
            'IndexName': 'question_id-created_at-index',
            'KeyConditionExpression': Key('question_id').eq(question_id),
            'ScanIndexForward': True,
            'Limit': limit
        }
        
        if last_evaluated_key:
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        response = self.comment_table.query(**query_params)
        
        comments = [self._item_to_comment(item) for item in response.get('Items', [])]
        next_key = response.get('LastEvaluatedKey')
        
        return comments, next_key
    
    def delete_comment(self, comment_id: str) -> bool:
        comment = self.get_comment_by_id(comment_id)
        if not comment:
            return False
        
        self.comment_table.delete_item(Key={'id': comment_id})
        return True
    
    def get_all_questions_with_filters(
        self,
        status: Optional[str] = None,
        agent_id: Optional[str] = None,
        was_fed_to_agent: Optional[bool] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100
    ) -> list[Unanswered]:
        scan_params: dict[str, Any] = {
            'Limit': limit
        }
        
        filter_expressions = []
        expression_values = {}
        expression_names = {}
        
        if status:
            filter_expressions.append("#status = :status")
            expression_values[':status'] = status
            expression_names['#status'] = 'status'
        
        if agent_id:
            filter_expressions.append("agent_id = :agent_id")
            expression_values[':agent_id'] = agent_id
        
        if was_fed_to_agent is not None:
            filter_expressions.append("was_fed_to_agent = :was_fed")
            expression_values[':was_fed'] = was_fed_to_agent
        
        if start_date:
            filter_expressions.append("#timestamp >= :start_date")
            expression_values[':start_date'] = start_date
            expression_names['#timestamp'] = 'timestamp'
        
        if end_date:
            filter_expressions.append("#timestamp <= :end_date")
            expression_values[':end_date'] = end_date
            expression_names['#timestamp'] = 'timestamp'
        
        if filter_expressions:
            scan_params['FilterExpression'] = ' AND '.join(filter_expressions)
            scan_params['ExpressionAttributeValues'] = expression_values
            if expression_names:
                scan_params['ExpressionAttributeNames'] = expression_names
        
        response = self.question_table.scan(**scan_params)
        questions = [self._item_to_question(item) for item in response.get('Items', [])]
        
        return questions
    
    # Helper methods
    def _item_to_question(self, item: dict) -> Unanswered:
        return Unanswered(
            id=item['id'],
            question=item['question'],
            agent_id=item['agent_id'],
            agent_name=item['agent_name'],
            user=item['user'],
            timestamp=item['timestamp'],
            context=item.get('context'),
            attempted_response=item.get('attempted_response'),
            status=item['status'],
            was_fed_to_agent=item.get('was_fed_to_agent', False),
            fed_date=item.get('fed_date'),
            comment=item.get('comment'),
            reviewed_by=item.get('reviewed_by'),
            reviewed_at=item.get('reviewed_at'),
            category=item.get('category'),
            tags=item.get('tags'),
            created_at=item['created_at'],
            updated_at=item['updated_at']
        )
    
    def _item_to_comment(self, item: dict) -> UnansweredComment:
        return UnansweredComment(
            id=item['id'],
            question_id=item['question_id'],
            user=item['user'],
            comment=item['comment'],
            created_at=item['created_at'],
            updated_at=item['updated_at']
        )

unanswered_repository = UnansweredRepository()
