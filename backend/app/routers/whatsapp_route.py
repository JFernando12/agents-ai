from fastapi import APIRouter, BackgroundTasks, Depends, Header, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from typing import Optional

from app.middleware import get_current_user, require_roles
from app.models.user import User
from app.models.whatsapp import (
    WhatsAppChannelCreate,
    WhatsAppChannelUpdate,
    ManualSendRequest,
    AsyncWebhookPayload,
)
from app.services.whatsapp_service import whatsapp_service
from app.integrations.whatsapp_client import whatsapp_client
from app.utils import success_response, error_response

whatsapp_router = APIRouter(tags=["whatsapp"], prefix="/whatsapp")


# ── Webhook (public, validated by Meta signature) ────────────────────────────

@whatsapp_router.get("/webhook/{channel_id}")
async def verify_webhook(
    channel_id: str,
    hub_mode: Optional[str] = None,
    hub_verify_token: Optional[str] = None,
    hub_challenge: Optional[str] = None,
):
    """Meta webhook verification handshake (GET)."""
    if hub_mode != "subscribe":
        return JSONResponse(status_code=400, content={"detail": "Invalid mode"})

    channel = whatsapp_service.get_channel(channel_id)
    if not channel:
        return JSONResponse(status_code=404, content={"detail": "Channel not found"})

    if hub_verify_token != channel.verify_token:
        return JSONResponse(status_code=403, content={"detail": "Invalid verify token"})

    return PlainTextResponse(content=hub_challenge or "")


@whatsapp_router.post("/webhook/{channel_id}")
async def receive_webhook(
    channel_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: Optional[str] = Header(default=None, alias="X-Hub-Signature-256"),
):
    """Receive incoming WhatsApp messages from Meta (POST)."""
    raw_body = await request.body()

    channel = whatsapp_service.get_channel(channel_id)
    if not channel:
        # Still return 200 to prevent Meta retries for unknown channels
        return JSONResponse(status_code=200, content={"status": "ignored"})

    # Validate HMAC signature if app_secret is configured
    if channel.app_secret:
        valid = whatsapp_client.validate_signature(
            app_secret=channel.app_secret,
            payload_body=raw_body,
            signature_header=x_hub_signature_256,
        )
        if not valid:
            return JSONResponse(status_code=403, content={"detail": "Invalid signature"})

    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON"})

    # Parse Meta payload and enqueue background processing
    try:
        entries = payload.get("entry", [])
        for entry in entries:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                if change.get("field") != "messages":
                    continue

                messages = value.get("messages", [])
                contacts = value.get("contacts", [])
                contact_name = contacts[0]["profile"]["name"] if contacts else None

                for msg in messages:
                    msg_type = msg.get("type")
                    from_phone = msg.get("from")
                    wa_message_id = msg.get("id")

                    if msg_type == "text":
                        message_text = msg.get("text", {}).get("body", "")
                        media_id = None
                        caption = None
                    elif msg_type == "interactive":
                        interactive = msg.get("interactive", {})
                        interactive_type = interactive.get("type", "")
                        if interactive_type == "button_reply":
                            btn = interactive.get("button_reply", {})
                            message_text = btn.get("title", btn.get("id", ""))
                        elif interactive_type == "list_reply":
                            row = interactive.get("list_reply", {})
                            message_text = row.get("title", row.get("id", ""))
                        else:
                            print(f"[WhatsApp] Unsupported interactive subtype: {interactive_type}")
                            continue
                        media_id = None
                        caption = None
                    elif msg_type == "image":
                        image_data = msg.get("image", {})
                        media_id = image_data.get("id")
                        caption = image_data.get("caption", "") or None
                        message_text = ""
                        if not media_id:
                            continue
                    else:
                        # Non-text types: acknowledge but don't process
                        print(f"[WhatsApp] Unsupported message type: {msg_type}")
                        continue

                    if not from_phone:
                        continue
                    if not message_text and not media_id:
                        continue

                    background_tasks.add_task(
                        whatsapp_service.process_incoming_message,
                        channel_id=channel_id,
                        from_phone=from_phone,
                        contact_name=contact_name,
                        message_text=message_text,
                        wa_message_id=wa_message_id,
                        media_id=media_id,
                        caption=caption,
                    )
    except Exception as e:
        print(f"[WhatsApp] Webhook parse error: {e}")

    # Always respond 200 immediately (Meta requires this)
    return JSONResponse(status_code=200, content={"status": "ok"})


