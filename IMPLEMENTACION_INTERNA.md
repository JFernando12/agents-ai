# Implementación interna — Plataforma agents-ai

> Documento para el desarrollador del backend.  
> Fecha: 10 de marzo de 2026  
> Todos los cambios ya fueron aplicados al código.

---

## 1. Resumen de cambios

Se implementaron 4 features genéricas de plataforma (no específicas de Dream Gift). Cualquier agente de WhatsApp puede usarlas.

| Feature | Archivos modificados |
|---------|----------------------|
| `trigger_human_handoff` builtin | `agent_executor.py` |
| Inyección de contexto WA en tools | `tools_integration.py`, `agent_executor.py` |
| Recepción de imágenes (Meta → S3) | `whatsapp_client.py`, `s3_service.py`, `whatsapp_service.py`, `whatsapp_route.py` |
| Webhook async genérico | `whatsapp_route.py`, `whatsapp_service.py` |
| Human handoff: bypass de agente | `whatsapp_service.py` |
| Sistema de etiquetas en sesiones | `whatsapp_repository.py`, `whatsapp_service.py` |
| Toggle agente por sesión (admin) | `whatsapp_route.py`, `whatsapp_service.py` |

---

## 2. Archivos modificados

### `app/models/whatsapp.py`

**Cambios:**
- `WhatsAppSession`: nuevo campo `labels: list[str] = []` — lista genérica de etiquetas de texto libre. Ejemplos: `"pendiente_revision"`, `"comprobante_recibido"`
- `WhatsAppChannel` / `WhatsAppChannelCreate` / `WhatsAppChannelUpdate`: campo `webhook_secret` (secreto compartido para verificar callbacks de sistemas externos)
- Nuevo modelo `AsyncWebhookPayload` — body del endpoint de callback async

### `app/repositories/whatsapp_repository.py`

**Cambios:**
- `_map_channel`: agrega `webhook_secret=item.get('webhook_secret')`
- `_map_session`: agrega `labels=list(item.get('labels') or [])` (lista vacía por defecto)
- Nuevo método `add_labels_to_session(session_id, labels: list[str])`: append atómico usando la expresión DynamoDB `list_append(if_not_exists(...))` — no requiere leer el item previo

> No se requieren cambios de schema en DynamoDB. Los campos nuevos se guardan y leen con `update_session` usando el patrón existente.

### `app/integrations/whatsapp_client.py`

**Cambio:** Nuevo método `download_media(media_id, wa_token) -> tuple[bytes, str]`

```python
def download_media(self, media_id: str, wa_token: str) -> tuple[bytes, str]:
    # Paso 1: GET /{media_id} → URL temporal + mime_type
    # Paso 2: GET {url} con Bearer → bytes del archivo
    # Returns: (content_bytes, mime_type)
```

### `app/integrations/s3_service.py`

**Cambio:** Nuevo método `upload_bytes(content, key, content_type) -> str`

```python
def upload_bytes(self, content: bytes, key: str, content_type: str = "image/jpeg") -> str:
    # Sube los bytes a S3 y devuelve la URL pública
    # https://{bucket}.s3.amazonaws.com/{key}
```

### `app/integrations/tools_integration.py`

**Cambios en `execute_tool`:**

1. **Nuevo parámetro:** `whatsapp_context: dict[str, str] | None = None`

2. **Resolución de templates en la URL** — se ejecuta antes del HTTP call:
   - Parámetros del LLM que aparecen en la URL como `{param}` son sustituidos y removidos del query string / body
   - Contexto WA (`{_session_id}`, `{_channel_id}`, `{_from_phone}`) se sustituye en la URL

3. **Inyección silenciosa** — para POST/PUT/PATCH, agrega automáticamente `_session_id`, `_channel_id`, `_from_phone` al body (el LLM no los ve ni los incluye en su llamada)

