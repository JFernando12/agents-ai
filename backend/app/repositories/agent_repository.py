import uuid
from typing import Any
from datetime import datetime
from decimal import Decimal

from app.config import env
from app.models import Agent, AgentCreate, AgentUpdate
from app.models.agent import RAGConfig
from .base_dynamodb_repository import BaseDynamoDBRepository

class AgentRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.agent_table = self.dynamodb.Table(env.agent_table) # type: ignore
        self.document_table = self.dynamodb.Table(env.document_table) # type: ignore
        self.conversation_table = self.dynamodb.Table(env.conversation_table) # type: ignore
        self.message_table = self.dynamodb.Table(env.message_table) # type: ignore
    
    def create(
            self,
            agent_data: AgentCreate,
            user: str,
            account_id: str = 'default'
        ) -> str:
        agent_id = str(uuid.uuid4())
        current_time_timestamp = int(datetime.now().timestamp() * 1000)
        
        item = {
            'id': agent_id,
            'user': user,
            'account_id': account_id,
            'name': agent_data.name,
            'description': agent_data.description,
            'status': agent_data.status,
            'created_at': current_time_timestamp,
            'updated_at': current_time_timestamp,
            'custom_prompt': agent_data.custom_prompt,
            'model': agent_data.model,
            'temperature': Decimal(str(agent_data.temperature)),
            'max_tokens': agent_data.max_tokens,
            'top_k': agent_data.top_k,
            'icon': agent_data.icon,
            'is_public': 1 if agent_data.is_public else 0,
            'tools': [t.model_dump() for t in agent_data.tools] if agent_data.tools else [],
            'sub_agents': [t.model_dump() for t in agent_data.sub_agents] if agent_data.sub_agents else [],
            'questions': [q.model_dump() for q in agent_data.questions] if agent_data.questions else None,
            'metadata': agent_data.metadata,
            'rag_config': agent_data.rag_config.model_dump() if agent_data.rag_config else None,
        }
        
        self.agent_table.put_item(Item=item)
        return agent_id
    
    def get_by_id(self, agent_id: str) -> Agent | None:
        try:
            response = self.agent_table.get_item(
                Key={'id': agent_id}
            )
            
            if 'Item' not in response:
                return None
            
            item = response['Item']
            return Agent(
                id=item['id'],
                name=item['name'],
                description=item['description'],
                icon=item['icon'],
                status=item['status'],
                created_at=item['created_at'],
                updated_at=item['updated_at'],
                custom_prompt=item['custom_prompt'],
                model=item['model'],
                temperature=self._decimal_to_float(item['temperature']),
                max_tokens=item['max_tokens'],
                top_k=item['top_k'],
                is_public=bool(item.get('is_public', 0)),
                tools=item.get('tools', []),
                sub_agents=item.get('sub_agents', []),
                questions=item.get('questions', []),
                metadata=item['metadata'],
                rag_config=RAGConfig(**item['rag_config']) if item.get('rag_config') else None,
            )
        except Exception as e:
            print(f"Error getting agent by ID {agent_id}: {e}")
            return None
    
    def get_all(
            self,
            is_public: bool | None = None,
            account_id: str | None = None
        ) -> list[Agent]:
        filter_expr = None
        filter_values: dict = {}
        filter_names: dict = {}

        if account_id is not None:
            filter_expr = '#acc = :account_id'
            filter_values[':account_id'] = account_id
            filter_names['#acc'] = 'account_id'

        if is_public is not None:
            query_kwargs: dict = {
                'IndexName': 'is_public-index',
                'KeyConditionExpression': 'is_public = :is_public',
                'ExpressionAttributeValues': {':is_public': 1 if is_public else 0},
            }
            if filter_expr:
                query_kwargs['FilterExpression'] = filter_expr
                query_kwargs['ExpressionAttributeValues'].update(filter_values)
                query_kwargs['ExpressionAttributeNames'] = filter_names
            response = self.agent_table.query(**query_kwargs)
        else:
            scan_kwargs: dict = {}
            if filter_expr:
                scan_kwargs['FilterExpression'] = filter_expr
                scan_kwargs['ExpressionAttributeValues'] = filter_values
                scan_kwargs['ExpressionAttributeNames'] = filter_names
            response = self.agent_table.scan(**scan_kwargs)
        
        agents = []
        for item in response['Items']:
            agent = Agent(
                id=item['id'],
                name=item['name'],
                description=item['description'],
                icon=item['icon'],
                status=item['status'],
                created_at=item['created_at'],
                updated_at=item['updated_at'],
                custom_prompt=item['custom_prompt'],
                model=item['model'],
                temperature=self._decimal_to_float(item['temperature']),
                max_tokens=item['max_tokens'],
                top_k=item['top_k'],
                is_public=bool(item.get('is_public', 0)),
                tools=item.get('tools', []),
                sub_agents=item.get('sub_agents', []),
                questions=item.get('questions', []),
                metadata=item['metadata'],
                rag_config=RAGConfig(**item['rag_config']) if item.get('rag_config') else None,
            )
            agents.append(agent)
        
        return agents
    
    def update(
            self,
            agent_id: str,
            agent_data: AgentUpdate
        ) -> None:
        current_time_timestamp = int(datetime.now().timestamp() * 1000)
        
        update_expression_parts = ["updated_at = :updated_at"]
        expression_attribute_values: dict[str, Any] = {':updated_at': current_time_timestamp}
        expression_attribute_names = {}
        
        if agent_data.name is not None:
            update_expression_parts.append("#name = :name")
            expression_attribute_names['#name'] = 'name'
            expression_attribute_values[':name'] = agent_data.name
        
        if agent_data.description is not None:
            update_expression_parts.append("description = :description")
            expression_attribute_values[':description'] = agent_data.description

        if agent_data.icon is not None:
            update_expression_parts.append("icon = :icon")
            expression_attribute_values[':icon'] = agent_data.icon

        if agent_data.model is not None:
            update_expression_parts.append("#model = :model")
            expression_attribute_names['#model'] = 'model'
            expression_attribute_values[':model'] = agent_data.model
        
        if agent_data.custom_prompt is not None:
            update_expression_parts.append("custom_prompt = :custom_prompt")
            expression_attribute_values[':custom_prompt'] = agent_data.custom_prompt
        
        if agent_data.status is not None:
            update_expression_parts.append("#status = :status")
            expression_attribute_names['#status'] = 'status'
            expression_attribute_values[':status'] = agent_data.status
        
        if agent_data.temperature is not None:
            update_expression_parts.append("temperature = :temperature")
            expression_attribute_values[':temperature'] = Decimal(str(agent_data.temperature))
        
        if agent_data.max_tokens is not None:
            update_expression_parts.append("max_tokens = :max_tokens")
            expression_attribute_values[':max_tokens'] = agent_data.max_tokens
        
        if agent_data.top_k is not None:
            update_expression_parts.append("top_k = :top_k")
            expression_attribute_values[':top_k'] = agent_data.top_k

        if agent_data.is_public is not None:
            update_expression_parts.append("is_public = :is_public")
            expression_attribute_values[':is_public'] = 1 if agent_data.is_public else 0

        if agent_data.tools is not None:
            update_expression_parts.append("tools = :tools")
            expression_attribute_values[':tools'] = [t.model_dump() for t in agent_data.tools]

        if agent_data.sub_agents is not None:
            update_expression_parts.append("sub_agents = :sub_agents")
            expression_attribute_values[':sub_agents'] = [t.model_dump() for t in agent_data.sub_agents]

        if agent_data.questions is not None:
            update_expression_parts.append("questions = :questions")
            expression_attribute_values[':questions'] = [q.model_dump() for q in agent_data.questions] if agent_data.questions else None
        
        if agent_data.metadata is not None:
            update_expression_parts.append("metadata = :metadata")
            expression_attribute_values[':metadata'] = agent_data.metadata

        if agent_data.rag_config is not None:
            update_expression_parts.append("rag_config = :rag_config")
            expression_attribute_values[':rag_config'] = agent_data.rag_config.model_dump()

        update_expression = "SET " + ", ".join(update_expression_parts)
        
        update_params = {
            'Key': {'id': agent_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_attribute_values
        }
        
        if expression_attribute_names:
            update_params['ExpressionAttributeNames'] = expression_attribute_names
        
        self.agent_table.update_item(**update_params)
    
    def delete(self, agent_id: str) -> bool:
        existing_agent = self.get_by_id(agent_id)
        if not existing_agent:
            return False
        
        doc_response = self.document_table.query(
            IndexName='agent_id-index',
            KeyConditionExpression='agent_id = :agent_id',
            ExpressionAttributeValues={':agent_id': agent_id}
        )
        
        for doc in doc_response['Items']:
            self.document_table.delete_item(
                Key={'id': doc['id']}
            )

        conv_response = self.conversation_table.query(
            IndexName='agent_id-index',
            KeyConditionExpression='agent_id = :agent_id',
            ExpressionAttributeValues={':agent_id': agent_id}
        )
        
        for conv in conv_response['Items']:
            self.conversation_table.delete_item(
                Key={'id': conv['id']}
            )
            
            message_response = self.message_table.query(
                IndexName='conversation_id-index',
                KeyConditionExpression='conversation_id = :conversation_id',
                ExpressionAttributeValues={':conversation_id': conv['id']}
            )

            for msg in message_response['Items']:
                self.message_table.delete_item(
                    Key={'id': msg['id']}
                )
        
        self.agent_table.delete_item(
            Key={'id': agent_id}
        )
        
        return True

agent_repository = AgentRepository()
