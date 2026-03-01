import boto3
import json
import re
from decimal import Decimal

from ...shared.services.pdf_service import pdf_service
from ...shared.services.repositories import document_service
from ...shared.enums import DocumentStatus
from ...config.environment import env

# S3 Vectors client for vector operations
s3vectors_client = boto3.client("s3vectors", region_name=env.region)

# Bedrock client for generating embeddings and contextual summaries
bedrock_runtime = boto3.client("bedrock-runtime", region_name=env.region)

# DynamoDB resource for reading agent config
_dynamodb = boto3.resource("dynamodb", region_name=env.region)
_agent_table = _dynamodb.Table(env.agent_table)


def _get_agent_rag_config(agent_id: str) -> dict:
    """Fetch the agent's rag_config from DynamoDB. Returns empty dict if not configured."""
    try:
        response = _agent_table.get_item(Key={"id": agent_id})
        item = response.get("Item", {})
        raw = item.get("rag_config") or {}
        def _dec(v):
            if isinstance(v, Decimal):
                return int(v) if v % 1 == 0 else float(v)
            return v
        return {k: _dec(v) for k, v in raw.items()}
    except Exception as e:
        print(f"[RAG_CONFIG] Could not fetch agent config for {agent_id}: {e}")
        return {}


# ── Chunking strategies ───────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = 1500, chunk_overlap: int = 200) -> list[dict]:
    """Fixed-size chunking with word-boundary awareness."""
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
            chunks.append({"text": chunk, "section_title": None})
        if end >= len(text):
            break
        start = end - chunk_overlap
    return chunks


def chunk_text_semantic(text: str, max_chunk_size: int = 1500) -> list[dict]:
    """Semantic chunking: split on section headings and paragraph boundaries.

    Strategy:
    1. Identify section boundaries (Markdown headings, ALL-CAPS lines, blank lines).
    2. Accumulate paragraphs into a chunk until max_chunk_size is reached.
    3. If a single paragraph exceeds max_chunk_size, sub-split it with fixed chunker.
    """
    # Detect section titles: Markdown headings or all-caps lines ≥ 3 words
    _HEADING_RE = re.compile(
        r'^(#{1,6}\s+.+|[A-Z][A-Z0-9 \t,.\-]{10,})$',
        re.MULTILINE,
    )

    # Split into raw paragraphs by two or more blank lines
    raw_paragraphs = re.split(r'\n{2,}', text)

    sections: list[dict] = []
    current_title: str | None = None
    buffer: list[str] = []
    buffer_len = 0

    def _flush(title: str | None) -> None:
        merged = "\n\n".join(buffer).strip()
        if not merged:
            return
        if len(merged) > max_chunk_size:
            # Sub-split oversized section with fixed chunker (no overlap for semantic)
            for sub in chunk_text(merged, chunk_size=max_chunk_size, chunk_overlap=0):
                sections.append({"text": sub["text"], "section_title": title})
        else:
            sections.append({"text": merged, "section_title": title})

    for para in raw_paragraphs:
        para = para.strip()
        if not para:
            continue
        is_heading = bool(_HEADING_RE.match(para)) and len(para) < 120
        if is_heading:
            _flush(current_title)
            buffer.clear()
            buffer_len = 0
            current_title = para.lstrip('#').strip()
            continue
        if buffer_len + len(para) > max_chunk_size and buffer:
            _flush(current_title)
            buffer.clear()
            buffer_len = 0
        buffer.append(para)
        buffer_len += len(para)

    _flush(current_title)
    return sections


# ── Contextual Retrieval ──────────────────────────────────────────────────────

_CONTEXT_PROMPT = """\
Here is a document (or an excerpt of a larger document):
<document>
{document_excerpt}
</document>

Here is a specific chunk from that document:
<chunk>
{chunk}
</chunk>

Write a short context (2-3 sentences) that situates this chunk within the document. \
Focus on what topic or section it belongs to, what it explains, and how it connects to the rest. \
Reply with ONLY the context sentences, no headers or extra explanation."""


