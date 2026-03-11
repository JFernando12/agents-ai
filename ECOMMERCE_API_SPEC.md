# The Dream Gift — API Spec para el Ecommerce

> Documento para el desarrollador del ecommerce externo.  
> Fecha: 10 de marzo de 2026  
> Versión: 1.0

---

## Contexto

La plataforma de agentes AI gestiona conversaciones de WhatsApp. Cuando un cliente quiere comprar una lámpara personalizada, el agente de chat llama a los endpoints de este documento para procesar pagos, generar diseños y crear pedidos.

La comunicación funciona en ambas direcciones:
- **Plataforma → Ecommerce** (requests de tools): pagos, diseños, pedidos
- **Ecommerce → Plataforma** (callbacks): cuando una operación asíncrona termina

---

## Autenticación

Todos los endpoints de ecommerce requieren:
```
Authorization: Bearer {API_KEY}
```
Generar un API key y compartirlo con el equipo de la plataforma.

---

## Base URL

```
https://api.thedreamgiftmx.com
```

---

## 1. Pagos (Mercado Pago)

### Crear link de pago
```
POST /api/payments/link
```

**Request:**
```json
{
  "amount": 100,
  "concept": "Apartado The Dream Gift",
  "order_ref": "TDG-5215551234-1741600000",
  "phone": "5215551234",
  "expiration_hours": 24,
  "_session_id": "sess_abc123",
  "_channel_id": "ch_xyz",
  "_from_phone": "5215551234"
}
```

> Los campos `_session_id`, `_channel_id`, `_from_phone` son inyectados automáticamente por la plataforma. Pueden usarse para asociar el pago a la sesión o ignorarse.

**Valores de `amount` esperados:**
| Caso | Monto |
|------|-------|
| Apartado (primera parte) | 100 |
| Pago total lámpara LED | 597 |
| Pago total lámpara madera | 719 |
| Saldo lámpara LED (después de apartado) | 497 |
| Saldo lámpara madera (después de apartado) | 619 |

**Response 201:**
```json
{
  "payment_id": "pay_abc123",
  "payment_url": "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=xxx",
  "expires_at": "2026-03-11T18:00:00Z"
}
```

**Response 422:**
```json
{ "error": "invalid_amount", "message": "El monto mínimo es $10 MXN" }
```

---

### Consultar estado de pago
```
GET /api/payments/{payment_id}
```

**Response 200:**
```json
{
  "payment_id": "pay_abc123",
  "status": "pending",
  "amount": 100,
  "paid_at": null
}
```

**Valores de `status`:** `pending` | `approved` | `rejected` | `expired`

---

## 2. Diseños

> El diseño consiste en **vectorizar la foto del cliente**: se convierte a blanco con solo los trazos para corte láser. Para generarlo **únicamente se necesita la foto** — no se requiere texto, nombre ni ningún dato adicional.

### Solicitar generación de diseño
```
POST /api/designs
```

**Request:**
```json
{
  "photo_url": "https://sales-agent-ai.s3.amazonaws.com/whatsapp/media/ch_xyz/msg_abc.jpg",
  "product_id": "lamp_led_16",
  "_session_id": "sess_abc123",
  "_channel_id": "ch_xyz",
  "_from_phone": "5215551234"
}
```

**Valores de `product_id`:** `lamp_led_16` | `lamp_wood`

**Response 202 — Aceptado, procesando:**
```json
{
  "job_id": "dsn_abc123",
  "estimated_seconds": 30
}
```

**Response 422:**
```json
{ "error": "invalid_photo_url", "message": "No se pudo descargar la foto" }
```

**Importante:** Cuando el diseño esté listo, el ecommerce debe llamar al webhook de la plataforma (ver sección 5). El `_session_id` y `_channel_id` son los identificadores que el ecommerce necesita para construir la URL del callback.

---

### Consultar estado de diseño (opcional, para polling)
```
GET /api/designs/{job_id}
```

**Response 200:**
```json
{
  "job_id": "dsn_abc123",
  "status": "processing",
  "design_url": null,
  "iteration": 1,
  "error_message": null
}
```

**Valores de `status`:** `processing` | `ready` | `failed`

---

### Aprobar diseño
```
POST /api/designs/{job_id}/approve
```

**Request:** body vacío `{}`

