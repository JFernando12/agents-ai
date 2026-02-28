import re
import boto3

from app.config import env
from app.repositories import document_repository, agent_repository
from app.models import DocumentUpdate, DocumentUpload
from app.integrations import s3_service

s3vectors_client = boto3.client(
    "s3vectors",
    region_name=env.region,
    aws_access_key_id=env.aws_access_key_id,
    aws_secret_access_key=env.aws_secret_access_key
)

class DocumentService:
    def upload(self, document_data: DocumentUpload) -> dict | None:
        cleaned_file_name = re.sub(r'[^a-zA-Z0-9-_.]', '_', document_data.file_name)
        cleaned_file_name = re.sub(r'\.[^/.]+$', '', cleaned_file_name)

        existing_service = agent_repository.get_by_id(agent_id=document_data.agent_id)
        if not existing_service:
            return None

        pdf_key = f"{document_data.agent_id}/{cleaned_file_name}.pdf"
        
        s3_client = boto3.client(
            's3',
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key
        )
        bucket_name = env.s3_bucket_name
        
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': pdf_key,
                'ContentType': 'application/pdf'
            },
            ExpiresIn=3600  # 1 hour expiration
        )
        
        document_data.s3_key = pdf_key
        document_id = document_repository.create(
            document_data=document_data
        )

        return {
            'presigned_url': presigned_url,
            'pdf_key': pdf_key,
            'document_id': document_id,
            'message': 'Use the presigned URL to upload your PDF file directly to S3. Processing will start automatically once the file is uploaded.',
        }
    
    def update(self, document_id: str, document_data: DocumentUpdate) -> bool:
        document_repository.update(document_id, document_data)
        return True
    
    def delete(self, document_id: str) -> bool:
        document = document_repository.get_by_id(document_id)
        if not document:
            return False
        
        processed_chunks = document.processed_chunks or 0
        keys = []
        for index in range(processed_chunks):
            keys.append(f"{document_id}_{index}")

        s3vectors_client.delete_vectors(
            vectorBucketName='ai-agents',
            indexName='ai-agents-index',
            keys=keys
        )
        
        removed_file = s3_service.delete_file(s3_key=document.s3_key)
        if not removed_file:
            return False
        
        document_repository.delete_by_id(document_id=document_id)
        return True
    
    def get_all(self, agent_id: str) -> list[dict]:
        documents = document_repository.get(agent_id)
        return [document.model_dump(mode='json') for document in documents]
    
    def get_one(self, document_id: str) -> dict | None:    
        document = document_repository.get_by_id(document_id)
        
        if not document:
            return None
        
        if not s3_service.check_object_exists(document.s3_key):
            return None
        
        presigned_url = s3_service.generate_presigned_url(document.s3_key, 3600)
        
        if not presigned_url:
            return None
        
        return {
            **document.model_dump(mode='json'),
            'presigned_url': presigned_url
        }
    
document_service = DocumentService()