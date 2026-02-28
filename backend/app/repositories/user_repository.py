import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr

from app.config import env
from app.models import UserRecord, UserCreate, UserUpdate
from .base_dynamodb_repository import BaseDynamoDBRepository


class UserRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.table = self.dynamodb.Table(env.user_table)  # type: ignore

    def create(self, user_data: UserCreate, account_id: str, password_hash: str) -> str:
        user_id = str(uuid.uuid4())
        now = int(datetime.now().timestamp() * 1000)

        item = {
            'id': user_id,
            'name': user_data.name,
            'email': user_data.email.lower().strip(),
            'password_hash': password_hash,
            'role': user_data.role,
            'account_id': account_id,
            'status': 'active',
            'created_at': now,
            'updated_at': now,
        }

        self.table.put_item(Item=item)
        return user_id

    def get_by_id(self, user_id: str) -> UserRecord | None:
        try:
            response = self.table.get_item(Key={'id': user_id})
            if 'Item' not in response:
                return None
            return self._to_model(response['Item'])
        except Exception as e:
            print(f"Error getting user {user_id}: {e}")
            return None

    def get_by_email(self, email: str) -> UserRecord | None:
        try:
            response = self.table.query(
                IndexName='email-index',
                KeyConditionExpression=Key('email').eq(email.lower().strip()),
            )
            items = response.get('Items', [])
            if not items:
                return None
            return self._to_model(items[0])
        except Exception as e:
            print(f"Error getting user by email {email}: {e}")
            return None

    def get_by_account(self, account_id: str) -> list[UserRecord]:
        try:
            response = self.table.query(
                IndexName='account_id-index',
                KeyConditionExpression=Key('account_id').eq(account_id),
            )
            return [self._to_model(item) for item in response.get('Items', [])]
        except Exception as e:
            print(f"Error listing users for account {account_id}: {e}")
            return []

    def update(self, user_id: str, user_data: UserUpdate) -> bool:
        try:
            now = int(datetime.now().timestamp() * 1000)
            update_parts = ["updated_at = :updated_at"]
            expr_values = {':updated_at': now}
            expr_names: dict = {}

            if user_data.name is not None:
                update_parts.append("#name = :name")
                expr_values[':name'] = user_data.name
                expr_names['#name'] = 'name'
            if user_data.role is not None:
                update_parts.append("#role = :role")
                expr_values[':role'] = user_data.role
                expr_names['#role'] = 'role'
            if user_data.status is not None:
                update_parts.append("#status = :status")
                expr_values[':status'] = user_data.status
                expr_names['#status'] = 'status'

            kwargs = {
                'Key': {'id': user_id},
                'UpdateExpression': 'SET ' + ', '.join(update_parts),
                'ExpressionAttributeValues': expr_values,
            }
            if expr_names:
                kwargs['ExpressionAttributeNames'] = expr_names

            self.table.update_item(**kwargs)
            return True
        except Exception as e:
            print(f"Error updating user {user_id}: {e}")
            return False

    def update_password(self, user_id: str, password_hash: str) -> bool:
        try:
            now = int(datetime.now().timestamp() * 1000)
            self.table.update_item(
                Key={'id': user_id},
                UpdateExpression='SET password_hash = :h, updated_at = :u',
                ExpressionAttributeValues={':h': password_hash, ':u': now},
            )
            return True
        except Exception as e:
            print(f"Error updating password for user {user_id}: {e}")
            return False

    def delete(self, user_id: str) -> bool:
        try:
            self.table.delete_item(Key={'id': user_id})
            return True
        except Exception as e:
            print(f"Error deleting user {user_id}: {e}")
            return False

    @staticmethod
    def _to_model(item: dict) -> UserRecord:
        return UserRecord(
            id=item['id'],
            name=item['name'],
            email=item['email'],
            password_hash=item['password_hash'],
            role=item['role'],
            account_id=item['account_id'],
            status=item.get('status', 'active'),
            created_at=datetime.fromtimestamp(int(item['created_at']) / 1000),
            updated_at=datetime.fromtimestamp(int(item['updated_at']) / 1000),
        )


user_repository = UserRepository()
