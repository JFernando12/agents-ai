import uuid
import re
from datetime import datetime

from app.config import env
from app.models import Account, AccountCreate, AccountUpdate
from .base_dynamodb_repository import BaseDynamoDBRepository


def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    return slug[:60]


class AccountRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.table = self.dynamodb.Table(env.account_table)  # type: ignore

    def create(self, account_data: AccountCreate) -> str:
        account_id = str(uuid.uuid4())
        now = int(datetime.now().timestamp() * 1000)
        slug = _slugify(account_data.account_name)

        item = {
            'id': account_id,
            'name': account_data.account_name,
            'slug': slug,
            'status': 'active',
            'plan': 'free',
            'owner_email': account_data.email,
            'created_at': now,
            'updated_at': now,
        }

        self.table.put_item(Item=item)
        return account_id

    def get_by_id(self, account_id: str) -> Account | None:
        try:
            response = self.table.get_item(Key={'id': account_id})
            if 'Item' not in response:
                return None
            return self._to_model(response['Item'])
        except Exception as e:
            print(f"Error getting account {account_id}: {e}")
            return None

    def get_all(self) -> list[Account]:
        try:
            response = self.table.scan()
            return [self._to_model(item) for item in response.get('Items', [])]
        except Exception as e:
            print(f"Error listing accounts: {e}")
            return []

    def update(self, account_id: str, account_data: AccountUpdate) -> bool:
        try:
            now = int(datetime.now().timestamp() * 1000)
            update_expr_parts = ["updated_at = :updated_at"]
            expr_values = {':updated_at': now}

            if account_data.name is not None:
                update_expr_parts.append("name = :name")
                expr_values[':name'] = account_data.name
            if account_data.status is not None:
                update_expr_parts.append("#status = :status")
                expr_values[':status'] = account_data.status
            if account_data.plan is not None:
                update_expr_parts.append("plan = :plan")
                expr_values[':plan'] = account_data.plan

            self.table.update_item(
                Key={'id': account_id},
                UpdateExpression='SET ' + ', '.join(update_expr_parts),
                ExpressionAttributeNames={'#status': 'status'} if account_data.status else {},
                ExpressionAttributeValues=expr_values,
            )
            return True
        except Exception as e:
            print(f"Error updating account {account_id}: {e}")
            return False

    def delete(self, account_id: str) -> bool:
        try:
            self.table.delete_item(Key={'id': account_id})
            return True
        except Exception as e:
            print(f"Error deleting account {account_id}: {e}")
            return False

    @staticmethod
    def _to_model(item: dict) -> Account:
        return Account(
            id=item['id'],
            name=item['name'],
            slug=item['slug'],
            status=item.get('status', 'active'),
            plan=item.get('plan', 'free'),
            owner_email=item['owner_email'],
            created_at=datetime.fromtimestamp(int(item['created_at']) / 1000),
            updated_at=datetime.fromtimestamp(int(item['updated_at']) / 1000),
        )


account_repository = AccountRepository()
