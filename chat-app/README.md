# Chat App

Aplicación de chat para usuarios finales que permite interactuar con agentes de inteligencia artificial.

## 📋 Descripción

Interfaz de usuario para:

- **Conversar con agentes:** Interactuar con los agentes de IA configurados
- **Gestión de conversaciones:** Crear, continuar y eliminar conversaciones
- **Visualizar contexto:** Ver las fuentes y contextos utilizados por el agente
- **Preguntas frecuentes:** Acceso rápido a preguntas predefinidas por agente
- **Adjuntar documentos:** Subir archivos PDF para consultar

## 🛠️ Tecnologías

- **Framework:** Next.js 16
- **UI:** React 19, TailwindCSS 4
- **Estado:** TanStack Query (React Query)
- **Temas:** next-themes (dark/light mode)
- **Markdown:** react-markdown con remark-gfm
- **PDF Viewer:** pdfjs-dist
- **HTTP Client:** Axios
- **Iconos:** Lucide React
- **Lenguaje:** TypeScript

## 📁 Estructura

```
chat-app/
├── app/
│   ├── api/              # API routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AgentIcon.tsx          # Icono del agente
│   ├── AgentView.tsx          # Vista de selección de agente
│   ├── ChatView.tsx           # Vista principal del chat
│   ├── ContextItem.tsx        # Item de contexto
│   ├── ContextToggleButton.tsx
│   ├── ContextViewer.tsx      # Visor de contextos/fuentes
│   ├── DocumentationModal.tsx # Modal de documentación
│   ├── FrequentQuestions.tsx  # Preguntas frecuentes
│   ├── Header.tsx             # Header de la app
│   ├── MainContent.tsx        # Contenido principal
│   ├── PresentationModal.tsx  # Modal de presentación
│   ├── Sidebar.tsx            # Barra lateral con agentes y chats
│   └── UserManualModal.tsx    # Manual de usuario
├── contexts/
│   ├── ContextVisibilityContext.tsx  # Visibilidad del contexto
│   └── UserContext.tsx               # Contexto de usuario
├── lib/
│   ├── api/              # Servicios de API
│   └── hooks/            # Custom hooks
├── providers/
│   └── QueryProvider.tsx
└── public/
    └── icons/            # Iconos de agentes
```

## 🔧 Configuración

### Variables de Entorno

Copiar `.env.example` a `.env.local` y configurar las variables necesarias.

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5001`

### Build

```bash
npm run build
```

## 🚀 Despliegue

### Plataforma: AWS Amplify

El despliegue es automático con cada merge a la rama `main`:

1. Se realiza un PR y merge a `main`
2. AWS Amplify detecta el cambio automáticamente
3. Ejecuta el build de Next.js
4. Despliega la nueva versión

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   GitHub/   │────▶│   AWS Amplify   │────▶│   CDN/Edge  │
│  Bitbucket  │     │   (Build)       │     │  (Deploy)   │
└─────────────┘     └─────────────────┘     └─────────────┘
```

### Configuración en Amplify

- **Framework:** Next.js SSR
- **Build command:** `npm run build`
- **Output directory:** `.next`
- **Node.js version:** 18

## 💬 Funcionalidades

### Chat con Agentes
- Selección de agente desde el sidebar
- Historial de conversaciones por agente
- Respuestas en formato Markdown con soporte para código y tablas
- Indicador de carga mientras el agente responde

### Contexto y Fuentes
- Visualización de los documentos utilizados para generar la respuesta
- Score de relevancia de cada contexto
- Toggle para mostrar/ocultar el panel de contexto

### Preguntas Frecuentes
- Acceso rápido a preguntas predefinidas
- Configuradas por agente desde el panel de administración

### Tema Oscuro/Claro
- Soporte completo para modo oscuro
- Persistencia de preferencia del usuario

## 📡 API Endpoints Consumidos

| Endpoint | Descripción |
|----------|-------------|
| `GET /agents` | Listar agentes públicos |
| `GET /conversations` | Obtener conversaciones del usuario |
| `GET /messages/:chatId` | Obtener mensajes de una conversación |
| `POST /chat` | Enviar mensaje a un agente |
| `POST /chat/create-and-converse` | Crear conversación y enviar mensaje |
| `DELETE /conversations/:id` | Eliminar conversación |

## 🔐 Autenticación

La aplicación utiliza JWT para autenticación. El token se almacena en localStorage y se envía automáticamente en cada petición al backend.