**Ejemplo de flujo para `generate_design`:**
```
URL configurada: https://api.ecommerce.com/api/designs
LLM input: { "photo_url": "...", "product_id": "lamp_led_16" }
whatsapp_context: { "session_id": "sess_abc", "channel_id": "ch_xyz", "from_phone": "521..." }

Body que llega al ecommerce:
{
  "photo_url": "...",
  "product_id": "lamp_led_16",
  "_session_id": "sess_abc",
  "_channel_id": "ch_xyz",
  "_from_phone": "521..."
}
```

**Ejemplo para `get_order_status`:**
```
URL configurada: https://api.ecommerce.com/api/orders/by-phone/{_from_phone}
whatsapp_context.from_phone = "5215551234"
URL resuelta: https://api.ecommerce.com/api/orders/by-phone/5215551234
GET request sin body ni query params
```

### `app/integrations/agent_executor.py`

**Cambios:**

1. **`_dispatch_tool`**: nuevo parámetro `whatsapp_context: dict | None = None`

2. **Nuevo builtin `trigger_human_handoff`** (caso `elif` antes del `else` final):
   - Lee `session_id` de `whatsapp_context` (no del `tool_input`)
   - Llama `whatsapp_repository.update_session(session_id, { "status": "human_handoff" })`
   - Llama `whatsapp_repository.add_labels_to_session(session_id, ["pendiente_revision"])`
   - Devuelve `ToolResult(success=True, result={"handoff": True, ...})`
   - Import lazy de `whatsapp_repository` para evitar circular imports

3. **`tools_integration.execute_tool`**: ahora se llama con `whatsapp_context=whatsapp_context`

4. **`_run_tool_loop`**: nuevo parámetro `whatsapp_context`, lo pasa a `_dispatch_tool`

5. **`run()`**: nuevo parámetro `whatsapp_context: dict | None = None`, lo pasa a `_run_tool_loop`

### `app/services/whatsapp_service.py`

**Cambios en `process_incoming_message`:**

1. **Nuevos parámetros opcionales:** `media_id: str | None = None`, `caption: str | None = None`

2. **Bloque de imagen** (se ejecuta ANTES de cualquier lógica de agente):
   - Descarga la imagen via `whatsapp_client.download_media`
   - Sube a S3 en `whatsapp/media/{channel_id}/{wa_message_id}.{ext}`
   - Si `session.status == "human_handoff"`:
     - Guarda mensaje tipo `image` con `media_url = s3_url`
     - Agrega la etiqueta `"comprobante_recibido"` con `add_labels_to_session`
     - Envía confirmación directa al cliente
     - **Return** (sin pasar al agente)
   - Si sesión activa: `message_text = "[Cliente envió imagen: {s3_url}]"` para que el agente tenga la URL

3. **Bypass de handoff para texto**: si `session.status == "human_handoff"`, guarda el mensaje y hace **return** sin llamar al agente

4. **`whatsapp_context`** pasado a `executor.run()`:
   ```python
   whatsapp_context={"session_id": session.id, "channel_id": channel_id, "from_phone": from_phone}
   ```

**Nuevo método `process_async_webhook(channel_id, session_id, payload)`:**

Maneja callbacks de sistemas externos. Flujo:
- `status == "ready"`: envía `message_to_client` al cliente, salva en historial, inyecta `context_for_agent` en el historial de conversación para que el agente lo tenga en el siguiente turno
- `status == "failed"`: envía `error_message`, activa `human_handoff` + agrega etiqueta `"pendiente_revision"`

**Nuevo método `toggle_session_agent(session_id)`:**

Alterna el estado del agente para una sesión:
- `active → human_handoff`: desactiva el agente + añade etiqueta `"pendiente_revision"`
- `human_handoff → active`: reactiva el agente + elimina `"pendiente_revision"` de las etiquetas

Devuelve la sesión actualizada.

### `app/routers/whatsapp_route.py`

**Cambio 1 — Webhook de mensajes entrantes:** Ahora maneja `msg_type == "image"`:
```python
elif msg_type == "image":
    media_id = image_data.get("id")
    caption = image_data.get("caption")
    message_text = ""
    # background task con media_id + caption
```
El check final de `if not message_text or not from_phone:` fue cambiado a `if not message_text and not media_id:`.

