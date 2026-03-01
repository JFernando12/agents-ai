import json
import time
import boto3

from app.config import env
from app.models.agent import RAGConfig


s3vectors_client = boto3.client(
    "s3vectors",
    region_name=env.region,
    aws_access_key_id=env.aws_access_key_id,
    aws_secret_access_key=env.aws_secret_access_key,
)

bedrock_embed_client = boto3.client(
    "bedrock-runtime",
    region_name=env.region,
    aws_access_key_id=env.aws_access_key_id,
    aws_secret_access_key=env.aws_secret_access_key,
)

_DEFAULT_RAG_CONFIG = RAGConfig()

_REWRITE_PROMPT = """\
You are a search query optimizer for a semantic knowledge base.
Rewrite the user question into a concise, keyword-rich search query that maximizes recall.
Rules:
- Preserve all key entities, concepts and domain terms
- Remove conversational filler and pronouns
- Keep the result under 60 words
- Reply with ONLY the rewritten query, no explanation

User question: {question}

Rewritten query:"""


class RAGService:
    """Handles retrieval-augmented generation via S3 Vectors and Bedrock embeddings."""

    def _rewrite_query(self, message: str, model_id: str) -> str:
        """Use a small LLM to rewrite/expand the user query for better vector recall."""
        try:
            response = bedrock_embed_client.converse(
                modelId=model_id,
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": _REWRITE_PROMPT.format(question=message)}],
                    }
                ],
                inferenceConfig={"maxTokens": 128, "temperature": 0.0},
            )
            rewritten = response["output"]["message"]["content"][0]["text"].strip()
            print(f"[QUERY REWRITE] '{message}' -> '{rewritten}'")
            return rewritten
        except Exception as e:
            print(f"[QUERY REWRITE] Failed, using original query: {e}")
            return message

    def build_context(
        self,
        agent_id: str,
        message: str,
        config: RAGConfig | None = None,
    ) -> tuple[str | None, list, dict]:
        """Query S3 Vectors for documents belonging to agent_id, relevant to message.

        Returns:
            (context_string, used_contexts_list, trace_data_dict)
        """
        cfg = config or _DEFAULT_RAG_CONFIG
        start_ts = time.monotonic()

        try:
            # ── Query Rewriting (Fase 2) ───────────────────────────────────────
            rewritten_query: str | None = None
            search_message = message
            if cfg.query_rewriting_enabled:
                rewritten = self._rewrite_query(message, cfg.query_rewriting_model)
                if rewritten and rewritten != message:
                    rewritten_query = rewritten
                    search_message = rewritten

            embed_response = bedrock_embed_client.invoke_model(
                modelId=cfg.embedding_model,
                body=json.dumps({"inputText": search_message}),
            )
            embedding = json.loads(embed_response["body"].read())["embedding"]

            vec_response = s3vectors_client.query_vectors(
                vectorBucketName=env.rag_vector_bucket,
                indexName=env.rag_vector_index,
                queryVector={"float32": embedding},
                topK=cfg.top_k,
                filter={"agent_id": agent_id},
                returnDistance=True,
                returnMetadata=True,
            )
            vectors = vec_response.get("vectors", [])
            latency_ms = int((time.monotonic() - start_ts) * 1000)
            print(f"[CONTEXT] Agent {agent_id}: found {len(vectors)} relevant documents")

            context_parts = []
            used_contexts = []
            scores: list[float] = []
            documents_hit: list[str] = []

            for i, doc in enumerate(vectors):
                distance = doc.get("distance")
                # S3 Vectors returns cosine distance (0=identical, 2=opposite).
                # Convert to similarity score 0→1.
                score: float = round(1.0 - (distance / 2.0), 4) if distance is not None else 0.0
                scores.append(score)

                # Apply score threshold filter if configured
                if cfg.score_threshold is not None and score < cfg.score_threshold:
                    continue

                metadata = doc.get("metadata", {})
                source_text = metadata.get("source_text", "")
                document_name = metadata.get("source", f"Document_{i + 1}")

                if document_name not in documents_hit:
                    documents_hit.append(document_name)

                context_parts.append(f'[Documento origen "{document_name}": \n {source_text}]')
                used_contexts.append({
                    "content": source_text,
                    "metadata": metadata,
                    "score": score,
                    "rank": i + 1,
                })

            # Truncate combined context to configured max chars
            full_context = "\n\n".join(context_parts)
            if len(full_context) > cfg.context_max_chars:
                full_context = full_context[: cfg.context_max_chars]

            trace_data = {
                "query": message,
                "rewritten_query": rewritten_query,
                "chunks_retrieved": len(vectors),
                "chunks_used": len(used_contexts),
                "avg_score": round(sum(scores) / len(scores), 4) if scores else 0.0,
                "max_score": round(max(scores), 4) if scores else 0.0,
                "min_score": round(min(scores), 4) if scores else 0.0,
                "latency_ms": latency_ms,
                "embedding_model": cfg.embedding_model,
                "top_k_requested": cfg.top_k,
                "score_threshold": cfg.score_threshold,
                "documents_hit": documents_hit,
            }

            if context_parts:
                return (
                    "### Contexto base de conocimientos \n\n" + full_context,
                    used_contexts,
                    trace_data,
                )
            return None, [], trace_data

        except Exception as e:
            latency_ms = int((time.monotonic() - start_ts) * 1000)
            print(f"[CONTEXT] Failed to build context for agent {agent_id}: {e}")
            return None, [], {
                "query": message,
                "rewritten_query": None,
                "chunks_retrieved": 0,
                "chunks_used": 0,
                "avg_score": 0.0,
                "max_score": 0.0,
                "min_score": 0.0,
                "latency_ms": latency_ms,
                "embedding_model": cfg.embedding_model,
                "top_k_requested": cfg.top_k,
                "score_threshold": cfg.score_threshold,
                "documents_hit": [],
            }


rag_service = RAGService()

