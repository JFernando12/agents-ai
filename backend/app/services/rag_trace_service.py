from app.models.rag_trace import RAGMetrics, RAGTrace, RAGTracesResponse
from app.repositories.rag_trace_repository import rag_trace_repository


class RAGTraceService:
    def get_traces(
        self,
        agent_id: str,
        limit: int = 50,
        last_key: dict | None = None,
    ) -> RAGTracesResponse:
        return rag_trace_repository.get_by_agent(
            agent_id=agent_id,
            limit=limit,
            last_key=last_key,
        )

    def get_metrics(self, agent_id: str) -> RAGMetrics:
        return rag_trace_repository.get_metrics(agent_id=agent_id)

    def get_trace(self, trace_id: str):
        return rag_trace_repository.get_by_id(trace_id)


rag_trace_service = RAGTraceService()
