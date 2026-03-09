import uuid
from datetime import datetime
from typing import Optional

import boto3
from boto3.dynamodb.conditions import Key, Attr

from app.config import env
from app.models.whatsapp import WhatsAppChannel, WhatsAppSession, WhatsAppMessage
from .base_dynamodb_repository import BaseDynamoDBRepository


class WhatsAppRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self.channel_table = self.dynamodb.Table(env.whatsapp_channel_table)
        self.session_table = self.dynamodb.Table(env.whatsapp_session_table)
        self.message_table = self.dynamodb.Table(env.whatsapp_message_table)

    # ── Channels ─────────────────────────────────────────────────────────────

    def create_channel(self, channel: dict) -> str:
        channel_id = str(uuid.uuid4())
        now = int(datetime.now().timestamp() * 1000)
        item = {
            'id': channel_id,
            'account_id': channel['account_id'],
            'agent_id': channel['agent_id'],
            'name': channel['name'],
            'phone_number_id': channel['phone_number_id'],
            'wa_token': channel['wa_token'],
            'verify_token': channel['verify_token'],
            'is_active': 1,
            'created_at': now,
            'updated_at': now,
        }
        if channel.get('app_secret'):
            item['app_secret'] = channel['app_secret']
        self.channel_table.put_item(Item=item)
        return channel_id

    def get_channel(self, channel_id: str) -> Optional[WhatsAppChannel]:
        response = self.channel_table.get_item(Key={'id': channel_id})
        if 'Item' not in response:
            return None
        return self._map_channel(response['Item'])

    def get_channels_by_account(self, account_id: str) -> list[WhatsAppChannel]:
        response = self.channel_table.query(
            IndexName='account_id-index',
            KeyConditionExpression=Key('account_id').eq(account_id),
        )
        return [self._map_channel(item) for item in response.get('Items', [])]

    def update_channel(self, channel_id: str, updates: dict) -> bool:
        now = int(datetime.now().timestamp() * 1000)
        updates['updated_at'] = now

        expressions = []
        attr_names = {}
        attr_values = {}

        for key, value in updates.items():
            safe_key = f'#{key}'
            attr_names[safe_key] = key
            attr_values[f':{key}'] = value
            expressions.append(f'{safe_key} = :{key}')

        try:
            self.channel_table.update_item(
                Key={'id': channel_id},
                UpdateExpression='SET ' + ', '.join(expressions),
                ExpressionAttributeNames=attr_names,
                ExpressionAttributeValues=attr_values,
                ConditionExpression='attribute_exists(id)',
            )
            return True
        except self.dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
            return False

    def delete_channel(self, channel_id: str) -> bool:
        try:
            self.channel_table.delete_item(
                Key={'id': channel_id},
                ConditionExpression='attribute_exists(id)',
            )
            return True
        except self.dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
            return False

    # ── Sessions ─────────────────────────────────────────────────────────────

    def get_or_create_session(
        self,
        channel_id: str,
        from_phone: str,
        contact_name: Optional[str],
        conversation_id: str,
        agent_id: str,
    ) -> WhatsAppSession:
        existing = self.find_session_by_phone(channel_id, from_phone)
        if existing:
            return existing

        session_id = str(uuid.uuid4())
        now = int(datetime.now().timestamp() * 1000)
        item = {
            'id': session_id,
            'channel_id': channel_id,
            'from_phone': from_phone,
            'contact_name': contact_name or from_phone,
            'conversation_id': conversation_id,
            'agent_id': agent_id,
            'status': 'active',
            'last_message_at': now,
            'last_message_preview': '',
            'unread_count': 0,
        }
        self.session_table.put_item(Item=item)
        return self._map_session(item)

    def find_session_by_phone(self, channel_id: str, from_phone: str) -> Optional[WhatsAppSession]:
        response = self.session_table.query(
            IndexName='channel_id-from_phone-index',
            KeyConditionExpression=Key('channel_id').eq(channel_id) & Key('from_phone').eq(from_phone),
            Limit=1,
        )
        items = response.get('Items', [])
        if not items:
            return None
        return self._map_session(items[0])

    def get_sessions_by_channel(
        self,
        channel_id: str,
        limit: int = 20,
        last_key: Optional[dict] = None,
    ) -> tuple[list[WhatsAppSession], Optional[dict]]:
        kwargs: dict = {
            'IndexName': 'channel_id-last_message_at-index',
            'KeyConditionExpression': Key('channel_id').eq(channel_id),
            'Limit': limit,
            'ScanIndexForward': False,
        }
        if last_key:
            kwargs['ExclusiveStartKey'] = last_key
        response = self.session_table.query(**kwargs)
        sessions = [self._map_session(item) for item in response.get('Items', [])]
        next_key = response.get('LastEvaluatedKey')
        return sessions, next_key

    def update_session(self, session_id: str, updates: dict) -> None:
        expressions = []
        attr_names = {}
        attr_values = {}
        for key, value in updates.items():
            safe_key = f'#{key}'
            attr_names[safe_key] = key
            attr_values[f':{key}'] = value
            expressions.append(f'{safe_key} = :{key}')
        self.session_table.update_item(
            Key={'id': session_id},
            UpdateExpression='SET ' + ', '.join(expressions),
            ExpressionAttributeNames=attr_names,
            ExpressionAttributeValues=attr_values,
        )

    def get_session(self, session_id: str) -> Optional[WhatsAppSession]:
        response = self.session_table.get_item(Key={'id': session_id})
        if 'Item' not in response:
            return None
        return self._map_session(response['Item'])

    # ── Messages ─────────────────────────────────────────────────────────────

    def save_message(self, msg: dict) -> str:
        message_id = str(uuid.uuid4())
        now = int(datetime.now().timestamp() * 1000)
        item = {
            'id': message_id,
            'session_id': msg['session_id'],
            'channel_id': msg['channel_id'],
            'role': msg['role'],
            'content': msg['content'],
            'type': msg.get('type', 'text'),
            'status': msg['status'],
            'sent_by': msg.get('sent_by', 'agent'),
            'created_at': now,
        }
        if msg.get('wa_message_id'):
            item['wa_message_id'] = msg['wa_message_id']
        if msg.get('media_url'):
            item['media_url'] = msg['media_url']
        if msg.get('error_detail'):
            item['error_detail'] = msg['error_detail']
        self.message_table.put_item(Item=item)
        return message_id

    def update_message_status(self, message_id: str, status: str, error_detail: Optional[str] = None) -> None:
        update_expr = 'SET #status = :status'
        attr_names = {'#status': 'status'}
        attr_values = {':status': status}
        if error_detail:
            update_expr += ', #err = :err'
            attr_names['#err'] = 'error_detail'
            attr_values[':err'] = error_detail
        self.message_table.update_item(
            Key={'id': message_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=attr_names,
            ExpressionAttributeValues=attr_values,
        )

    def get_messages_by_session(
        self,
        session_id: str,
        limit: int = 50,
        last_key: Optional[dict] = None,
    ) -> tuple[list[WhatsAppMessage], Optional[dict]]:
        kwargs: dict = {
            'IndexName': 'session_id-created_at-index',
            'KeyConditionExpression': Key('session_id').eq(session_id),
            'Limit': limit,
            'ScanIndexForward': True,
        }
        if last_key:
            kwargs['ExclusiveStartKey'] = last_key
        response = self.message_table.query(**kwargs)
        messages = [self._map_message(item) for item in response.get('Items', [])]
        next_key = response.get('LastEvaluatedKey')
        return messages, next_key

    def message_exists_by_wa_id(self, wa_message_id: str) -> bool:
        response = self.message_table.query(
            IndexName='wa_message_id-index',
            KeyConditionExpression=Key('wa_message_id').eq(wa_message_id),
            Limit=1,
        )
        return len(response.get('Items', [])) > 0

    def count_sessions_by_channel(self, channel_id: str) -> tuple[int, int]:
        """Returns (total, active) session counts for a channel."""
        response = self.session_table.query(
            IndexName='channel_id-last_message_at-index',
            KeyConditionExpression=Key('channel_id').eq(channel_id),
            Select='ALL_ATTRIBUTES',
        )
        items = response.get('Items', [])
        total = len(items)
        active = sum(1 for i in items if i.get('status') == 'active')
        return total, active

    # ── Mappers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _map_channel(item: dict) -> WhatsAppChannel:
        return WhatsAppChannel(
            id=item['id'],
            account_id=item['account_id'],
            agent_id=item['agent_id'],
            name=item['name'],
            phone_number_id=item['phone_number_id'],
            wa_token=item['wa_token'],
            app_secret=item.get('app_secret'),
            verify_token=item['verify_token'],
            is_active=bool(item.get('is_active', 1)),
            created_at=item['created_at'],
            updated_at=item['updated_at'],
        )

    @staticmethod
    def _map_session(item: dict) -> WhatsAppSession:
        return WhatsAppSession(
            id=item['id'],
            channel_id=item['channel_id'],
            from_phone=item['from_phone'],
            contact_name=item.get('contact_name'),
            conversation_id=item['conversation_id'],
            agent_id=item['agent_id'],
            status=item.get('status', 'active'),
            last_message_at=item.get('last_message_at'),
            last_message_preview=item.get('last_message_preview'),
            unread_count=int(item.get('unread_count', 0)),
        )

    @staticmethod
    def _map_message(item: dict) -> WhatsAppMessage:
        return WhatsAppMessage(
            id=item['id'],
            session_id=item['session_id'],
            channel_id=item['channel_id'],
            wa_message_id=item.get('wa_message_id'),
            role=item['role'],
            content=item['content'],
            type=item.get('type', 'text'),
            media_url=item.get('media_url'),
            status=item['status'],
            sent_by=item.get('sent_by', 'agent'),
            error_detail=item.get('error_detail'),
            created_at=item['created_at'],
        )


whatsapp_repository = WhatsAppRepository()
