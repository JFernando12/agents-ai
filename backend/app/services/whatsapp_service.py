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
from app.integrations.s3_service import s3_service
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
        media_id: Optional[str] = None,
        caption: Optional[str] = None,
    ) -> None:
        if whatsapp_repository.message_exists_by_wa_id(wa_message_id):
            print(f"[WhatsApp] Duplicate message {wa_message_id}, skipping.")
            return

        channel = whatsapp_repository.get_channel(channel_id)
        if not channel or not channel.is_active:
            print(f"[WhatsApp] Channel {channel_id} not found or inactive.")
            return

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

        # Handle image message: download from Meta, upload to S3
        msg_save_type = 'text'
        msg_save_media_url: Optional[str] = None
        if media_id:
            try:
                image_bytes, mime_type = whatsapp_client.download_media(media_id, channel.wa_token)
                ext = mime_type.split("/", 1)[-1].split(";")[0].strip() or "jpg"
                s3_key = f"whatsapp/media/{channel_id}/{wa_message_id}.{ext}"
                s3_service.upload_bytes(image_bytes, s3_key, mime_type)
                presigned_url = s3_service.generate_presigned_url(s3_key, expiration=7200)
            except Exception as _img_err:
                print(f"[WhatsApp] Image download/upload failed for {media_id}: {_img_err}")
                return

        if session.status == "human_handoff":
                now_ms = int(datetime.now().timestamp() * 1000)
                whatsapp_repository.save_message({
                    'session_id': session.id,
                    'channel_id': channel_id,
                    'wa_message_id': wa_message_id,
                    'role': 'user',
                    'content': caption or '[imagen]',
                    'type': 'image',
                    'media_s3_key': s3_key,
                    'status': 'received',
                    'sent_by': 'user',
                })
                whatsapp_repository.add_labels_to_session(session.id, ["comprobante_recibido"])
                whatsapp_repository.update_session(session.id, {
                    'last_message_at': now_ms,
                    'last_message_preview': caption or '[imagen]',
                    'unread_count': int(session.unread_count or 0) + 1,
                })
                whatsapp_client.send_text(
                    wa_token=channel.wa_token,
                    phone_number_id=channel.phone_number_id,
                    to=from_phone,
                    message="Recibimos tu imagen 📋 Un agente la revisará en breve.",
                )
                return

            history_image_text = f'[imagen]{(": " + caption) if caption else ""}'
            message_text = f"[Cliente envió imagen: {presigned_url}]"
            if caption:
                message_text += f' (caption: "{caption}")'
            msg_save_type = 'image'
            msg_save_media_url = s3_key

        # Skip agent for human_handoff sessions
        if session.status == "human_handoff":
            now_ms = int(datetime.now().timestamp() * 1000)
            whatsapp_repository.save_message({
                'session_id': session.id,
                'channel_id': channel_id,
                'wa_message_id': wa_message_id,
                'role': 'user',
                'content': message_text,
                'type': 'text',
                'status': 'received',
                'sent_by': 'user',
            })
            whatsapp_repository.update_session(session.id, {
                'last_message_at': now_ms,
                'last_message_preview': message_text[:80],
                'unread_count': int(session.unread_count or 0) + 1,
            })
            return

        now = int(datetime.now().timestamp() * 1000)
        user_received_at = datetime.now()
        preview = message_text[:80]

        msg_id = whatsapp_repository.save_message({
            'session_id': session.id,
            'channel_id': channel_id,
            'wa_message_id': wa_message_id,
            'role': 'user',
            'content': (caption or '[imagen]') if msg_save_type == 'image' else message_text,
            'type': msg_save_type,
            'media_s3_key': msg_save_media_url if msg_save_type == 'image' else None,
            'status': 'received',
            'sent_by': 'user',
        })

        # Update session preview
        whatsapp_repository.update_session(session.id, {
            'last_message_at': now,
            'last_message_preview': preview,
            'unread_count': int(session.unread_count or 0) + 1,
        })

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
            history_msgs = conversation_repository.get_messages(                conversation_id=session.conversation_id,
                limit=30,
            )
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
                whatsapp_context={
                    "session_id": session.id,
                    "channel_id": channel_id,
                    "from_phone": from_phone,
                },
            )
            answer = agent_response.response

            # Strip markdown code fences the LLM sometimes adds
            stripped = answer.strip()
            if stripped.startswith("```"):
                stripped = stripped.split("\n", 1)[-1]  # drop opening fence line
                stripped = stripped.rsplit("```", 1)[0]  # drop closing fence
                stripped = stripped.strip()

            # Parse canonical JSON. If the LLM prepended plain text before the
            # JSON object (e.g. "\u00a1Listo!\n{\"type\"...}"), locate the first
            # top-level JSON object and parse that instead of failing silently.
            def _extract_json(s: str) -> dict | None:
                start = s.find('{')
                if start == -1:
                    return None
                depth = 0
                for i, ch in enumerate(s[start:], start):
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                        if depth == 0:
                            try:
                                return json.loads(s[start:i + 1])
                            except json.JSONDecodeError:
                                return None
                return None

            try:
                wa_payload = json.loads(stripped)
            except (json.JSONDecodeError, TypeError):
                wa_payload = _extract_json(stripped) or {'type': 'text', 'body': answer}

            history_text = self._extract_text_for_history(wa_payload) or answer

            from app.models.conversation import Message
            user_msg = Message(role='user', content=history_image_text if msg_save_type == 'image' else message_text, timestamp=user_received_at)
            assistant_msg_obj = Message(role='assistant', content=history_text, timestamp=datetime.now())
            conversation_repository.save_message(session.conversation_id, user_msg)
            conversation_repository.save_message(session.conversation_id, assistant_msg_obj)

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

            if len(messages_list) > 1:
                def _send_remaining(remaining: list, prev_type: str) -> None:
                    for msg in remaining:
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
            content = body.caption or body.filename or body.media_s3_key or ''
        else:
            content = body.message or ''

        media_s3_key = body.media_s3_key or None

        msg_id = whatsapp_repository.save_message({
            'session_id': session_id,
            'channel_id': session.channel_id,
            'role': 'assistant',
            'content': content,
            'type': msg_type,
            'media_s3_key': media_s3_key,
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

        whatsapp_repository.update_session(session_id, {
            'last_message_at': now,
            'last_message_preview': content[:80],
        })

        if msg_type == 'text':
            success = whatsapp_client.send_text(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                message=body.message,
            )
        elif msg_type == 'image':
            wa_media_url = s3_service.generate_presigned_url(media_s3_key, expiration=3600) if media_s3_key else ''
            success = whatsapp_client.send_image(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                url=wa_media_url,
                caption=body.caption,
            )
        elif msg_type == 'document':
            wa_media_url = s3_service.generate_presigned_url(media_s3_key, expiration=3600) if media_s3_key else ''
            success = whatsapp_client.send_document(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                url=wa_media_url,
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

    # ── Async webhook (called by external systems after long operations) ──────

    def process_async_webhook(
        self,
        channel_id: str,
        session_id: str,
        payload: dict,
    ) -> None:
        """Handle a callback from an external system (e.g. design generation done).

        Payload schema::

            {
              "status": "ready" | "failed",
              "message_to_client": <str or WA canonical payload>,
              "context_for_agent": { ... },   # injected into conversation history
              "error_message": "..."           # only when status == "failed"
            }
        """
        session = whatsapp_repository.get_session(session_id)
        if not session:
            print(f"[WhatsApp] async_webhook: session {session_id} not found")
            return
        channel = whatsapp_repository.get_channel(channel_id)
        if not channel:
            print(f"[WhatsApp] async_webhook: channel {channel_id} not found")
            return

        status = payload.get("status", "ready")
        now = int(datetime.now().timestamp() * 1000)

        if status == "ready":
            message_to_client = payload.get("message_to_client")
            context_for_agent = payload.get("context_for_agent")
            if not message_to_client:
                print(f"[WhatsApp] async_webhook: missing message_to_client in payload")
                return

            wa_payload = (
                {"type": "text", "body": message_to_client}
                if isinstance(message_to_client, str)
                else message_to_client
            )
            history_text = self._extract_text_for_history(wa_payload) or str(message_to_client)

            # Send to client and save outbound message record
            self._dispatch_wa_message(wa_payload, channel, session.from_phone, session, channel_id)

            whatsapp_repository.update_session(session_id, {
                "last_message_at": now,
                "last_message_preview": history_text[:80],
            })

            # Mirror to unified conversation history
            from app.models.conversation import Message
            conversation_repository.save_message(
                session.conversation_id,
                Message(role="assistant", content=history_text, timestamp=datetime.now()),
            )

            # Inject context so the agent has it on the client's next message
            if context_for_agent:
                conversation_repository.save_message(
                    session.conversation_id,
                    Message(
                        role="assistant",
                        content=f"[tool_result] {json.dumps(context_for_agent, ensure_ascii=False)}",
                        timestamp=datetime.now(),
                    ),
                )

        elif status == "failed":
            error_message = payload.get(
                "error_message",
                "Hubo un problema con tu solicitud. Nuestro equipo te contactar\u00e1 pronto \ud83d\ude4f",
            )
            whatsapp_client.send_text(
                wa_token=channel.wa_token,
                phone_number_id=channel.phone_number_id,
                to=session.from_phone,
                message=error_message,
            )
            whatsapp_repository.save_message({
                "session_id": session_id,
                "channel_id": channel_id,
                "role": "assistant",
                "content": error_message,
                "type": "text",
                "status": "sent",
                "sent_by": "agent",
            })
            whatsapp_repository.update_session(session_id, {
                "status": "human_handoff",
                "last_message_at": now,
            })
            whatsapp_repository.add_labels_to_session(session_id, ["pendiente_revision"])
        else:
            print(f"[WhatsApp] async_webhook: unknown status '{status}'")

    # ── Human handoff admin actions ───────────────────────────────────────────

    def toggle_session_agent(self, session_id: str) -> Optional[WhatsAppSession]:
        """Toggle agent active/inactive for a session."""
        session = whatsapp_repository.get_session(session_id)
        if not session:
            return None
        if session.status == "active":
            whatsapp_repository.update_session(session_id, {"status": "human_handoff"})
            whatsapp_repository.add_labels_to_session(session_id, ["pendiente_revision"])
        else:
            updated_labels = [l for l in (session.labels or []) if l != "pendiente_revision"]
            whatsapp_repository.update_session(session_id, {"status": "active", "labels": updated_labels})
        return whatsapp_repository.get_session(session_id)


whatsapp_service = WhatsAppService()