# ── Channel management (JWT required) ────────────────────────────────────────

@whatsapp_router.get("/channels")
def list_channels(current_user: User = Depends(get_current_user)):
    channels = whatsapp_service.get_channels(current_user.account_id)
    data = [ch.model_dump(mode="json") for ch in channels]
    return JSONResponse(
        status_code=200,
        content=success_response(data, "Channels retrieved successfully"),
    )


@whatsapp_router.post("/channels")
def create_channel(
    channel_data: WhatsAppChannelCreate,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin", "editor")),
):
    channel_id = whatsapp_service.create_channel(channel_data, current_user.account_id)
    channel = whatsapp_service.get_channel(channel_id)
    return JSONResponse(
        status_code=201,
        content=success_response(channel.model_dump(mode="json") if channel else {"id": channel_id}, "Channel created successfully"),
    )


@whatsapp_router.get("/channels/{channel_id}")
def get_channel(
    channel_id: str,
    current_user: User = Depends(get_current_user),
):
    channel = whatsapp_service.get_channel(channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=404, content=error_response("Channel not found"))
    return JSONResponse(
        status_code=200,
        content=success_response(channel.model_dump(mode="json"), "Channel retrieved successfully"),
    )


@whatsapp_router.put("/channels/{channel_id}")
def update_channel(
    channel_id: str,
    channel_data: WhatsAppChannelUpdate,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin", "editor")),
):
    channel = whatsapp_service.get_channel(channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=404, content=error_response("Channel not found"))
    success = whatsapp_service.update_channel(channel_id, channel_data)
    if not success:
        return JSONResponse(status_code=500, content=error_response("Failed to update channel"))
    updated = whatsapp_service.get_channel(channel_id)
    return JSONResponse(
        status_code=200,
        content=success_response(updated.model_dump(mode="json") if updated else None, "Channel updated successfully"),
    )


@whatsapp_router.delete("/channels/{channel_id}")
def delete_channel(
    channel_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin")),
):
    channel = whatsapp_service.get_channel(channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=404, content=error_response("Channel not found"))
    whatsapp_service.delete_channel(channel_id)
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Channel deleted successfully"),
    )


@whatsapp_router.post("/channels/{channel_id}/toggle")
def toggle_channel(
    channel_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin", "editor")),
):
    channel = whatsapp_service.get_channel(channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=404, content=error_response("Channel not found"))
    updated = whatsapp_service.toggle_channel(channel_id)
    return JSONResponse(
        status_code=200,
        content=success_response(updated.model_dump(mode="json") if updated else None, "Channel toggled"),
    )


# ── Stats ─────────────────────────────────────────────────────────────────────

@whatsapp_router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user)):
    stats = whatsapp_service.get_stats(current_user.account_id)
    return JSONResponse(
        status_code=200,
        content=success_response(stats.model_dump(mode="json"), "Stats retrieved successfully"),
    )


# ── Inbox (sessions) ──────────────────────────────────────────────────────────

@whatsapp_router.get("/channels/{channel_id}/sessions")
def list_sessions(
    channel_id: str,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
):
    channel = whatsapp_service.get_channel(channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=404, content=error_response("Channel not found"))
    sessions, next_key = whatsapp_service.get_sessions(channel_id, limit)
    data = [s.model_dump(mode="json") for s in sessions]
    return JSONResponse(
        status_code=200,
        content=success_response(
            {"items": data, "next_key": next_key},
            "Sessions retrieved successfully",
        ),
    )


