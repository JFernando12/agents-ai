import json
import uuid
from decimal import Decimal
from datetime import datetime

from app.config import env
from app.models import Log, CreateLog, LogsResponse, Agent
from app.repositories import BaseDynamoDBRepository

class LogRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.log_table = self.dynamodb.Table(env.log_table) # type: ignore
    
    def save(self, log_data: CreateLog) -> str:
        log_id = str(uuid.uuid4())
        current_time_timestamp = int(datetime.now().timestamp() * 1000)
        
        def convert_floats_to_decimal(obj):
            if isinstance(obj, dict):
                return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_floats_to_decimal(item) for item in obj]
            elif isinstance(obj, float):
                return Decimal(str(obj))
            return obj
        
        agent_before = None
        if log_data.agent_before_state:
            agent_before = json.loads(log_data.agent_before_state.model_dump_json())
            agent_before = convert_floats_to_decimal(agent_before)
        
        agent_after = None
        if log_data.agent_after_state:
            agent_after = json.loads(log_data.agent_after_state.model_dump_json())
            agent_after = convert_floats_to_decimal(agent_after)
        
        item = {
            'id': log_id,
            'log_id': 'LOG',
            'user': log_data.user,
            'agent_id': log_data.agent_id,
            'agent_name': log_data.agent_name,
            'action': log_data.action,
            'account_id': log_data.account_id,
            'agent_before_state': agent_before,
            'agent_after_state': agent_after,
            'detail': log_data.detail,
            'created_at': current_time_timestamp,
        }
        
        self.log_table.put_item(Item=item)
        return log_id
    
    def get(self, limit: int = 20, last_key: dict | None = None, account_id: str | None = None) -> LogsResponse:
        params = {
            "IndexName": "log_id-created_at-index",
            "KeyConditionExpression": "log_id = :log_id",
            "ExpressionAttributeValues": {
                ":log_id": "LOG"
            },
            "Limit": limit,
            "ScanIndexForward": False
        }
        if account_id:
            params["FilterExpression"] = "account_id = :account_id"
            params["ExpressionAttributeValues"][":account_id"] = account_id
        if last_key:
            params["ExclusiveStartKey"] = last_key

        response = self.log_table.query(**params)
        logs = []
        for item in response['Items']:
            log = Log(
                id=item['id'],
                user=item['user'],
                agent_id=item.get('agent_id', ''),
                agent_name=item.get('agent_name', ''),
                action=item['action'],
                agent_before_state=Agent(**item['agent_before_state']) if item.get('agent_before_state') else None,
                agent_after_state=Agent(**item['agent_after_state']) if item.get('agent_after_state') else None,
                detail=item.get('detail'),
                created_at=item['created_at']
            )
            logs.append(log)
        return LogsResponse(
                items=logs,
                lastKey=response.get("LastEvaluatedKey"),
                pageSize=limit,
                hasMore="LastEvaluatedKey" in response
            )

log_repository = LogRepository()
