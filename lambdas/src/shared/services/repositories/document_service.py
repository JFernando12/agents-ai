from datetime import datetime, timezone

from ....config.environment import env
from ...interfaces import Document
from ...enums import DocumentStatus
from .base_dynamodb_service import BaseDynamoDBService

class DocumentService(BaseDynamoDBService):
    def __init__(self):
        super().__init__()
        self.document_table = self.dynamodb.Table(env.document_table) # type: ignore
    
    def update_document_status(
            self,
            document_id: str,
            status: DocumentStatus, 
            processed_chunks: int | None = None, 
            error_message: str | None = None,
            metadata: dict[str, Any] | None = None
        ) -> None:
        current_time_timestamp = int(datetime.now(timezone.utc).timestamp() * 1000)
        
        update_expression = "SET #status = :status, updated_at = :updated_at"
        expression_attribute_names = {'#status': 'status'}
        expression_attribute_values = {
            ':status': status.value,
            ':updated_at': current_time_timestamp
        }
        
        if processed_chunks is not None:
            update_expression += ", processed_chunks = :processed_chunks"
            expression_attribute_values[':processed_chunks'] = processed_chunks
        
        if error_message is not None:
            update_expression += ", error_message = :error_message"
            expression_attribute_values[':error_message'] = error_message
        
        if metadata is not None:
            update_expression += ", metadata = :metadata"
            expression_attribute_values[':metadata'] = metadata
        
        self.document_table.update_item(
            Key={'id': document_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
    
    def get_document_by_s3_key(self, s3_key: str) -> Document | None:
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
            status=DocumentStatus(item['status']),
            s3_key=item['s3_key'],
            created_at=item.get('created_at'),
            updated_at=item.get('updated_at'),
            processed_chunks=item.get('processed_chunks'),
            error_message=item.get('error_message'),
            metadata=item.get('metadata', {})
        )

document_service = DocumentService()
