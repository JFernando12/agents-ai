import uuid
from collections import Counter
from datetime import datetime
from decimal import Decimal
from typing import Any

from app.config import env
from app.models.rag_trace import RAGMetrics, RAGTrace, RAGTraceCreate, RAGTracesResponse
from app.repositories.base_dynamodb_repository import BaseDynamoDBRepository


def _floats_to_decimal(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _floats_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_floats_to_decimal(i) for i in obj]
    if isinstance(obj, float):
        return Decimal(str(obj))
    return obj


def _decimal_to_python(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _decimal_to_python(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_decimal_to_python(i) for i in obj]
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


class RAGTraceRepository(BaseDynamoDBRepository):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.dynamodb.Table(env.rag_trace_table)  # type: ignore

    def save(self, trace: RAGTraceCreate) -> str:
        trace_id = str(uuid.uuid4())
        created_at = int(datetime.now().timestamp() * 1000)

        item: dict = {
            "id": trace_id,
            "agent_id": trace.agent_id,
            "query": trace.query,
            "chunks_retrieved": trace.chunks_retrieved,
            "chunks_used": trace.chunks_used,
            "avg_score": Decimal(str(trace.avg_score)),
            "max_score": Decimal(str(trace.max_score)),
            "min_score": Decimal(str(trace.min_score)),
            "latency_ms": trace.latency_ms,
            "embedding_model": trace.embedding_model,
            "top_k_requested": trace.top_k_requested,
            "documents_hit": trace.documents_hit,
            "created_at": created_at,
        }
        if trace.conversation_id:
            item["conversation_id"] = trace.conversation_id
        if trace.score_threshold is not None:
            item["score_threshold"] = Decimal(str(trace.score_threshold))
        if trace.rewritten_query:
            item["rewritten_query"] = trace.rewritten_query

        self.table.put_item(Item=item)
        return trace_id

    def get_by_agent(
        self,
        agent_id: str,
        limit: int = 50,
        last_key: dict | None = None,
    ) -> RAGTracesResponse:
        params: dict = {
            "IndexName": "agent_id-created_at-index",
            "KeyConditionExpression": "agent_id = :agent_id",
            "ExpressionAttributeValues": {":agent_id": agent_id},
            "ScanIndexForward": False,  # newest first
            "Limit": limit,
        }
        if last_key:
            params["ExclusiveStartKey"] = last_key

        response = self.table.query(**params)
        raw_items = [_decimal_to_python(item) for item in response.get("Items", [])]

        traces = [
            RAGTrace(
                id=r["id"],
                agent_id=r["agent_id"],
                conversation_id=r.get("conversation_id"),
                query=r["query"],
                rewritten_query=r.get("rewritten_query"),
                chunks_retrieved=r["chunks_retrieved"],
                chunks_used=r["chunks_used"],
                avg_score=r["avg_score"],
                max_score=r["max_score"],
                min_score=r["min_score"],
                latency_ms=r["latency_ms"],
                embedding_model=r["embedding_model"],
                top_k_requested=r["top_k_requested"],
                score_threshold=r.get("score_threshold"),
                documents_hit=r.get("documents_hit", []),
                created_at=datetime.fromtimestamp(r["created_at"] / 1000),
            )
            for r in raw_items
        ]

        new_last_key = response.get("LastEvaluatedKey")
        return RAGTracesResponse(
            items=traces,
            last_key=_decimal_to_python(new_last_key) if new_last_key else None,
            has_more=new_last_key is not None,
        )

    def get_metrics(self, agent_id: str, sample_limit: int = 200) -> RAGMetrics:
        """Compute aggregate metrics for an agent using the N most recent traces."""
        response = self.table.query(
            IndexName="agent_id-created_at-index",
            KeyConditionExpression="agent_id = :agent_id",
            ExpressionAttributeValues={":agent_id": agent_id},
            ScanIndexForward=False,
            Limit=sample_limit,
        )
        items = [_decimal_to_python(i) for i in response.get("Items", [])]
        total = len(items)

        if total == 0:
            return RAGMetrics(
                agent_id=agent_id,
                total_queries=0,
                queries_with_results=0,
                queries_without_results=0,
                hit_rate=0.0,
                avg_chunks_retrieved=0.0,
                avg_chunks_used=0.0,
                avg_score=0.0,
                avg_latency_ms=0.0,
                top_documents=[],
            )

        queries_with_results = sum(1 for i in items if i.get("chunks_used", 0) > 0)
        avg_chunks_retrieved = round(sum(i.get("chunks_retrieved", 0) for i in items) / total, 2)
        avg_chunks_used = round(sum(i.get("chunks_used", 0) for i in items) / total, 2)
        avg_score = round(sum(i.get("avg_score", 0.0) for i in items) / total, 4)
        avg_latency_ms = round(sum(i.get("latency_ms", 0) for i in items) / total, 1)

        doc_counter: Counter = Counter()
        for item in items:
            for doc in item.get("documents_hit", []):
                doc_counter[doc] += 1

        top_documents = [
            {"document": doc, "hits": count}
            for doc, count in doc_counter.most_common(10)
        ]

        return RAGMetrics(
            agent_id=agent_id,
            total_queries=total,
            queries_with_results=queries_with_results,
            queries_without_results=total - queries_with_results,
            hit_rate=round(queries_with_results / total, 4),
            avg_chunks_retrieved=avg_chunks_retrieved,
            avg_chunks_used=avg_chunks_used,
            avg_score=avg_score,
            avg_latency_ms=avg_latency_ms,
            top_documents=top_documents,
        )


rag_trace_repository = RAGTraceRepository()
