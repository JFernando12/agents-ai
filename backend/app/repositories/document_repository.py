import uuid
from typing import Any
from datetime import datetime, timezone

from app.config import env
from app.models import Document, DocumentUpload, DocumentUpdate
from .base_dynamodb_repository import BaseDynamoDBRepository

class DocumentRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.document_table = self.dynamodb.Table(env.document_table) # type: ignore
    
    def create(
            self,
            document_data: DocumentUpload,
        ) -> str:
        document_id = str(uuid.uuid4())

        current_time_timestamp = int(datetime.now().timestamp() * 1000)
        
        item = {
            'id': document_id,
            'agent_id': document_data.agent_id,
            'file_name': document_data.file_name,
            'category': document_data.category,
            'medio': document_data.medio,
            'link': document_data.link,
            'status': 'pending',
            's3_key': document_data.s3_key,
            'created_at': current_time_timestamp,
            'updated_at': current_time_timestamp,
        }
        
        self.document_table.put_item(Item=item)
        return document_id
    
    def update(
            self,
            document_id: str,
            document_data: DocumentUpdate,
    ) -> None:
        current_time_timestamp = int(datetime.now(timezone.utc).timestamp() * 1000)
        
        update_expression = "SET updated_at = :updated_at"
        expression_attribute_names = {}

        expression_attribute_values: dict[str, Any] = {
            ':updated_at': current_time_timestamp
        }

        if document_data.status is not None:
            update_expression += ", #status = :status"
            expression_attribute_names['#status'] = 'status'
            expression_attribute_values[':status'] = document_data.status
        
        if document_data.processed_chunks is not None:
            update_expression += ", processed_chunks = :processed_chunks"
            expression_attribute_values[':processed_chunks'] = document_data.processed_chunks
        
        if document_data.error_message is not None:
            update_expression += ", error_message = :error_message"
            expression_attribute_values[':error_message'] = document_data.error_message
        
        if document_data.metadata is not None:
            update_expression += ", metadata = :metadata"
            expression_attribute_values[':metadata'] = document_data.metadata
        
        self.document_table.update_item(
            Key={'id': document_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
    
    def get_by_s3_key(self, s3_key: str) -> Document | None:
        response = self.document_table.query(
            IndexName='s3_key-index',
            KeyConditionExpression='s3_key = :s3_key',
            ExpressionAttributeValues={':s3_key': s3_key}
        )
        
        if not response['Items']:
            return None
        
        item = response['Items'][0]
        return Document(
            id=item['id'],
            file_name=item['file_name'],
            agent_id=item['agent_id'],
            status=item['status'],
            s3_key=item['s3_key'],
            created_at=item.get('created_at'),
            updated_at=item.get('updated_at'),
            processed_chunks=item.get('processed_chunks'),
            error_message=item.get('error_message'),
            metadata=item.get('metadata', {})
        )
    
    def get(self, agent_id: str) -> list[Document]:
        response = self.document_table.query(
            IndexName='agent_id-index',
            KeyConditionExpression='agent_id = :sid',
            ExpressionAttributeValues={':sid': agent_id}
        )
        
        documents = []
        for item in response['Items']:
            document = Document(
                id=item['id'],
                agent_id=item['agent_id'],
                file_name=item['file_name'],
                category=item.get('category'),
                medio=item.get('medio'),
                link=item.get('link'),
                status=item['status'],
                s3_key=item['s3_key'],
                created_at=item.get('created_at'),
                updated_at=item.get('updated_at'),
                processed_chunks=item.get('processed_chunks'),
                error_message=item.get('error_message'),
                metadata=item.get('metadata', {})
            )
            documents.append(document)
        
        return documents
    
    def get_by_id(self, document_id: str) -> Document | None:
        response = self.document_table.get_item(
            Key={'id': document_id}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        return Document(
            id=item['id'],
            file_name=item['file_name'],
            agent_id=item['agent_id'],
            status=item['status'],
            s3_key=item['s3_key'],
            created_at=item['created_at'],
            updated_at=item['updated_at'],
            processed_chunks=item.get('processed_chunks'),
            error_message=item.get('error_message'),
            metadata=item.get('metadata', {})
        )
    
    def delete_by_id(self, document_id: str) -> bool:
        existing_document = self.get_by_id(document_id)
        if not existing_document:
            raise ValueError(f"Document with ID '{document_id}' not found")
        
        self.document_table.delete_item(
            Key={'id': document_id}
        )
        return True

document_repository = DocumentRepository()
