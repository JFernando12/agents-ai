import hmac
import hashlib
from typing import Optional

import requests

GRAPH_API_URL = "https://graph.facebook.com/v23.0"


class WhatsAppClient:
    """Wrapper for the Meta WhatsApp Cloud API."""

    def send_text(
        self,
        wa_token: str,
        phone_number_id: str,
        to: str,
        message: str,
    ) -> bool:
        """Send a text message to a WhatsApp number."""
        url = f"{GRAPH_API_URL}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {wa_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": message},
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"[WhatsApp] send_text error → {e}")
            return False

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


whatsapp_client = WhatsAppClient()
