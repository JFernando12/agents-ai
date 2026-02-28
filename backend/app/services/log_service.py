from decimal import Decimal

from app.repositories import log_repository
from app.models import LogsResponse


def convert_decimals(obj):
    """Convert Decimal objects to int or float for JSON serialization."""
    if isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    elif isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    return obj


class LogService:
    def get_all(self, limit: int = 20, last_key: dict | None = None, account_id: str | None = None) -> dict:
        logs_response: LogsResponse = log_repository.get(limit=limit, last_key=last_key, account_id=account_id)

        result = []

        for log in logs_response.items:
            log_dict = log.model_dump(mode='json')

            before = log_dict.get("agent_before_state")
            if isinstance(before, dict):
                before.pop("created_at", None)
                before.pop("updated_at", None)

            after = log_dict.get("agent_after_state")
            if isinstance(after, dict):
                after.pop("created_at", None)
                after.pop("updated_at", None)

            result.append(log_dict)

        return {
            "items": result,
            "lastEvaluatedKey": convert_decimals(logs_response.lastKey),
            "pageSize": logs_response.pageSize,
            "hasMore": logs_response.hasMore
        }
    
log_service = LogService()