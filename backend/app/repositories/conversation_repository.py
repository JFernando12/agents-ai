import json
import uuid
from typing import Optional
from datetime import datetime

from app.config import env
from app.models import Conversation, Message, ConversationCreate
from .base_dynamodb_repository import BaseDynamoDBRepository

class ConversationRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.conversation_table = self.dynamodb.Table(env.conversation_table) # type: ignore
        self.message_table = self.dynamodb.Table(env.message_table) # type: ignore
    
    def save_message(self, conversation_id: str, message: Message) -> None:
        timestamp = int(message.timestamp.timestamp() * 1000)
        message_id = str(uuid.uuid4())
        
        item = {
            'id': message_id,
            'conversation_id': conversation_id,
            'timestamp': timestamp,
            'role': message.role,
            'content': message.content,
            'metadata': message.metadata or {}
        }
        
        if message.context_data:
            item['context_data'] = json.dumps(message.context_data)
            
            if 'search_info' in message.context_data:
                search_info = message.context_data['search_info']
                if 'contexts_used' in search_info:
                    item['contexts_used'] = search_info['contexts_used']
                if 'context_length' in search_info:
                    item['context_length'] = search_info['context_length']
                if 'agent_id' in search_info:
                    item['agent_id'] = search_info['agent_id']
        
        if message.attachments:
            item['attachments'] = json.dumps(message.attachments)
        self.message_table.put_item(Item=item)
    
    def get_messages(self, conversation_id: str, limit: int | None = 50) -> list[Message]:
        response = self.message_table.query(
            IndexName='conversation_id-index',
            KeyConditionExpression='conversation_id = :cid',
            ExpressionAttributeValues={':cid': conversation_id},
            Limit=limit,
            ScanIndexForward=False
        )
                
        messages = []
        for item in response['Items']:
            content = item.get('content') or item.get('text', '')
            timestamp = item.get('timestamp')
            attachments = item.get('attachments')
            
            context_data = None
            if 'context_data' in item:
                try:
                    context_data = json.loads(item['context_data']) if isinstance(item['context_data'], str) else item['context_data']
                except (json.JSONDecodeError, TypeError):
                    print(f"Warning: Could not parse context_data for message")
                    context_data = None
            
            message = Message(
                role=item['role'],
                content=content,
                timestamp=timestamp,
                metadata=item.get('metadata'),
                context_data=context_data,
                attachments=json.loads(attachments) if attachments else None
                
            )
            messages.append(message)
        
        return messages
    
    def create(
            self,
            conversation_data: ConversationCreate
        ) -> str:
        conversation_id = str(uuid.uuid4())
        current_time_timestamp = int(datetime.now().timestamp() * 1000)
        
        item = {
            'id': conversation_id,
            'user': conversation_data.user,
            'agent_id': conversation_data.agent_id,
            'title': conversation_data.title,
            'created_at': current_time_timestamp,
            'updated_at': current_time_timestamp
        }
        
        self.conversation_table.put_item(Item=item)
        return conversation_id
    
    def get_by_id(self, conversation_id: str) -> Optional[Conversation]:
        response = self.conversation_table.get_item(
            Key={'id': conversation_id}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        return Conversation(
            id=item['id'],
            title=item.get('title', ''),
            user=item['user'],
            agent_id=item['agent_id'],
            created_at=item['created_at'],
            updated_at=item['updated_at']
        )
    
    def get_by_user_and_agent(self, user: str, agent_id: str) -> list[Conversation]:
        response = self.conversation_table.query(
            IndexName='user-agent_id-index',
            KeyConditionExpression='#user = :user AND agent_id = :agent_id',
            ExpressionAttributeNames={
                '#user': 'user'
            },
            ExpressionAttributeValues={
                ':user': user,
                ':agent_id': agent_id
            },
            ScanIndexForward=False
        )
        
        conversations = []
        for item in response.get('Items', []):
            conversation = Conversation(
                id=item['id'],
                title=item.get('title', ''),
                user=item['user'],
                agent_id=item['agent_id'],
                created_at=item['created_at'],
                updated_at=item['updated_at']
            )
            conversations.append(conversation)
        return conversations
    
    def delete(self, conversation_id: str) -> bool:
        conversation = self.get_by_id(conversation_id)
        if not conversation:
            return False
        
        msg_response = self.message_table.query(
            IndexName='conversation_id-index',
            KeyConditionExpression='conversation_id = :conversation_id',
            ExpressionAttributeValues={':conversation_id': conversation_id}
        )
        
        for msg in msg_response['Items']:
            self.message_table.delete_item(
                Key={'id': msg['id']}
            )
        
        self.conversation_table.delete_item(
            Key={'id': conversation_id}
        )
        
        return True

conversation_repository = ConversationRepository()
