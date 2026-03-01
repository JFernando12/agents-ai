import os

class Environment:
    def __init__(self):
        self.region = "us-east-1"
        self.s3_bucket_name = os.getenv('S3_BUCKET_NAME', 'sales-agent-ai')
        self.document_table = "ai-document"

env = Environment()
    