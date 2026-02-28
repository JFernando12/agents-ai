import uuid
import json
import base64
from datetime import datetime
from boto3.dynamodb.conditions import Key

from app.config import env
from app.models import Tool, ToolCreate, ToolUpdate
from .base_dynamodb_repository import BaseDynamoDBRepository


def _encode_cursor(last_evaluated_key: dict) -> str:
    """Serialize DynamoDB LastEvaluatedKey to a URL-safe base64 string."""
    return base64.urlsafe_b64encode(json.dumps(last_evaluated_key).encode()).decode()


def _decode_cursor(cursor: str) -> dict:
    """Deserialize a cursor string back to a DynamoDB ExclusiveStartKey."""
    return json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())


class ToolRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.tool_table = self.dynamodb.Table(env.tool_table)  # type: ignore

    def _map_to_tool(self, item: dict) -> Tool:
        return Tool(
            id=item['id'],
            product_id=item.get('product_id', ''),
            section=item.get('section') or None,
            name=item['name'],
            display_name=item['display_name'],
            description=item['description'],
            url=item['url'],
            method=item['method'],
            headers=item.get('headers') or None,
            input_schema=item.get('input_schema', {}),
            all_tools=item.get('all_tools'),
            created_at=datetime.fromtimestamp(self._decimal_to_float(item['created_at']) / 1000),
            updated_at=datetime.fromtimestamp(self._decimal_to_float(item['updated_at']) / 1000),
        )

    def create(self, tool_data: ToolCreate) -> str:
        tool_id = str(uuid.uuid4())
        now = int(datetime.now().timestamp() * 1000)

        item = {
            'id': tool_id,
            'product_id': tool_data.product_id,
            'section': tool_data.section or '',
            'name': tool_data.name,
            'display_name': tool_data.display_name,
            'description': tool_data.description,
            'url': tool_data.url,
            'method': tool_data.method.upper(),
            'headers': tool_data.headers or {},
            'input_schema': tool_data.input_schema,
            'all_tools': '1',  # GSI partition key for get_all() queries
            'created_at': now,
            'updated_at': now,
        }

        self.tool_table.put_item(Item=item)
        return tool_id

    def get_by_id(self, tool_id: str) -> Tool | None:
        try:
            response = self.tool_table.get_item(Key={'id': tool_id})
            if 'Item' not in response:
                return None
            return self._map_to_tool(response['Item'])
        except Exception as e:
            print(f"Error getting tool by ID {tool_id}: {e}")
            return None

    def get_by_ids(self, tool_ids: list[str]) -> list[Tool]:
        """Batch-fetch tools by a list of IDs using DynamoDB batch_get_item (up to 100/request)."""
        if not tool_ids:
            return []
        tools: list[Tool] = []
        table_name = self.tool_table.name
        chunk_size = 100
        try:
            for i in range(0, len(tool_ids), chunk_size):
                chunk = list(dict.fromkeys(tool_ids[i:i + chunk_size]))  # deduplicate
                request_items: dict = {
                    table_name: {
                        'Keys': [{'id': tool_id} for tool_id in chunk]
                    }
                }
                while request_items:
                    response = self.dynamodb.batch_get_item(RequestItems=request_items)
                    items = response.get('Responses', {}).get(table_name, [])
                    tools.extend(self._map_to_tool(item) for item in items)
                    # Retry unprocessed keys (DynamoDB may return them under high load)
                    request_items = response.get('UnprocessedKeys', {})
        except Exception as e:
            print(f"Error batch-fetching tools {tool_ids}: {e}")
        return tools

    def get_all(
        self,
        limit: int | None = None,
        cursor: str | None = None,
    ) -> tuple[list[Tool], str | None]:
        """Query all tools using all_tools GSI with constant partition key."""
        try:
            kwargs: dict = {
                'IndexName': 'all_tools-index',
                'KeyConditionExpression': Key('all_tools').eq('1')
            }
            if cursor:
                kwargs['ExclusiveStartKey'] = _decode_cursor(cursor)

            if limit is None:
                # Get all tools
                items: list[dict] = []
                while True:
                    response = self.tool_table.query(**kwargs)
                    items.extend(response.get('Items', []))
                    last_key = response.get('LastEvaluatedKey')
                    if not last_key:
                        break
                    kwargs['ExclusiveStartKey'] = last_key
                return [self._map_to_tool(item) for item in items], None
            else:
                # Single page with limit
                kwargs['Limit'] = limit
                response = self.tool_table.query(**kwargs)
                items = response.get('Items', [])
                last_key = response.get('LastEvaluatedKey')
                next_cursor = _encode_cursor(last_key) if last_key else None
                return [self._map_to_tool(item) for item in items], next_cursor
        except Exception as e:
            print(f"Error getting all tools: {e}")
            return [], None

    def get_by_product(
        self,
        product_id: str,
        limit: int | None = None,
        cursor: str | None = None,
    ) -> tuple[list[Tool], str | None]:
        """Query tools by product_id using GSI."""
        try:
            kwargs: dict = {
                'IndexName': 'product_id-index',
                'KeyConditionExpression': Key('product_id').eq(product_id)
            }
            if cursor:
                kwargs['ExclusiveStartKey'] = _decode_cursor(cursor)

            if limit is None:
                # Get all items for this product
                items: list[dict] = []
                while True:
                    response = self.tool_table.query(**kwargs)
                    items.extend(response.get('Items', []))
                    last_key = response.get('LastEvaluatedKey')
                    if not last_key:
                        break
                    kwargs['ExclusiveStartKey'] = last_key
                return [self._map_to_tool(item) for item in items], None
            else:
                # Single page with limit
                kwargs['Limit'] = limit
                response = self.tool_table.query(**kwargs)
                items = response.get('Items', [])
                last_key = response.get('LastEvaluatedKey')
                next_cursor = _encode_cursor(last_key) if last_key else None
                return [self._map_to_tool(item) for item in items], next_cursor
        except Exception as e:
            print(f"Error getting tools for product {product_id}: {e}")
            return [], None

    def update(self, tool_id: str, tool_data: ToolUpdate) -> bool:
        try:
            now = int(datetime.now().timestamp() * 1000)

            updates: dict = {'updated_at': now}
            if tool_data.product_id is not None:
                updates['product_id'] = tool_data.product_id
            if tool_data.section is not None:
                updates['section'] = tool_data.section
            if tool_data.name is not None:
                updates['name'] = tool_data.name
            if tool_data.display_name is not None:
                updates['display_name'] = tool_data.display_name
            if tool_data.description is not None:
                updates['description'] = tool_data.description
            if tool_data.url is not None:
                updates['url'] = tool_data.url
            if tool_data.method is not None:
                updates['method'] = tool_data.method.upper()
            if tool_data.headers is not None:
                updates['headers'] = tool_data.headers
            if tool_data.input_schema is not None:
                updates['input_schema'] = tool_data.input_schema
            # Ensure all_tools field exists for GSI
            updates['all_tools'] = '1'

            update_expr = 'SET ' + ', '.join(f'#{k} = :{k}' for k in updates)
            expr_names = {f'#{k}': k for k in updates}
            expr_values = {f':{k}': v for k, v in updates.items()}

            self.tool_table.update_item(
                Key={'id': tool_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values
            )
            return True
        except Exception as e:
            print(f"Error updating tool {tool_id}: {e}")
            return False

    def delete(self, tool_id: str) -> bool:
        try:
            self.tool_table.delete_item(Key={'id': tool_id})
            return True
        except Exception as e:
            print(f"Error deleting tool {tool_id}: {e}")
            return False


tool_repository = ToolRepository()
