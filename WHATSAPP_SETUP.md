# WhatsApp Integration — Setup Guide

## 1. Instalar dependencia faltante en el frontend

`date-fns` se usa en `WhatsAppInboxItem.tsx` y no está en `package.json`. Instalarlo:

```bash
cd frontend
npm install date-fns
```

---

## 2. Crear las tablas DynamoDB

Ejecutar el script desde el directorio `backend/`:

```bash
cd backend
python scripts/create_dynamo_tables.py
```

Esto crea (entre otras) las tres tablas nuevas:

| Tabla | GSIs |
|---|---|
| `ai-whatsapp-channel` | `account_id-index` |
| `ai-whatsapp-session` | `channel_id-from_phone-index`, `channel_id-last_message_at-index` |
| `ai-whatsapp-message` | `session_id-created_at-index`, `wa_message_id-index` |

---

## 3. Configurar Meta WhatsApp Business API

### 3.1 Crear la app en Meta for Developers

1. Ir a [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App**
2. Tipo: **Business**
3. Agregar producto: **WhatsApp**
4. En **WhatsApp → API Setup** verás:
   - **Phone Number ID** (`phone_number_id`)
   - **WhatsApp Business Account ID**
   - **Temporary access token** (válido 24h) → en producción usar [System User token](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens) permanente

### 3.2 Configurar el Webhook en Meta

1. En tu app de Meta: **WhatsApp → Configuration → Webhook**
2. **Callback URL**: `https://<tu-dominio>/api/whatsapp/webhook/<channel_id>`
   - El `channel_id` es el UUID que asigna esta aplicación al crear el canal desde el dashboard
3. **Verify Token**: el valor que elijas al crear el canal en el dashboard (campo `verify_token`)
4. **Webhook fields**: activar `messages`

> El backend devuelve `200 OK` inmediatamente y procesa el mensaje en background para no superar el timeout de 20s de Meta.

### 3.3 Obtener el App Secret (opcional pero recomendado)

Para validar las firmas HMAC-SHA256 de Meta:

1. Meta for Developers → **App Settings → Basic**
2. Copiar el **App Secret**
3. Ingresarlo en el campo `app_secret` al crear el canal en el dashboard

---

## 4. Crear un canal desde el dashboard

1. Abrir la app → sección **WhatsApp** en la barra lateral
2. Clic en **Nuevo Canal**
3. Completar los campos:

| Campo | Descripción |
|---|---|
| `name` | Nombre descriptivo (ej. "Soporte") |
| `phone_number_id` | ID del número en Meta (ej. `123456789012345`) |
| `wa_token` | Access token de la app de Meta |
| `verify_token` | Cadena arbitraria que copiarás en el webhook de Meta |
| `agent_id` | El agente de esta app que responderá los mensajes |
| `app_secret` | *(Opcional)* App Secret para validar firmas HMAC |

4. Al guardar se mostrará la **URL del webhook** y el **Verify Token** para copiar en Meta.
5. Configurar el webhook en Meta (ver sección 3.2).
6. Activar el canal con el toggle.

---

## 5. Variables de entorno (opcionales)

Los nombres de las tablas DynamoDB tienen defaults y no requieren variables de entorno salvo que quieras renombrarlas. Si lo necesitas, agregar en `backend/.env`:

```env
WHATSAPP_CHANNEL_TABLE=ai-whatsapp-channel
WHATSAPP_SESSION_TABLE=ai-whatsapp-session
WHATSAPP_MESSAGE_TABLE=ai-whatsapp-message
```

Actualizar también `.env.example` para documentarlo:

```env
# WhatsApp DynamoDB tables (optional, these are the defaults)
WHATSAPP_CHANNEL_TABLE=ai-whatsapp-channel
WHATSAPP_SESSION_TABLE=ai-whatsapp-session
WHATSAPP_MESSAGE_TABLE=ai-whatsapp-message
```

---

## 6. Checklist de puesta en marcha

- [ ] `npm install date-fns` en `frontend/`
- [ ] `python scripts/create_dynamo_tables.py` ejecutado correctamente
- [ ] App de Meta creada con producto WhatsApp
- [ ] Access token (permanente para producción) obtenido
- [ ] Canal creado en el dashboard con `phone_number_id` y `wa_token`
- [ ] Webhook configurado en Meta apuntando a la URL que muestra el dashboard
- [ ] Canal activado (toggle ON)
- [ ] Probar enviando un mensaje al número desde WhatsApp → debe aparecer en el inbox

---

## 7. Flujo de un mensaje entrante

```
WhatsApp (usuario)
    │  POST /api/whatsapp/webhook/{channel_id}
    ▼
FastAPI webhook handler
    ├─ Valida firma HMAC (si app_secret configurado)
    ├─ Devuelve 200 OK inmediatamente
    └─ Lanza BackgroundTask: process_incoming_message()
            ├─ Deduplicación por wa_message_id
            ├─ Crea/obtiene sesión del contacto
            ├─ Guarda mensaje del usuario (status=received)
            ├─ Placeholder de respuesta (status=processing) ← el frontend lo muestra
            ├─ Llama al AgentExecutor con historial de conversación
            ├─ Actualiza placeholder → status=sent
            └─ Envía respuesta vía Meta Graph API
```
