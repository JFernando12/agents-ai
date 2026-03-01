import json
import math
import re
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


def _bm25_scores(query: str, texts: list[str], k1: float = 1.5, b: float = 0.75) -> list[float]:
    """Compute local BM25 scores for *query* against a small candidate set."""

    def _tokenize(text: str) -> list[str]:
        return re.findall(r'\b\w+\b', text.lower())

    query_terms = _tokenize(query)
    if not query_terms:
        return [0.0] * len(texts)

    tokenized = [_tokenize(t) for t in texts]
    N = len(tokenized)
    avgdl = sum(len(d) for d in tokenized) / N if N else 1

    df: dict[str, int] = {}
    for doc in tokenized:
        for term in set(doc):
            df[term] = df.get(term, 0) + 1

    scores: list[float] = []
    for doc_tokens in tokenized:
        doc_len = len(doc_tokens)
        tf: dict[str, int] = {}
        for t in doc_tokens:
            tf[t] = tf.get(t, 0) + 1
        score = 0.0
        for term in query_terms:
            if term not in df:
                continue
            idf = math.log((N - df[term] + 0.5) / (df[term] + 0.5) + 1)
            freq = tf.get(term, 0)
            score += idf * (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * doc_len / avgdl))
        scores.append(score)
    return scores

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

            # Fetch extra candidates when hybrid search is on
            fetch_k = cfg.top_k * 3 if cfg.hybrid_search_enabled else cfg.top_k

            vec_response = s3vectors_client.query_vectors(
                vectorBucketName=env.rag_vector_bucket,
                indexName=env.rag_vector_index,
                queryVector={"float32": embedding},
                topK=fetch_k,
                filter={"agent_id": agent_id},
                returnDistance=True,
                returnMetadata=True,
            )
            vectors = vec_response.get("vectors", [])
            latency_ms = int((time.monotonic() - start_ts) * 1000)
            print(f"[CONTEXT] Agent {agent_id}: found {len(vectors)} relevant documents")

            # ── Fase 5: Hybrid BM25 re-ranking ─────────────────────────────────────
            if cfg.hybrid_search_enabled and vectors:
                alpha = cfg.hybrid_alpha
                texts = [
                    doc.get("metadata", {}).get("source_text", "") for doc in vectors
                ]
                bm25_raw = _bm25_scores(search_message, texts)
                max_bm25 = max(bm25_raw) or 1.0

                # Semantic scores already 0–1 (converted from distance below in loop)
                sem_scores = [
                    round(1.0 - (doc.get("distance", 1.0) / 2.0), 4)
                    for doc in vectors
                ]
                max_sem = max(sem_scores) or 1.0

                combined = [
                    alpha * (s / max_sem) + (1 - alpha) * (b / max_bm25)
                    for s, b in zip(sem_scores, bm25_raw)
                ]
                # Sort by combined score desc, keep top_k
                ranked = sorted(
                    zip(combined, vectors), key=lambda x: x[0], reverse=True
                )[: cfg.top_k]
                # Inject combined score as synthetic distance so loop below works
                vectors = []
                for combined_score, doc in ranked:
                    doc_copy = dict(doc)
                    doc_copy["distance"] = round((1.0 - combined_score) * 2.0, 4)
                    vectors.append(doc_copy)
                print(f"[HYBRID] Re-ranked to {len(vectors)} chunks (alpha={alpha})")

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
                "hybrid_search_used": cfg.hybrid_search_enabled,
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

