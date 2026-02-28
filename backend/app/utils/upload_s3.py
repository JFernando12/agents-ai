import boto3
import re
from typing import TypedDict

from ..config.environment import env


class UploadedFileResult(TypedDict):
    pdf_key: str
    bucket: str
    file_name: str
    url: str


class UploadedFile:
    def __init__(self, filename: str, content: bytes, content_type: str):
        self.filename = filename
        self.content = content
        self.content_type = content_type or "application/pdf"

    def upload_to_s3(self) -> UploadedFileResult:
        cleaned_file_name = re.sub(r'[^a-zA-Z0-9-_.]', '_', self.filename)
        cleaned_file_name = re.sub(r'\.[^/.]+$', '', cleaned_file_name)

        s3_key = f"chat-upload/{cleaned_file_name}.pdf"

        s3_client = boto3.client(
            "s3",
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key
        )

        # s3_client.put_object(
        #     Bucket=env.s3_bucket_name,
        #     Key=s3_key,
        #     Body=self.content,
        #     ContentType=self.content_type
        # )

        # public_url = (
        #     f"https://{env.s3_bucket_name}.s3."
        #     f"{env.region}.amazonaws.com/{s3_key}"
        # )

        # return {
        #     "pdf_key": s3_key,
        #     "bucket": env.s3_bucket_name,
        #     "file_name": self.filename,
        #     "url": public_url
        # }
        
        
        s3_client.put_object(
        Bucket=env.s3_bucket_name,
        Key=s3_key,
        Body=self.content,
        ContentType=self.content_type
        )

        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": env.s3_bucket_name,
                "Key": s3_key,
            },
            ExpiresIn=864000  # 8 días
        )

        return {
            "pdf_key": s3_key,
            "bucket": env.s3_bucket_name,
            "file_name": self.filename,
            "url": presigned_url,
        }