**Response 200:**
```json
{ "approved": true }
```

---

### Solicitar revisión del diseño
```
POST /api/designs/{job_id}/revision
```

**Request:**
```json
{
  "change_notes": "El recorte quedó muy al borde, centra más la cara",
  "_session_id": "sess_abc123",
  "_channel_id": "ch_xyz",
  "_from_phone": "5215551234"
}
```

**Response 202:**
```json
{
  "job_id": "dsn_abc124",
  "estimated_seconds": 30
}
```

> El nuevo `job_id` es un ID distinto. Cuando el diseño revisado esté listo, el ecommerce debe llamar al webhook de la plataforma con este nuevo `job_id`.

---

## 3. Pedidos

El pedido se crea en cuanto el cliente confirma un pago, sea apartado o total. Esto permite tener trazabilidad desde el inicio del proceso.

**Ciclo de vida de un pedido:**
```
apartado → en_produccion → enviado → entregado
```
- **`apartado`**: el cliente pagó el depósito ($100). El diseño debe estar aprobado antes de pasar a producción.
- **`en_produccion`**: pago completo confirmado. La lámpara está siendo fabricada.
- **`enviado`**: entregado a paquetería.
- **`entregado`**: recibido por el cliente.
- **`cancelado`**: pedido cancelado.

> Si el cliente paga **el total de una vez** (sin apartado), el pedido se crea directamente con `status: "en_produccion"`.

### Crear pedido
```
POST /api/orders
```

**Request:**
```json
{
  "product_id": "lamp_led_16",
  "design_job_id": "dsn_abc123",
  "payment_id": "pay_abc123",
  "payment_type": "mp_deposit",
  "customer_name": "María García López",
  "street": "Av. Insurgentes 123 Int 4",
  "neighborhood": "Del Valle",
  "city": "Ciudad de México",
  "state": "CDMX",
  "zip_code": "03100",
  "photo_url": "https://sales-agent-ai.s3.amazonaws.com/whatsapp/media/...",
  "custom_text": "Para siempre juntos",
  "spotify_ref": "Ed Sheeran - Perfect",
  "_from_phone": "5215551234",
  "_session_id": "sess_abc123",
  "_channel_id": "ch_xyz"
}
```

**Valores de `payment_type`:** `mp_full` | `mp_deposit` | `mp_balance` | `transfer_full` | `transfer_deposit`

> Los campos `custom_text`, `spotify_ref` son opcionales. `_from_phone` es inyectado por la plataforma y puede usarse como `phone` del cliente.

**Response 201:**
```json
{
  "order_id": "ord_xyz789",
  "order_number": "TDG-2026-0042",
  "status": "apartado",
  "estimated_production_days": 2,
  "estimated_delivery_days": "2-5"
}
```

> Cuando `payment_type` es `mp_deposit` o `transfer_deposit`, el status será `"apartado"`. 
> Cuando `payment_type` es `mp_full` o `transfer_full`, el status será `"en_produccion"`.

**Response 422:**
```json
{ "error": "payment_not_approved", "message": "El pago no está confirmado" }
{ "error": "design_not_approved", "message": "El diseño no ha sido aprobado" }
```

---

### Confirmar pago de saldo (apartado → en producción)
```
POST /api/orders/{order_id}/pay-balance
```

El agente llama este endpoint cuando el cliente que ya tenía un apartado paga el saldo restante.

**Request:**
```json
{
  "payment_id": "pay_bal_456",
  "_session_id": "sess_abc123",
  "_channel_id": "ch_xyz",
  "_from_phone": "5215551234"
}
```

**Response 200:**
```json
{
  "order_id": "ord_xyz789",
  "order_number": "TDG-2026-0042",
  "status": "en_produccion",
  "estimated_production_days": 2,
  "estimated_delivery_days": "2-5"
}
```

**Response 422:**
```json
{ "error": "payment_not_approved", "message": "El pago del saldo no está confirmado" }
{ "error": "order_not_found", "message": "El pedido no existe" }
{ "error": "order_already_paid", "message": "Este pedido ya tiene pago completo" }
```

---

### Consultar pedidos por teléfono
```
GET /api/orders/by-phone/{phone}
```

La URL incluye el teléfono directamente (no como query param). La plataforma resuelve `{_from_phone}` en la URL automáticamente.