**Cambio 2 — Nuevo endpoint `POST /whatsapp/sessions/{session_id}/toggle`:**
```
Auth: admin o superior
Body: vacío
```
Llama a `whatsapp_service.toggle_session_agent`. Alterna `active ↔ human_handoff` y gestiona la etiqueta `"pendiente_revision"` automáticamente.

**Flujo del operador humano:**
1. El agente detecta intervención necesaria → llama `trigger_human_handoff` → sesión pasa a `human_handoff` + etiqueta `"pendiente_revision"`
2. El operador lee la conversación y responde manualmente usando el endpoint `POST /sessions/{id}/send`
3. El operador activa el agente de nuevo presionando el toggle en la UI → `POST /sessions/{id}/toggle` → sesión vuelve a `active`

**Cambio 3 — Nuevo endpoint `POST /whatsapp/webhooks/async/{channel_id}/{session_id}`:**
```
Header: X-Webhook-Secret: {canal.webhook_secret}
Body: AsyncWebhookPayload
```
- Verifica el `webhook_secret` del canal (si está configurado)
- Encola `whatsapp_service.process_async_webhook` como `BackgroundTask`
- Devuelve `202 Accepted` inmediatamente

---

## 3. Cómo pasar `trigger_human_handoff` al agente

La tool se crea en el frontend como cualquier otra tool HTTP, pero SIN `url` ni `method`. Solo necesita `name`, `description`, e `input_schema`. La plataforma la reconoce por nombre en `_dispatch_tool` y ejecuta la lógica interna.

**`input_schema` recomendado:**
```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

No necesita parámetros — el agente simplemente llama la tool cuando detecta que se requiere intervención humana. El `session_id` lo toma la plataforma del contexto de WhatsApp, no del LLM.

---

## 4. Configurar `webhook_secret` en un canal

En el panel de WhatsApp, al crear o editar un canal, hay un campo `webhook_secret`. El ecommerce debe usar ese mismo secreto en el header `X-Webhook-Secret` de sus callbacks.

Si `webhook_secret` está vacío en el canal, el endpoint acepta llamadas sin verificar (útil en desarrollo).

---

## 5. Llave de S3 para imágenes de WhatsApp

Las imágenes se guardan en:
```
whatsapp/media/{channel_id}/{wa_message_id}.{ext}
```
URL pública: `https://{S3_BUCKET}.s3.amazonaws.com/whatsapp/media/...`

> El bucket de producción (`sales-agent-ai`) debe tener ACL adecuado o ser público para que el ecommerce pueda acceder a `photo_url`.

---

## 6. Tests recomendados

| Escenario | Cómo probar |
|-----------|-------------|
| Imagen recibida en sesión activa | Enviar imagen por WA → verificar que el agente recibe `[Cliente envió imagen: https://...]` |
| Imagen recibida en sesión en handoff | Poner session en handoff → enviar imagen → verificar etiqueta `comprobante_recibido` + mensaje de confirmación al cliente |
| Texto recibido en handoff | Poner session en handoff → enviar texto → verificar que el agente NO responde |
| `trigger_human_handoff` desde agente | Configurar el agente con la tool → pedir intervención humana → verificar `session.status == "human_handoff"` + etiqueta `"pendiente_revision"` |
| Toggle desactivar | `POST /whatsapp/sessions/{id}/toggle` (sesión activa) → verificar `status == "human_handoff"` + label `"pendiente_revision"` |
| Toggle activar | `POST /whatsapp/sessions/{id}/toggle` (sesión en handoff) → verificar `status == "active"` + label eliminado |
| Callback async ready | `POST /whatsapp/webhooks/async/{channel_id}/{session_id}` con `status: "ready"` → verificar mensaje enviado al cliente + `context_for_agent` en historial |
| Callback async failed | Same con `status: "failed"` → verificar handoff activado + etiqueta `"pendiente_revision"` |
| Tool con URL template | Configurar tool con `{_from_phone}` en URL → verificar resolución correcta |
| Tool inyección body | POST tool con `whatsapp_context` → verificar `_session_id` en body del request HTTP |
