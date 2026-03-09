from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel


class WhatsAppChannel(BaseModel):
    id: str
    account_id: str
    agent_id: str
    name: str
    phone_number_id: str
    wa_token: str
    app_secret: Optional[str] = None
    verify_token: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class WhatsAppChannelCreate(BaseModel):
    agent_id: str
    name: str
    phone_number_id: str
    wa_token: str
    app_secret: Optional[str] = None
    verify_token: str


class WhatsAppChannelUpdate(BaseModel):
    agent_id: Optional[str] = None
    name: Optional[str] = None
    phone_number_id: Optional[str] = None
    wa_token: Optional[str] = None
    app_secret: Optional[str] = None
    verify_token: Optional[str] = None
    is_active: Optional[bool] = None


class WhatsAppSession(BaseModel):
    id: str
    channel_id: str
    from_phone: str
    contact_name: Optional[str] = None
    conversation_id: str
    agent_id: str
    status: str = "active"
    last_message_at: Optional[int] = None   # epoch ms
    last_message_preview: Optional[str] = None
    unread_count: int = 0


class WhatsAppMessage(BaseModel):
    id: str
    session_id: str
    channel_id: str
    wa_message_id: Optional[str] = None
    role: str                               # user | assistant
    content: str
    type: str = "text"                      # text | image | audio | document | sticker
    media_url: Optional[str] = None
    status: str                             # received | processing | sent | failed
    sent_by: str = "agent"                  # agent | human
    error_detail: Optional[str] = None
    created_at: int                         # epoch ms


class ButtonItem(BaseModel):
    id: str
    title: str


class ListRow(BaseModel):
    id: str
    title: str
    description: str | None = None


class ListSection(BaseModel):
    title: str
    rows: list[ListRow]


class ManualSendRequest(BaseModel):
    type: str = "text"  # text | image | document | buttons | list
    # text
    message: str = ""
    # image / document
    media_url: str | None = None
    filename: str | None = None
    caption: str | None = None
    # buttons
    buttons: list[ButtonItem] | None = None
    footer: str | None = None
    # list
    button_label: str | None = None
    sections: list[ListSection] | None = None


class WhatsAppStats(BaseModel):
    total_channels: int
    active_channels: int
    total_sessions: int
    active_sessions: int


# ── Meta webhook payload ──────────────────────────────────────────────────────

class WebhookEntry(BaseModel):
    id: str
    changes: list[Any]


class IncomingWebhookPayload(BaseModel):
    object: str
    entry: list[WebhookEntry]