**Response 200:**
```json
{
  "orders": [
    {
      "order_id": "ord_xyz789",
      "order_number": "TDG-2026-0042",
      "status": "enviado",
      "status_label": "Tu pedido va en camino 🚚",
      "created_at": "2026-03-10T12:00:00Z",
      "product_name": "Lámpara LED 16 colores",
      "tracking_number": "1Z999AA10123456784",
      "carrier": "DHL",
      "tracking_url": "https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=xxx",
      "estimated_delivery": "2026-03-14"
    }
  ]
}
```

Si no hay pedidos, devolver `{ "orders": [] }`.

---

## 4. Manejo de errores

Para todos los endpoints, en caso de error:

| HTTP status | Cuándo usarlo |
|-------------|---------------|
| `400` | Request malformado |
| `401` | API key inválida o faltante |
| `404` | Recurso no encontrado |
| `422` | Validación de negocio fallida (payment_id inválido, design no aprobado, etc.) |
| `500` | Error interno del ecommerce |

Para errores 422, incluir siempre `error` (código de máquina) y `message` (texto legible):
```json
{ "error": "payment_not_approved", "message": "El pago no está confirmado" }
```

---

## 5. Callback: operaciones asíncronas

Cuando el diseño (o cualquier operación larga) termine, el ecommerce debe notificar a la plataforma.

### URL del callback

```
POST https://{PLATAFORMA_BASE_URL}/whatsapp/webhooks/async/{channel_id}/{session_id}
```

Los valores de `channel_id` y `session_id` vienen de los campos `_channel_id` y `_session_id` que la plataforma inyectó en el request original de `POST /api/designs`.

### Header de autenticación

```
X-Webhook-Secret: {WEBHOOK_SECRET}
```

El secreto será proporcionado por el equipo de la plataforma (configurado en el canal de WhatsApp).

---

### Diseño listo (success)

```json
POST /whatsapp/webhooks/async/{channel_id}/{session_id}
X-Webhook-Secret: whsec_...

{
  "status": "ready",
  "message_to_client": {
    "type": "multi",
    "messages": [
      {
        "type": "image",
        "url": "https://cdn.thedreamgiftmx.com/designs/dsn_abc123.jpg",
        "caption": "Tu diseño personalizado 🎨"
      },
      {
        "type": "text",
        "body": "¿Qué te parece? Responde *sí, me gusta* para confirmarlo\no dime qué quisieras cambiar."
      }
    ]
  },
  "context_for_agent": {
    "design_job_id": "dsn_abc123",
    "design_url": "https://cdn.thedreamgiftmx.com/designs/dsn_abc123.jpg",
    "design_status": "awaiting_approval"
  }
}
```

> `context_for_agent` es opcional pero recomendado. La plataforma lo inyecta en el historial de conversación para que el agente sepa el `job_id` cuando el cliente responda — sin necesidad de que el cliente lo repita.

### Diseño fallido

```json
{
  "status": "failed",
  "error_message": "No pudimos generar tu diseño. Nuestro equipo te contactará pronto 🙏"
}
```

La plataforma enviará el `error_message` al cliente y activará el handoff humano automáticamente.

---

### Estructura de `message_to_client`

Puede ser un **string** simple o un **objeto canónico**:

**String:**
```json
{ "message_to_client": "Tu diseño está listo 🎨" }
```

**Objeto tipo `text`:**
```json
{
  "message_to_client": {
    "type": "text",
    "body": "Tu diseño está listo 🎨"
  }
}
```

**Objeto tipo `image`:**
```json
{
  "message_to_client": {
    "type": "image",
    "url": "https://cdn.../diseño.jpg",
    "caption": "Tu diseño 🎨"
  }
}
```

**Objeto tipo `multi` (varios mensajes seguidos):**
```json
{
  "message_to_client": {
    "type": "multi",
    "messages": [
      { "type": "image", "url": "...", "caption": "..." },
      { "type": "text", "body": "..." }
    ]
  }
}
```

---