# ── Session messages ──────────────────────────────────────────────────────────

@whatsapp_router.get("/sessions/{session_id}/messages")
def list_messages(
    session_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
):
    session = whatsapp_service.get_session(session_id)
    if not session:
        return JSONResponse(status_code=404, content=error_response("Session not found"))
    # Verify channel ownership
    channel = whatsapp_service.get_channel(session.channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=403, content=error_response("Access denied"))
    messages, next_key = whatsapp_service.get_messages(session_id, limit)
    data = [m.model_dump(mode="json") for m in messages]
    return JSONResponse(
        status_code=200,
        content=success_response(
            {"items": data, "next_key": next_key},
            "Messages retrieved successfully",
        ),
    )


@whatsapp_router.post("/sessions/{session_id}/send")
def send_manual_message(
    session_id: str,
    body: ManualSendRequest,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin", "editor")),
):
    session = whatsapp_service.get_session(session_id)
    if not session:
        return JSONResponse(status_code=404, content=error_response("Session not found"))
    channel = whatsapp_service.get_channel(session.channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=403, content=error_response("Access denied"))
    whatsapp_service.send_manual_message(session_id, body, current_user.email)
    return JSONResponse(
        status_code=200,
        content=success_response(None, "Message sent successfully"),
    )


@whatsapp_router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin", "editor")),
):
    session = whatsapp_service.get_session(session_id)
    if not session:
        return JSONResponse(status_code=404, content=error_response("Session not found"))
    channel = whatsapp_service.get_channel(session.channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=403, content=error_response("Access denied"))
    success = whatsapp_service.delete_session(session_id)
    if not success:
        return JSONResponse(status_code=404, content=error_response("Session not found"))
    return JSONResponse(
        status_code=200,
        content=success_response(
            {"channel_id": session.channel_id},
            "Session deleted successfully",
        ),
    )


@whatsapp_router.post("/sessions/{session_id}/toggle")
def toggle_session_agent(
    session_id: str,
    current_user: User = Depends(require_roles("super_admin", "owner", "admin", "editor")),
):
    """Toggle the agent on/off for a session.
    active → human_handoff (agent disabled, label 'pendiente_revision' added)
    human_handoff → active (agent re-enabled, label removed)
    """
    session = whatsapp_service.get_session(session_id)
    if not session:
        return JSONResponse(status_code=404, content=error_response("Session not found"))
    channel = whatsapp_service.get_channel(session.channel_id)
    if not channel or channel.account_id != current_user.account_id:
        return JSONResponse(status_code=403, content=error_response("Access denied"))
    updated = whatsapp_service.toggle_session_agent(session_id)
    return JSONResponse(
        status_code=200,
        content=success_response(
            updated.model_dump(mode="json") if updated else None,
            "Agent toggled",
        ),
    )


# ── Generic async webhook (for external system callbacks) ────────────────────

@whatsapp_router.post("/webhooks/async/{channel_id}/{session_id}")
async def async_tool_webhook(
    channel_id: str,
    session_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_secret: Optional[str] = Header(default=None, alias="X-Webhook-Secret"),
):
    """Generic callback endpoint for async tool operations (e.g. design generation).

    External systems call this endpoint when a long-running operation finishes.
    Authentication is via the ``X-Webhook-Secret`` header matched against the
    ``webhook_secret`` stored on the WhatsApp channel.
    """
    channel = whatsapp_service.get_channel(channel_id)
    if not channel:
        return JSONResponse(status_code=404, content={"detail": "Channel not found"})

    if channel.webhook_secret and x_webhook_secret != channel.webhook_secret:
        return JSONResponse(status_code=403, content={"detail": "Invalid webhook secret"})

    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Invalid JSON"})

    background_tasks.add_task(
        whatsapp_service.process_async_webhook,
        channel_id=channel_id,
        session_id=session_id,
        payload=payload,
    )
    return JSONResponse(status_code=200, content={"status": "accepted"})
