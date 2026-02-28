import json
import boto3
from app.repositories import tool_repository
from app.models import ToolCreate, ToolUpdate
from app.config import env, PARSE_TOOL_DOCS_SYSTEM


class ToolService:
    def get_all(
        self,
        limit: int | None = None,
        cursor: str | None = None,
        account_id: str | None = None,
    ) -> list[dict] | dict:
        tools, next_cursor = tool_repository.get_all(limit=limit, cursor=cursor, account_id=account_id)
        items = [t.model_dump(mode='json') for t in tools]
        if limit is None:
            return items
        return {'items': items, 'next_cursor': next_cursor, 'count': len(items)}

    def get_by_ids(self, tool_ids: list[str]) -> list[dict]:
        tools = tool_repository.get_by_ids(tool_ids)
        return [t.model_dump(mode='json') for t in tools]

    def get_one(self, tool_id: str) -> dict | None:
        tool = tool_repository.get_by_id(tool_id)
        if not tool:
            return None
        return tool.model_dump(mode='json')

    def create(self, tool_data: ToolCreate, account_id: str = 'default') -> str | None:
        return tool_repository.create(tool_data, account_id=account_id)

    def update(self, tool_id: str, tool_data: ToolUpdate) -> bool:
        existing = tool_repository.get_by_id(tool_id)
        if not existing:
            return False
        return tool_repository.update(tool_id, tool_data)

    def delete(self, tool_id: str) -> bool:
        existing = tool_repository.get_by_id(tool_id)
        if not existing:
            return False
        return tool_repository.delete(tool_id)

    def parse_docs(self, docs: str) -> dict:
        bedrock = boto3.client(
            'bedrock-runtime',
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key
        )

        response = bedrock.converse(
            modelId='us.anthropic.claude-sonnet-4-20250514-v1:0',
            messages=[{
                'role': 'user',
                'content': [{'text': docs}]
            }],
            system=[{'text': PARSE_TOOL_DOCS_SYSTEM}],
            inferenceConfig={
                'maxTokens': 4000,
                'temperature': 0.1
            }
        )

        raw = response['output']['message']['content'][0]['text'].strip()

        # Strip markdown code fences if present
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]

        return json.loads(raw)


tool_service = ToolService()