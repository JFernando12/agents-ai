import json
import uuid
from datetime import datetime
from decimal import Decimal

from app.config import env
from app.models.execution import (
    ExecutionTrace,
    ExecutionTraceCreate,
    ExecutionTracesResponse,
    ToolCallTrace,
)
from app.repositories.base_dynamodb_repository import BaseDynamoDBRepository


def _floats_to_decimal(obj):
    if isinstance(obj, dict):
        return {k: _floats_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_floats_to_decimal(i) for i in obj]
    if isinstance(obj, float):
        return Decimal(str(obj))
    return obj


def _decimal_to_python(obj):
    if isinstance(obj, dict):
        return {k: _decimal_to_python(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_decimal_to_python(i) for i in obj]
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


class ExecutionTraceRepository(BaseDynamoDBRepository):
    def __init__(self) -> None:
        super().__init__()
        self.table = self.dynamodb.Table(env.execution_trace_table)  # type: ignore

    def save(self, trace: ExecutionTraceCreate) -> str:
        trace_id = str(uuid.uuid4())
        created_at = int(datetime.now().timestamp() * 1000)

        tool_calls_raw = [
            _floats_to_decimal(tc.model_dump()) for tc in trace.tool_calls
        ]

        item = {
            "id": trace_id,
            "agent_id": trace.agent_id,
            "agent_name": trace.agent_name,
            "user": trace.user,
            "account_id": trace.account_id,
            "user_message": trace.user_message,
            "final_response": trace.final_response,
            "tool_calls": tool_calls_raw,
            "total_iterations": trace.total_iterations,
            "duration_ms": trace.duration_ms,
            "was_answered": trace.was_answered,
            "created_at": created_at,
        }
        if trace.conversation_id:
            item["conversation_id"] = trace.conversation_id

        self.table.put_item(Item=item)
        return trace_id

    def get_by_account(
        self,
        account_id: str,
        agent_id: str | None = None,
        limit: int = 20,
        last_key: dict | None = None,
    ) -> ExecutionTracesResponse:
        params: dict = {
            "IndexName": "account_id-created_at-index",
            "KeyConditionExpression": "account_id = :account_id",
            "ExpressionAttributeValues": {":account_id": account_id},
            "Limit": limit,
            "ScanIndexForward": False,
        }
        if agent_id:
            params["FilterExpression"] = "agent_id = :agent_id"
            params["ExpressionAttributeValues"][":agent_id"] = agent_id
        if last_key:
            params["ExclusiveStartKey"] = last_key

        response = self.table.query(**params)
        items = [self._to_model(item) for item in response.get("Items", [])]
        last_evaluated = response.get("LastEvaluatedKey")

        return ExecutionTracesResponse(
            items=items,
            lastKey=_decimal_to_python(last_evaluated) if last_evaluated else None,
            hasMore=bool(last_evaluated),
        )

    def get_by_id(self, trace_id: str) -> ExecutionTrace | None:
        response = self.table.get_item(Key={"id": trace_id})
        item = response.get("Item")
        if not item:
            return None
        return self._to_model(item)

    def _to_model(self, item: dict) -> ExecutionTrace:
        tool_calls = [
            ToolCallTrace(**_decimal_to_python(tc))
            for tc in item.get("tool_calls", [])
        ]
        return ExecutionTrace(
            id=item["id"],
            agent_id=item["agent_id"],
            agent_name=item.get("agent_name", ""),
            user=item.get("user", ""),
            account_id=item.get("account_id", "default"),
            conversation_id=item.get("conversation_id"),
            user_message=item.get("user_message", ""),
            final_response=item.get("final_response", ""),
            tool_calls=tool_calls,
            total_iterations=int(item.get("total_iterations", 0)),
            duration_ms=int(item.get("duration_ms", 0)),
            was_answered=bool(item.get("was_answered", True)),
            created_at=datetime.fromtimestamp(int(item["created_at"]) / 1000),
        )


execution_trace_repository = ExecutionTraceRepository()
