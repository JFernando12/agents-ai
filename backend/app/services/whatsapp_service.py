from datetime import datetime
from typing import Optional

from app.models.whatsapp import (
    WhatsAppChannel,
    WhatsAppChannelCreate,
    WhatsAppChannelUpdate,
    WhatsAppMessage,
    WhatsAppSession,
    WhatsAppStats,
    ManualSendRequest,
)
from app.models.chat import ChatRequest
from app.models.conversation import ConversationCreate
from app.models.user import User
from app.repositories.whatsapp_repository import whatsapp_repository
from app.services.conversation_service import conversation_service
from app.integrations.agent_executor import AgentExecutor
from app.integrations.whatsapp_client import whatsapp_client
from app.repositories.conversation_repository import conversation_repository


class WhatsAppService:

    # ── Channel CRUD ─────────────────────────────────────────────────────────

    def create_channel(
        self,
        channel_data: WhatsAppChannelCreate,
        account_id: str,
    ) -> str:
        return whatsapp_repository.create_channel({
            'account_id': account_id,
            'agent_id': channel_data.agent_id,
            'name': channel_data.name,
            'phone_number_id': channel_data.phone_number_id,
            'wa_token': channel_data.wa_token,
            'app_secret': channel_data.app_secret,
            'verify_token': channel_data.verify_token,
        })

    def get_channels(self, account_id: str) -> list[WhatsAppChannel]:
        return whatsapp_repository.get_channels_by_account(account_id)

    def get_channel(self, channel_id: str) -> Optional[WhatsAppChannel]:
        return whatsapp_repository.get_channel(channel_id)

    def update_channel(
        self,
        channel_id: str,
        channel_data: WhatsAppChannelUpdate,
    ) -> bool:
        updates = {k: v for k, v in channel_data.model_dump().items() if v is not None}
        if not updates:
            return True
        return whatsapp_repository.update_channel(channel_id, updates)

    def delete_channel(self, channel_id: str) -> bool:
        return whatsapp_repository.delete_channel(channel_id)

    def toggle_channel(self, channel_id: str) -> Optional[WhatsAppChannel]:
        channel = whatsapp_repository.get_channel(channel_id)
        if not channel:
            return None
        new_state = 0 if channel.is_active else 1
        whatsapp_repository.update_channel(channel_id, {'is_active': new_state})
        channel.is_active = not channel.is_active
        return channel

    # ── Incoming message processor (runs in BackgroundTask) ──────────────────

    def process_incoming_message(
        self,
        channel_id: str,
        from_phone: str,
        contact_name: Optional[str],
        message_text: str,
        wa_message_id: str,
    ) -> None:
        """
        Full pipeline for an incoming WhatsApp message:
        1. Deduplicate by wa_message_id
        2. Load channel
        3. Get or create Conversation + Session
        4. Save incoming message as 'received'
        5. Set status to 'processing'
        6. Run AgentExecutor
        7. Save assistant message and send via WhatsApp Cloud API
        """
        # 1. Dedup
        if whatsapp_repository.message_exists_by_wa_id(wa_message_id):
            print(f"[WhatsApp] Duplicate message {wa_message_id}, skipping.")
            return

        # 2. Load channel
        channel = whatsapp_repository.get_channel(channel_id)
        if not channel or not channel.is_active:
            print(f"[WhatsApp] Channel {channel_id} not found or inactive.")
            return

        # 3. Get or create Conversation
        title = ' '.join(message_text.split()[:5]) or from_phone
        conversation_id = conversation_service.create(
            ConversationCreate(
                user=from_phone,
                agent_id=channel.agent_id,
                title=title,
            )
        )

        # Try to find existing session (might have an existing conversation_id)
        existing_session = whatsapp_repository.find_session_by_phone(channel_id, from_phone)
        if existing_session:
            conversation_id = existing_session.conversation_id
            session = existing_session
        else:
            session = whatsapp_repository.get_or_create_session(
                channel_id=channel_id,
                from_phone=from_phone,
                contact_name=contact_name,
                conversation_id=conversation_id,
                agent_id=channel.agent_id,
            )

        now = int(datetime.now().timestamp() * 1000)
        preview = message_text[:80]

        # 4. Save incoming user message
        msg_id = whatsapp_repository.save_message({
            'session_id': session.id,
            'channel_id': channel_id,
            'wa_message_id': wa_message_id,
            'role': 'user',
            'content': message_text,
            'type': 'text',
            'status': 'received',
            'sent_by': 'user',
        })

        # Update session preview
        whatsapp_repository.update_session(session.id, {
            'last_message_at': now,
            'last_message_preview': preview,
            'unread_count': int(session.unread_count or 0) + 1,
        })

        # 5. Save assistant placeholder as 'processing'
        assistant_msg_id = whatsapp_repository.save_message({
            'session_id': session.id,
            'channel_id': channel_id,
            'role': 'assistant',
            'content': '',
            'type': 'text',
            'status': 'processing',
            'sent_by': 'agent',
        })

        # 6. Build history and run agent
        service_user = User(
            id='whatsapp-service',
            name='WhatsApp',
            email=from_phone,
            role='viewer',
            account_id=channel.account_id,
        )

        try:
            history_msgs = conversation_repository.get_messages(
                conversation_id=session.conversation_id,
                limit=30,
            )
            messages = []
            for msg in reversed(history_msgs):
                messages.append({'role': msg.role, 'text': msg.content})
            messages.append({'role': 'user', 'text': message_text})

            channel_context: dict = {'message_queue': []}
            executor = AgentExecutor(agent_id=channel.agent_id)
            agent_response = executor.run(
                user=from_phone,
                messages=messages,
                context=None,
                account_id=channel.account_id,
                channel_context=channel_context,
            )
            answer = agent_response.response

            # Save to conversation history
            from app.models.conversation import Message
            user_msg = Message(role='user', content=message_text, timestamp=datetime.now())
            assistant_msg_obj = Message(role='assistant', content=answer, timestamp=datetime.now())
            conversation_repository.save_message(session.conversation_id, user_msg)
            conversation_repository.save_message(session.conversation_id, assistant_msg_obj)

            # Update placeholder message content + status
            whatsapp_repository.message_table.update_item(
                Key={'id': assistant_msg_id},
                UpdateExpression='SET #content = :content, #status = :status',
                ExpressionAttributeNames={'#content': 'content', '#status': 'status'},
                ExpressionAttributeValues={':content': answer, ':status': 'sent'},
            )

            message_queue = channel_context.get('message_queue', [])

            if message_queue:
                # Send each queued rich message via WhatsApp
                for queued_msg in message_queue:
                    msg_type = queued_msg['type']
                    payload = queued_msg['payload']
                    success = False
                    if msg_type == 'image':
                        success = whatsapp_client.send_image(
                            wa_token=channel.wa_token,
                            phone_number_id=channel.phone_number_id,
                            to=from_phone,
                            url=payload['url'],
                            caption=payload.get('caption'),
                        )
                        whatsapp_repository.save_message({
                            'session_id': session.id,
                            'channel_id': channel_id,
                            'role': 'assistant',
                            'content': payload.get('caption', ''),
                            'type': 'image',
                            'media_url': payload['url'],
                            'status': 'sent' if success else 'failed',
                            'sent_by': 'agent',
                        })
                    elif msg_type == 'document':
                        success = whatsapp_client.send_document(
                            wa_token=channel.wa_token,
                            phone_number_id=channel.phone_number_id,
                            to=from_phone,
                            url=payload['url'],
                            filename=payload['filename'],
                            caption=payload.get('caption'),
                        )
                        whatsapp_repository.save_message({
                            'session_id': session.id,
                            'channel_id': channel_id,
                            'role': 'assistant',
                            'content': payload.get('caption', payload['filename']),
                            'type': 'document',
                            'media_url': payload['url'],
                            'status': 'sent' if success else 'failed',
                            'sent_by': 'agent',
                        })
                    elif msg_type == 'buttons':
                        success = whatsapp_client.send_buttons(
                            wa_token=channel.wa_token,
                            phone_number_id=channel.phone_number_id,
                            to=from_phone,
                            body=payload['body'],
                            buttons=payload['buttons'],
                            footer=payload.get('footer'),
                        )
                        whatsapp_repository.save_message({
                            'session_id': session.id,
                            'channel_id': channel_id,
                            'role': 'assistant',
                            'content': payload['body'],
                            'type': 'buttons',
                            'status': 'sent' if success else 'failed',
                            'sent_by': 'agent',
                        })
                    elif msg_type == 'list':
                        success = whatsapp_client.send_list(
                            wa_token=channel.wa_token,
                            phone_number_id=channel.phone_number_id,
                            to=from_phone,
                            body=payload['body'],
                            button_label=payload['button_label'],
                            sections=payload['sections'],
                            footer=payload.get('footer'),
                        )
                        whatsapp_repository.save_message({
                            'session_id': session.id,
                            'channel_id': channel_id,
                            'role': 'assistant',
                            'content': payload['body'],
                            'type': 'list',
                            'status': 'sent' if success else 'failed',
                            'sent_by': 'agent',
                        })
            else:
                # No rich messages: send the plain text response
                success = whatsapp_client.send_text(
                    wa_token=channel.wa_token,
                    phone_number_id=channel.phone_number_id,
                    to=from_phone,
                    message=answer,
                )
                if not success:
                    whatsapp_repository.update_message_status(
                        assistant_msg_id, 'failed', 'WhatsApp API call failed'
                    )

        except Exception as e:
            print(f"[WhatsApp] process_incoming_message error: {e}")
            whatsapp_repository.update_message_status(
                assistant_msg_id, 'failed', str(e)
            )

    # ── Inbox ─────────────────────────────────────────────────────────────────

    def get_sessions(
        self,
        channel_id: str,
        limit: int = 20,
        last_key: Optional[dict] = None,
    ) -> tuple[list[WhatsAppSession], Optional[dict]]:
        return whatsapp_repository.get_sessions_by_channel(channel_id, limit, last_key)

    def get_session(self, session_id: str) -> Optional[WhatsAppSession]:
        return whatsapp_repository.get_session(session_id)

    def get_messages(
        self,
        session_id: str,
        limit: int = 50,
        last_key: Optional[dict] = None,
    ) -> tuple[list[WhatsAppMessage], Optional[dict]]:
        return whatsapp_repository.get_messages_by_session(session_id, limit, last_key)

    # ── Manual send from dashboard ────────────────────────────────────────────

    def send_manual_message(
        self,
        session_id: str,
        body: ManualSendRequest,
        sent_by_email: str,
    ) -> Optional[WhatsAppMessage]:
        session = whatsapp_repository.get_session(session_id)
        if not session:
            return None
        channel = whatsapp_repository.get_channel(session.channel_id)
        if not channel:
            return None

        now = int(datetime.now().timestamp() * 1000)
        msg_type = body.type

        # Determine content for preview and persistence
        if msg_type == 'text':
            content = body.message
        elif msg_type in ('image', 'document'):
            content = body.caption or body.filename or body.media_url or ''
        else:
            content = body.message or ''

        # Persist message
        msg_id = whatsapp_repository.save_message({
            'session_id': session_id,
            'channel_id': session.channel_id,
            'role': 'assistant',
            'content': content,
            'type': msg_type,
            'media_url': body.media_url,
            'status': 'sent',
            'sent_by': 'human',
        })

        # Update session preview
        whatsapp_repository.update_session(session_id, {
            'last_message_at': now,
            'last_message_preview': content[:80],
        })

        # Send via API
        if msg_type == 'text':
            success = whatsapp_client.send_text(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                message=body.message,
            )
        elif msg_type == 'image':
            success = whatsapp_client.send_image(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                url=body.media_url or '',
                caption=body.caption,
            )
        elif msg_type == 'document':
            success = whatsapp_client.send_document(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                url=body.media_url or '',
                filename=body.filename or 'document',
                caption=body.caption,
            )
        elif msg_type == 'buttons':
            success = whatsapp_client.send_buttons(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                body=body.message,
                buttons=[b.model_dump() for b in (body.buttons or [])],
                footer=body.footer,
            )
        elif msg_type == 'list':
            success = whatsapp_client.send_list(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                body=body.message,
                button_label=body.button_label or 'Ver opciones',
                sections=[s.model_dump() for s in (body.sections or [])],
                footer=body.footer,
            )
        else:
            success = False

        if not success:
            whatsapp_repository.update_message_status(msg_id, 'failed', 'WhatsApp API call failed')

        result = whatsapp_repository.get_messages_by_session(session_id, limit=1)
        return result[0][0] if result[0] else None

    # ── Stats ─────────────────────────────────────────────────────────────────

    def get_stats(self, account_id: str) -> WhatsAppStats:
        channels = whatsapp_repository.get_channels_by_account(account_id)
        total_channels = len(channels)
        active_channels = sum(1 for c in channels if c.is_active)
        total_sessions = 0
        active_sessions = 0
        for ch in channels:
            t, a = whatsapp_repository.count_sessions_by_channel(ch.id)
            total_sessions += t
            active_sessions += a
        return WhatsAppStats(
            total_channels=total_channels,
            active_channels=active_channels,
            total_sessions=total_sessions,
            active_sessions=active_sessions,
        )


whatsapp_service = WhatsAppService()