def _generate_chunk_context(
    document_excerpt: str,
    chunk: str,
    model_id: str,
) -> str:
    """Ask a small LLM to generate a context prefix for the chunk."""
    try:
        response = bedrock_runtime.converse(
            modelId=model_id,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": _CONTEXT_PROMPT.format(
                                document_excerpt=document_excerpt[:3000],
                                chunk=chunk[:1000],
                            )
                        }
                    ],
                }
            ],
            inferenceConfig={"maxTokens": 150, "temperature": 0.0},
        )
        ctx = response["output"]["message"]["content"][0]["text"].strip()
        return ctx
    except Exception as e:
        print(f"[CONTEXTUAL] Context generation failed (non-blocking): {e}")
        return ""


def _prepend_context(context: str, chunk: str) -> str:
    if not context:
        return chunk
    return f"<context>\n{context}\n</context>\n\n{chunk}"


# ── Main processor ────────────────────────────────────────────────────────────

def process_embeddings(agent_id: str, file_name: str):
    pdf_key = f"{agent_id}/{file_name}.pdf"
    document = None

    # Load agent RAG config (falls back to env defaults if not configured)
    rag_cfg = _get_agent_rag_config(agent_id)
    chunk_size = rag_cfg.get("chunk_size", env.rag_default_chunk_size)
    chunk_overlap = rag_cfg.get("chunk_overlap", env.rag_default_chunk_overlap)
    embedding_model = rag_cfg.get("embedding_model", env.rag_default_embedding_model)
    chunking_strategy = rag_cfg.get("chunking_strategy", "fixed")
    contextual_model = rag_cfg.get("contextual_retrieval_model", "amazon.nova-micro-v1:0")
    vector_bucket = env.rag_vector_bucket
    vector_index = env.rag_vector_index

    print(
        f"[RAG_CONFIG] agent={agent_id} strategy={chunking_strategy} "
        f"chunk_size={chunk_size} chunk_overlap={chunk_overlap} model={embedding_model}"
    )

    try:
        print(f"Starting S3 Vectors processing for agent_id: {agent_id}, file: {file_name}")

        document = document_service.get_document_by_s3_key(pdf_key)
        if not document:
            raise Exception(f"No document found for S3 key: {pdf_key}")

        print(f"Found document record: {document.id}")
        document_service.update_document_status(
            document_id=document.id,
            status=DocumentStatus.PROCESSING,
        )

        pdf_data = pdf_service.get_data(source=pdf_key)
        text = pdf_data["text"]
        print(f"Successfully extracted {len(text)} characters from PDF")

        # ── Chunking ──────────────────────────────────────────────────────────
        if chunking_strategy in ("semantic", "contextual"):
            raw_chunks = chunk_text_semantic(text, max_chunk_size=chunk_size)
        else:
            raw_chunks = chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

        clean_chunks = [c for c in raw_chunks if c["text"].strip()]
        print(f"Generated {len(clean_chunks)} chunks via strategy='{chunking_strategy}'")

        # ── Contextual Retrieval: prepend LLM-generated context ───────────────
        document_excerpt = text[:4000]  # first 4k chars as document-level summary anchor
        if chunking_strategy == "contextual":
            print(f"[CONTEXTUAL] Generating context for {len(clean_chunks)} chunks…")
            enriched: list[dict] = []
            for i, chunk in enumerate(clean_chunks):
                ctx = _generate_chunk_context(document_excerpt, chunk["text"], contextual_model)
                enriched.append({
                    "text": _prepend_context(ctx, chunk["text"]),
                    "original_text": chunk["text"],
                    "context_prefix": ctx,
                    "section_title": chunk["section_title"],
                })
                if (i + 1) % 10 == 0:
                    print(f"[CONTEXTUAL] {i + 1}/{len(clean_chunks)} done")
            clean_chunks = enriched  # type: ignore[assignment]
        else:
            # Normalise shape so the loop below is uniform
            for c in clean_chunks:
                c["original_text"] = c["text"]
                c["context_prefix"] = None

        # ── Embeddings ────────────────────────────────────────────────────────
        embeddings = []
        for chunk in clean_chunks:
            response = bedrock_runtime.invoke_model(
                modelId=embedding_model,
                contentType="application/json",
                accept="application/json",
                body=json.dumps({"inputText": chunk["text"]}),
            )
            response_body = json.loads(response["body"].read())
            embeddings.append(response_body["embedding"])
        print(f"Generated embeddings for {len(embeddings)} chunks")

        # ── Build vectors ─────────────────────────────────────────────────────
        vectors = []
        for index, (chunk, embedding) in enumerate(zip(clean_chunks, embeddings)):
            metadata: dict = {
                "agent_id": agent_id,
                "document_id": document.id,
                "source": file_name,
                "chunk_index": index,
                "source_text": chunk["original_text"],
                "embedding_model": embedding_model,
                "chunk_size": chunk_size,
                "chunk_overlap": chunk_overlap,
                "chunking_strategy": chunking_strategy,
            }
            if chunk.get("section_title"):
                metadata["section_title"] = chunk["section_title"]
            if chunk.get("context_prefix"):
                metadata["context_prefix"] = chunk["context_prefix"]

            vectors.append({
                "key": f"{document.id}_{index}",
                "data": {"float32": embedding},
                "metadata": metadata,
            })
        print(f"Prepared {len(vectors)} vectors for S3 Vectors storage")

        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            s3vectors_client.put_vectors(
                vectorBucketName=vector_bucket,
                indexName=vector_index,
                vectors=batch,
            )
        print(f"Successfully stored {len(vectors)} vectors in S3 Vectors")

        document_service.update_document_status(
            document_id=document.id,
            status=DocumentStatus.COMPLETED,
            processed_chunks=len(clean_chunks),
        )

    except Exception as error:
        print(f"Error processing embeddings for {agent_id}/{file_name}: {error}")
        if document:
            document_service.update_document_status(
                document.id,
                DocumentStatus.FAILED,
                error_message=str(error),
            )
        raise Exception(f"Failed to process embeddings for {agent_id}/{file_name}: {error}")


