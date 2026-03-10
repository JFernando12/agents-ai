import json
import time
import threading
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

        # 3. Get or create Conversation + Session
        # Check for existing session first to reuse its conversation
        existing_session = whatsapp_repository.find_session_by_phone(channel_id, from_phone)
        if existing_session:
            conversation_id = existing_session.conversation_id
            session = existing_session
        else:
            title = ' '.join(message_text.split()[:5]) or from_phone
            conversation_id = conversation_service.create(
                ConversationCreate(
                    user=from_phone,
                    agent_id=channel.agent_id,
                    title=title,
                )
            )
            session = whatsapp_repository.get_or_create_session(
                channel_id=channel_id,
                from_phone=from_phone,
                contact_name=contact_name,
                conversation_id=conversation_id,
                agent_id=channel.agent_id,
            )

        now = int(datetime.now().timestamp() * 1000)
        # Capture user timestamp NOW, before the agent runs, so it is
        # always strictly earlier than the assistant timestamp.
        user_received_at = datetime.now()
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
        placeholder_id = whatsapp_repository.save_message({
            'session_id': session.id,
            'channel_id': channel_id,
            'role': 'assistant',
            'content': '',
            'type': 'text',
            'status': 'processing',
            'sent_by': 'agent',
        })

        # 6. Build history and run agent
        try:
            history_msgs = conversation_repository.get_messages(
                conversation_id=session.conversation_id,
                limit=30,
            )
            # get_messages returns chronological order (oldest first)
            messages = [{'role': msg.role, 'text': msg.content} for msg in history_msgs]
            messages.append({'role': 'user', 'text': message_text})

            print(f"[WhatsAppService] conversation_id={session.conversation_id} from={from_phone} history ({len(messages)} msgs):")
            for i, m in enumerate(messages):
                preview = m['text'][:120].replace('\n', ' ')
                print(f"  [{i+1}] {m['role']}: {preview}")

            executor = AgentExecutor(agent_id=channel.agent_id)
            agent_response = executor.run(
                user=from_phone,
                messages=messages,
                context=None,
                account_id=channel.account_id,
                whatsapp_mode=True,
            )
            answer = agent_response.response

            # Strip markdown code fences the LLM sometimes wraps around JSON
            # e.g. ```json\n{...}\n``` → {...}
            stripped = answer.strip()
            if stripped.startswith("```"):
                stripped = stripped.split("\n", 1)[-1]  # drop opening fence line
                stripped = stripped.rsplit("```", 1)[0]  # drop closing fence
                stripped = stripped.strip()

            # Parse canonical JSON first so we can extract readable text for history
            try:
                wa_payload = json.loads(stripped)
            except (json.JSONDecodeError, TypeError):
                wa_payload = {'type': 'text', 'body': answer}

            history_text = self._extract_text_for_history(wa_payload) or answer

            # Save human-readable text to conversation history (not raw JSON)
            from app.models.conversation import Message
            user_msg = Message(role='user', content=message_text, timestamp=user_received_at)
            assistant_msg_obj = Message(role='assistant', content=history_text, timestamp=datetime.now())
            conversation_repository.save_message(session.conversation_id, user_msg)
            conversation_repository.save_message(session.conversation_id, assistant_msg_obj)

            # Update placeholder with readable content only.
            # Status is set by _dispatch_wa_message after the actual API call
            # so it always reflects the real outcome.
            whatsapp_repository.message_table.update_item(
                Key={'id': placeholder_id},
                UpdateExpression='SET #content = :content',
                ExpressionAttributeNames={'#content': 'content'},
                ExpressionAttributeValues={':content': history_text},
            )

            self._dispatch_wa_message(
                wa_payload, channel, from_phone, session, channel_id, placeholder_id
            )

        except Exception as e:
            print(f"[WhatsApp] process_incoming_message error: {e}")
            whatsapp_repository.update_message_status(
                placeholder_id, 'failed', str(e)
            )

    def _extract_text_for_history(self, payload: dict) -> str:
        """Return a plain-text representation of a WA payload for conversation history."""
        msg_type = payload.get('type', 'text')
        if msg_type == 'text':
            return payload.get('body', '')
        elif msg_type == 'image':
            caption = payload.get('caption', '')
            return f"[imagen]{': ' + caption if caption else ''}"
        elif msg_type == 'document':
            caption = payload.get('caption', '')
            filename = payload.get('filename', 'documento')
            return f"[documento: {filename}]{': ' + caption if caption else ''}"
        elif msg_type in ('buttons', 'list'):
            return payload.get('body', '')
        elif msg_type == 'multi':
            parts = [
                self._extract_text_for_history(m)
                for m in payload.get('messages', [])
            ]
            return ' | '.join(p for p in parts if p)
        return ''

    def _send_single(self, payload: dict, channel, to: str) -> bool:
        """Make exactly one WhatsApp Cloud API call. Never touches the DB."""
        msg_type = payload.get('type', 'text')
        if msg_type == 'text':
            return whatsapp_client.send_text(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=to,
                message=payload.get('body', ''),
            )
        elif msg_type == 'image':
            return whatsapp_client.send_image(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=to,
                url=payload.get('url', ''),
                caption=payload.get('caption') or None,
            )
        elif msg_type == 'document':
            return whatsapp_client.send_document(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=to,
                url=payload.get('url', ''),
                filename=payload.get('filename', 'document'),
                caption=payload.get('caption') or None,
            )
        elif msg_type == 'buttons':
            return whatsapp_client.send_buttons(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=to,
                body=payload.get('body', ''),
                buttons=payload.get('buttons', []),
                footer=payload.get('footer'),
            )
        elif msg_type == 'list':
            return whatsapp_client.send_list(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=to,
                body=payload.get('body', ''),
                button_label=payload.get('button_label', 'Ver opciones'),
                sections=payload.get('sections', []),
                footer=payload.get('footer'),
            )
        else:
            return whatsapp_client.send_text(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=to,
                message=json.dumps(payload, ensure_ascii=False),
            )

    def _persist_result(
        self,
        placeholder_id: str | None,
        success: bool,
        msg_type: str,
        session_id: str,
        channel_id: str,
        content: str = '',
        **extra_fields,
    ) -> None:
        """Update the status of an existing placeholder row, or insert a new row.

        When placeholder_id is set the row already has its content — we only
        flip the status to the real outcome.  When it is None (e.g. manual
        sends, or secondary standalone messages) a full new row is created.
        """
        status = 'sent' if success else 'failed'
        if placeholder_id:
            whatsapp_repository.message_table.update_item(
                Key={'id': placeholder_id},
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': status},
            )
        else:
            whatsapp_repository.save_message({
                'session_id': session_id,
                'channel_id': channel_id,
                'role': 'assistant',
                'sent_by': 'agent',
                'content': content,
                'type': msg_type,
                'status': status,
                **extra_fields,
            })

    def _dispatch_wa_message(
        self,
        payload: dict,
        channel,
        to: str,
        session,
        channel_id: str,
        placeholder_id: str | None = None,
    ) -> None:
        """Dispatch a canonical WA payload to WhatsApp and persist the result.

        For 'multi': each sub-message is sent individually to WA (first one
        synchronously, the rest in a daemon thread with inter-message delays),
        but only a single DB record is written — the placeholder row whose
        content was already set by process_incoming_message via
        _extract_text_for_history.  The DB status is driven by whether the
        first (synchronous) send actually succeeds.
        """
        msg_type = payload.get('type', 'text')

        # ── multi: fan-out to WA, single DB record ────────────────────────────
        if msg_type == 'multi':
            messages_list = payload.get('messages', [])
            if not messages_list:
                return

            # First sub-message sent synchronously — its outcome sets DB status.
            first_success = self._send_single(messages_list[0], channel, to)
            if not first_success:
                print(f"[WhatsApp] Failed to send first multi-message to {to}")
            self._persist_result(
                placeholder_id=placeholder_id,
                success=first_success,
                msg_type='multi',
                session_id=session.id,
                channel_id=channel_id,
                content=self._extract_text_for_history(payload),
            )

            # Remaining sub-messages go out in a daemon thread, zero DB ops.
            if len(messages_list) > 1:
                def _send_remaining(remaining: list, prev_type: str) -> None:
                    for msg in remaining:
                        # Wait longer after an image — Meta's media API is slower
                        delay = 1.5 if prev_type == 'image' else 0.8
                        time.sleep(delay)
                        ok = self._send_single(msg, channel, to)
                        if not ok:
                            print(f"[WhatsApp] Failed to send multi sub-message ({msg.get('type')}) to {to}")
                        prev_type = msg.get('type', 'text')

                threading.Thread(
                    target=_send_remaining,
                    args=(messages_list[1:], messages_list[0].get('type', 'text')),
                    daemon=True,
                ).start()
            return

        # ── single message ─────────────────────────────────────────────────────
        success = self._send_single(payload, channel, to)
        if not success:
            print(f"[WhatsApp] Failed to send {msg_type} message to {to}")

        _CONTENT_FIELDS: dict[str, dict] = {
            'text':     {'content': payload.get('body', ''), 'type': 'text'},
            'image':    {'content': payload.get('caption', ''), 'type': 'image',    'media_url': payload.get('url', '')},
            'document': {'content': payload.get('caption') or payload.get('filename', ''), 'type': 'document', 'media_url': payload.get('url', '')},
            'buttons':  {'content': payload.get('body', ''), 'type': 'buttons'},
            'list':     {'content': payload.get('body', ''), 'type': 'list'},
        }
        extra = _CONTENT_FIELDS.get(
            msg_type,
            {'content': json.dumps(payload, ensure_ascii=False), 'type': 'text'},
        )
        self._persist_result(
            placeholder_id=placeholder_id,
            success=success,
            msg_type=msg_type,
            session_id=session.id,
            channel_id=channel_id,
            **extra,
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

    def delete_session(self, session_id: str) -> bool:
        session = whatsapp_repository.get_session(session_id)
        if session:
            conversation_repository.delete(session.conversation_id)
        return whatsapp_repository.delete_session(session_id)

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

        # Persist message to WhatsApp table
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

        # Mirror to unified conversation history so the agent has context
        from app.models.conversation import Message as ConversationMessage
        conv_msg = ConversationMessage(
            role='assistant',
            content=content,
            timestamp=datetime.now(),
        )
        conversation_repository.save_message(session.conversation_id, conv_msg)

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
