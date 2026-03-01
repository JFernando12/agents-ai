import boto3
import json

from ...shared.services.pdf_service import pdf_service
from ...shared.services.repositories import document_service
from ...shared.enums import DocumentStatus

# S3 Vectors client for vector operations
s3vectors_client = boto3.client("s3vectors", region_name="us-east-1")

# Bedrock client for generating embeddings
bedrock_runtime = boto3.client("bedrock-runtime", region_name="us-east-1")

def chunk_text(text: str, chunk_size: int = 1500, chunk_overlap: int = 200) -> list[str]:
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        if end < len(text):
            last_space = text.rfind(' ', start, end)
            if last_space > start:
                end = last_space
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        if end >= len(text):
            break
            
        start = end - chunk_overlap
    
    return chunks

def process_embeddings(agent_id: str, file_name: str):
    pdf_key = f"{agent_id}/{file_name}.pdf"
    document = None
    
    try:
        print(f"Starting S3 Vectors processing for agent_id: {agent_id}, file: {file_name}")
        
        document = document_service.get_document_by_s3_key(pdf_key)

        if not document:
            raise Exception(f"No document found for S3 key: {pdf_key}")

        print(f"Found document record: {document.id}")
        document_service.update_document_status(
            document_id=document.id, 
            status=DocumentStatus.PROCESSING
        )
        
        pdf_data = pdf_service.get_data(source=pdf_key)
        text = pdf_data['text']
        
        print(f"Successfully extracted {len(text)} characters from PDF")
        
        chunks = chunk_text(text)
        clean_chunks = [chunk for chunk in chunks if chunk.strip()]
        
        print(f"Generated {len(chunks)} chunks, {len(clean_chunks)} non-empty chunks")
        
        embeddings = []
        for text in clean_chunks:
            response = bedrock_runtime.invoke_model(
                modelId="amazon.titan-embed-text-v2:0",
                contentType="application/json",
                accept="application/json",
                body=json.dumps({"inputText": text})
            )

            # Extract embedding from response.
            response_body = json.loads(response["body"].read())
            embeddings.append(response_body["embedding"])
        print(f"Generated embeddings for {len(embeddings)} chunks")
        
        # Convert embeddings to vectors for S3 Vectors
        vectors = []
        for index, embedding in enumerate(embeddings):
            source_text = clean_chunks[index]
            
            vector = {
                "key": f"{document.id}_{index}",
                "data": {"float32": embedding},
                "metadata": {
                    "agent_id": agent_id,
                    "document_id": document.id,
                    "source": file_name,
                    "chunk_index": index,
                    "source_text": source_text
                }
            }
            vectors.append(vector)
        print(f"Prepared {len(vectors)} vectors for S3 Vectors storage")

        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            s3vectors_client.put_vectors(
                vectorBucketName="sales-agent-ai-vectors",   
                indexName="documents-index",
                vectors=batch
            )
        print(f"Successfully stored {len(vectors)} vectors in S3 Vectors")
       
        document_service.update_document_status(
            document_id=document.id, 
            status=DocumentStatus.COMPLETED,
            processed_chunks=len(clean_chunks)
        )
        
    except Exception as error:
        print(f"Error processing embeddings with S3 Vectors for {agent_id}/{file_name}: {error}")
        
        if document:
            document_service.update_document_status(
                document.id, 
                DocumentStatus.FAILED,
                error_message=str(error)
            )
        
        raise Exception(f"Failed to process embeddings with S3 Vectors for {agent_id}/{file_name}: {error}")
