import hmac
import hashlib
from typing import Optional

import requests

GRAPH_API_URL = "https://graph.facebook.com/v23.0"


class WhatsAppClient:
    """Wrapper for the Meta WhatsApp Cloud API."""

    def _post(self, wa_token: str, phone_number_id: str, payload: dict) -> bool:
        url = f"{GRAPH_API_URL}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {wa_token}",
            "Content-Type": "application/json",
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"[WhatsApp] API error → {e}")
            return False

    def send_text(
        self,
        wa_token: str,
        phone_number_id: str,
        to: str,
        message: str,
    ) -> bool:
        """Send a plain text message."""
        return self._post(wa_token, phone_number_id, {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": message},
        })

    def send_image(
        self,
        wa_token: str,
        phone_number_id: str,
        to: str,
        url: str,
        caption: Optional[str] = None,
    ) -> bool:
        """Send an image by public URL with an optional caption."""
        image_obj: dict = {"link": url}
        if caption:
            image_obj["caption"] = caption
        return self._post(wa_token, phone_number_id, {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "image",
            "image": image_obj,
        })

    def send_document(
        self,
        wa_token: str,
        phone_number_id: str,
        to: str,
        url: str,
        filename: str,
        caption: Optional[str] = None,
    ) -> bool:
        """Send a document (PDF, Excel, etc.) by public URL."""
        doc_obj: dict = {"link": url, "filename": filename}
        if caption:
            doc_obj["caption"] = caption
        return self._post(wa_token, phone_number_id, {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "document",
            "document": doc_obj,
        })

    def send_buttons(
        self,
        wa_token: str,
        phone_number_id: str,
        to: str,
        body: str,
        buttons: list[dict],
        footer: Optional[str] = None,
    ) -> bool:
        """Send an interactive message with up to 3 quick-reply buttons.

        Each button dict must have ``id`` and ``title`` keys.
        """
        interactive: dict = {
            "type": "button",
            "body": {"text": body},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
                    for b in buttons[:3]
                ]
            },
        }
        if footer:
            interactive["footer"] = {"text": footer}
        return self._post(wa_token, phone_number_id, {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": interactive,
        })

    def send_list(
        self,
        wa_token: str,
        phone_number_id: str,
        to: str,
        body: str,
        button_label: str,
        sections: list[dict],
        footer: Optional[str] = None,
    ) -> bool:
        """Send an interactive list message.

        Each section dict: ``{"title": str, "rows": [{"id", "title", "description?"}]}``.
        """
        interactive: dict = {
            "type": "list",
            "body": {"text": body},
            "action": {
                "button": button_label,
                "sections": sections,
            },
        }
        if footer:
            interactive["footer"] = {"text": footer}
        return self._post(wa_token, phone_number_id, {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": interactive,
        })

    def validate_signature(
        self,
        app_secret: str,
        payload_body: bytes,
        signature_header: Optional[str],
    ) -> bool:
        """
        Validate the X-Hub-Signature-256 header sent by Meta.
        Returns True if valid or if signature_header is missing (permissive when
        app_secret is not configured).
        """
        if not signature_header:
            return False
        if not signature_header.startswith("sha256="):
            return False
        received_sig = signature_header[len("sha256="):]
        expected_sig = hmac.new(
            app_secret.encode("utf-8"),
            payload_body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected_sig, received_sig)

    def download_media(self, media_id: str, wa_token: str) -> tuple[bytes, str]:
        """Download media from the Meta Graph API.

        Returns (raw_bytes, mime_type). The ``media_id`` is resolved to a
        temporary download URL in the first request; the actual bytes are
        fetched in the second request.
        """
        headers = {"Authorization": f"Bearer {wa_token}"}
        # Step 1 – resolve the temporary URL
        info_resp = requests.get(f"{GRAPH_API_URL}/{media_id}", headers=headers, timeout=15)
        info_resp.raise_for_status()
        info = info_resp.json()
        media_url = info.get("url")
        mime_type = info.get("mime_type", "image/jpeg")
        if not media_url:
            raise ValueError(f"Meta Graph API returned no URL for media_id={media_id}")
        # Step 2 – download the bytes
        media_resp = requests.get(media_url, headers=headers, timeout=30)
        media_resp.raise_for_status()
        return media_resp.content, mime_type


whatsapp_client = WhatsAppClient()
