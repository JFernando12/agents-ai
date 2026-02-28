import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Environment(BaseSettings):
    # AWS
    stage: str = os.getenv('STAGE', 'dev')
    region: str = 'us-east-1'
    s3_bucket_name: str = 'sales-agent-ai'
    embedding_model_id: str = 'amazon.titan-embed-text-v2:0'
    
    # JWT
    jwt_secret_key: str = os.getenv('JWT_SECRET', 'a-string-secret-at-least-256-bits-long')
    jwt_algorithm: str = 'HS256'
    api_key: str = os.getenv('API_KEY', '')
    
    # AWS Credentials
    aws_access_key_id: str = os.getenv('AWS_ACCESS_KEY_ID', '')
    aws_secret_access_key: str = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    
    # Embedding Configuration
    embedding_batch_size: int = 5
    delay_between_batches: int = 3000
    max_embedding_retries: int = 5
    initial_retry_delay: int = 2000
    
    # DynamoDB Tables
    conversation_table: str = 'ai-conversation'
    message_table: str = 'ai-message'
    document_table: str = 'ai-document'
    agent_table: str = 'ai-agent'
    log_table: str = 'ai-log'
    unanswered_table: str = 'ai-unanswered'
    unanswered_comment_table: str = 'ai-unanswered-comment'
    tool_table: str = 'ai-tool'
    account_table: str = 'ai-account'
    user_table: str = 'ai-user'
    execution_trace_table: str = 'ai-execution-trace'

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

env = Environment()
