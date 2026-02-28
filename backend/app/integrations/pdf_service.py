import PyPDF2
import boto3
from typing import Any
import io

from app.config import env
class PDFService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key
        )
        self.bucket_name = env.s3_bucket_name
    
    def get_data(self, source: str) -> dict[str, Any]:
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=source)
            pdf_content = response['Body'].read()
            
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            text_content = []
            
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text.strip():
                    text_content.append(page_text)
            
            text = "\n\n".join(text_content)
            num_pages = len(pdf_reader.pages)
            
            print(f"Extracted {len(text)} characters from {num_pages} pages")
            
            return {
                'text': text,
                'numPages': num_pages
            }
            
        except Exception as e:
            raise Exception(f"Error getting PDF data from {source}: {str(e)}")

pdf_service = PDFService()