## 6. Resumen de endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/payments/link` | Crear link de pago MP |
| `GET` | `/api/payments/{payment_id}` | Consultar estado de pago |
| `POST` | `/api/designs` | Solicitar generación de diseño |
| `GET` | `/api/designs/{job_id}` | Consultar estado de diseño |
| `POST` | `/api/designs/{job_id}/approve` | Aprobar diseño |
| `POST` | `/api/designs/{job_id}/revision` | Solicitar revisión |
| `POST` | `/api/orders` | Crear pedido (apartado o completo) |
| `POST` | `/api/orders/{order_id}/pay-balance` | Confirmar pago de saldo |
| `GET` | `/api/orders/by-phone/{phone}` | Consultar pedidos por teléfono |
| `POST` | `{plataforma}/whatsapp/webhooks/async/{channel_id}/{session_id}` | **Callback** del ecommerce a la plataforma |

---

## 7. Diagrama de flujo completo

```
Cliente                 Agente (plataforma)              Ecommerce
   │                          │                               │
   │── "quiero una de estas" ►│                               │
   │◄── preview + precio ─────│                               │
   │                          │                               │
   │── envía foto ───────────►│                               │
   │                          │── POST /api/designs ─────────►│
   │◄── "generando diseño..." ─│◄── 202 { job_id } ───────── ─│
   │                          │                       job listo│
   │                          │◄── callback async ────────────│
   │◄── imagen del diseño ────│                               │
   │                          │                               │
   │── "me gusta" ───────────►│                               │
   │                          │── POST /designs/{id}/approve ►│
   │                          │                               │
   │◄── link pago apartado ───│── POST /api/payments/link ───►│
   │                          │◄── { payment_id, url } ───────│
   │── paga $100 ────────────►│                               │
   │                          │── GET /api/payments/{id} ────►│
   │                          │◄── { status: "approved" } ────│
   │                          │── POST /api/orders ──────────►│  ← crea con status "apartado"
   │◄── "apartado confirmado" ─│◄── { order_id, "apartado" } ─│
   │                          │                               │
   │── "pagar saldo" ────────►│                               │
   │◄── link saldo ───────────│── POST /api/payments/link ───►│
   │── paga saldo ───────────►│                               │
   │                          │── GET /api/payments/{id} ────►│
   │                          │── POST /orders/{id}/pay-bal ─►│  ← actualiza a "en_produccion"
   │◄── "¡en producción! 🎉" ──│◄── { status: "en_produccion"} │
```

> Si el cliente paga el total de una vez, se omite el paso del apartado y el pedido se crea directamente con `status: "en_produccion"`.

---

## 8. Preguntas frecuentes

**¿El pedido se puede cancelar si el cliente no paga el saldo?**  
Eso queda a criterio del ecommerce. La plataforma no cancela pedidos automáticamente. Se recomienda que el ecommerce implemente una política de cancelación automática si un pedido permanece en `"apartado"` más de N días.

**¿El agente llama a `pay-balance` automáticamente?**  
Sí, igual que con `create_order`: el agente verifica primero que el pago del saldo esté aprobado (`GET /api/payments/{id}`) y luego llama `pay-balance` con ese `payment_id`.

**¿Y si el cliente paga el total desde el inicio?**  
El agente llama directamente a `POST /api/orders` con `payment_type: "mp_full"` o `"transfer_full"`. El pedido se crea con `status: "en_produccion"` y no se llama `pay-balance`.

**¿Puedo usar el `phone` del campo `_from_phone` para registrar al cliente?**  
Sí. El número siempre está en formato internacional sin `+` (ej. `5215551234`).

**¿Qué pasa si el webhook de callback falla (timeout, error 5xx)?**  
La plataforma no tiene reintentos automáticos actualmente. El ecommerce debe implementar reintentos en su scheduler de jobs. Alternativamente, el ecommerce puede detectar timeouts y llamar al webhook con `status: "failed"` para que la plataforma active el handoff humano.

**¿Los `_*` fields en el body son siempre strings?**  
Sí, siempre son strings. `_from_phone` no tiene el `+` del prefijo internacional.

**¿Puede el ecommerce ignorar los `_*` fields?**  
Sí, completamente. Son opcionales para el ecommerce. Solo importan para el callback async.

**¿El `payment_id` de `create_order` ya fue verificado antes de llegar aquí?**  
Sí. El agente llama primero a `check_payment_status` y solo llama a `create_order` cuando el status es `approved`. Lo mismo aplica para `pay-balance`. Sin embargo, el ecommerce debe validarlo también por seguridad.