# S3 Vectors client for vector operations
s3vectors_client = boto3.client("s3vectors", region_name=env.region)

# Bedrock client for generating embeddings
bedrock_runtime = boto3.client("bedrock-runtime", region_name=env.region)

# DynamoDB resource for reading agent config
_dynamodb = boto3.resource("dynamodb", region_name=env.region)
_agent_table = _dynamodb.Table(env.agent_table)


def _get_agent_rag_config(agent_id: str) -> dict:
    """Fetch the agent's rag_config from DynamoDB. Returns empty dict if not configured."""
    try:
        response = _agent_table.get_item(Key={"id": agent_id})
        item = response.get("Item", {})
        raw = item.get("rag_config") or {}
        # Convert Decimal values back to python native types
        def _dec(v):
            if isinstance(v, Decimal):
                return int(v) if v % 1 == 0 else float(v)
            return v
        return {k: _dec(v) for k, v in raw.items()}
    except Exception as e:
        print(f"[RAG_CONFIG] Could not fetch agent config for {agent_id}: {e}")
        return {}


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

    # Load agent RAG config (falls back to env defaults if not configured)
    rag_cfg = _get_agent_rag_config(agent_id)
    chunk_size = rag_cfg.get("chunk_size", env.rag_default_chunk_size)
    chunk_overlap = rag_cfg.get("chunk_overlap", env.rag_default_chunk_overlap)
    embedding_model = rag_cfg.get("embedding_model", env.rag_default_embedding_model)
    vector_bucket = env.rag_vector_bucket
    vector_index = env.rag_vector_index

    print(f"[RAG_CONFIG] agent={agent_id} chunk_size={chunk_size} chunk_overlap={chunk_overlap} model={embedding_model}")

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
        
        chunks = chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        clean_chunks = [chunk for chunk in chunks if chunk.strip()]
        
        print(f"Generated {len(chunks)} chunks, {len(clean_chunks)} non-empty chunks")
        
        embeddings = []
        for text in clean_chunks:
            response = bedrock_runtime.invoke_model(
                modelId=embedding_model,
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
                    "source_text": source_text,
                    # Snapshot of indexing config for reproducibility
                    "embedding_model": embedding_model,
                    "chunk_size": chunk_size,
                    "chunk_overlap": chunk_overlap,
                }
            }
            vectors.append(vector)
        print(f"Prepared {len(vectors)} vectors for S3 Vectors storage")

        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            s3vectors_client.put_vectors(
                vectorBucketName=vector_bucket,
                indexName=vector_index,
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
