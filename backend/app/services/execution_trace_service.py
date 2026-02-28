from app.models.execution import ExecutionTraceCreate
from app.repositories.execution_trace_repository import execution_trace_repository


class ExecutionTraceService:
    def save(self, trace: ExecutionTraceCreate) -> str:
        return execution_trace_repository.save(trace)

    def get_all(
        self,
        account_id: str,
        agent_id: str | None = None,
        limit: int = 20,
        last_key: dict | None = None,
    ) -> dict:
        response = execution_trace_repository.get_by_account(
            account_id=account_id,
            agent_id=agent_id,
            limit=limit,
            last_key=last_key,
        )
        return {
            "items": [t.model_dump(mode="json") for t in response.items],
            "lastKey": response.lastKey,
            "hasMore": response.hasMore,
        }

    def get_by_id(self, trace_id: str) -> dict | None:
        trace = execution_trace_repository.get_by_id(trace_id)
        if not trace:
            return None
        return trace.model_dump(mode="json")


execution_trace_service = ExecutionTraceService()
