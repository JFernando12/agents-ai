import os

class Environment:
    def __init__(self):
        self.region = "us-east-1"
        self.s3_bucket_name = os.getenv('S3_BUCKET_NAME', 'sales-agent-ai')
        self.document_table = os.getenv('DOCUMENT_TABLE', 'ai-document')
        self.agent_table = os.getenv('AGENT_TABLE', 'ai-agent')
        # S3 Vectors settings (can be overridden by agent RAG config)
        self.rag_vector_bucket = os.getenv('RAG_VECTOR_BUCKET', 'sales-agent-ai-vectors')
        self.rag_vector_index = os.getenv('RAG_VECTOR_INDEX', 'documents-index')
        # Default chunking defaults (overridden by agent RAG config)
        self.rag_default_chunk_size = int(os.getenv('RAG_DEFAULT_CHUNK_SIZE', '1500'))
        self.rag_default_chunk_overlap = int(os.getenv('RAG_DEFAULT_CHUNK_OVERLAP', '200'))
        self.rag_default_embedding_model = os.getenv('RAG_DEFAULT_EMBEDDING_MODEL', 'amazon.titan-embed-text-v2:0')

env = Environment()
