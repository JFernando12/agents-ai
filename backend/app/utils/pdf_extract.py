import io
import re
import boto3
from PyPDF2 import PdfReader
import sys

from ..config.environment import env

allowed_pattern = r"[^a-zA-Z0-9,\.\-\_\/\(\) \n]"

def extract_pdf_text_from_s3(
    bucket: str,
    key: str,
    max_chars: int = 12000
) -> str:
    s3 = boto3.client(
        "s3",
        region_name=env.region,
        aws_access_key_id=env.aws_access_key_id,
        aws_secret_access_key=env.aws_secret_access_key
    )

    obj = s3.get_object(Bucket=bucket, Key=key)
    pdf_bytes = obj["Body"].read()

    text_parts: list[str] = []
    current_length = 0

    reader = PdfReader(io.BytesIO(pdf_bytes))
    for page in reader.pages:
        page_text = page.extract_text()
        if not page_text:
            continue
        cleaned_page_text = re.sub(allowed_pattern, "", page_text)
        cleaned_page_text = re.sub(r"\n{3,}", "\n\n", cleaned_page_text)
        cleaned_page_text = re.sub(r"[ ]{2,}", " ", cleaned_page_text)

        text_parts.append(cleaned_page_text)
        current_length += len(cleaned_page_text)

        if current_length >= max_chars:
            break

    full_text = "\n".join(text_parts).strip()

    return full_text[:max_chars]