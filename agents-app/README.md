# Agents App

Panel de administración para gestionar agentes de inteligencia artificial.

## 📋 Descripción

Aplicación web que permite a los administradores:

- **Crear y configurar agentes:** Definir nombre, descripción, modelo de IA, temperatura, tokens y prompts personalizados
- **Gestionar documentos:** Subir y administrar documentos que sirven como base de conocimiento para los agentes
- **Constructor de flujos:** Crear flujos visuales que conectan múltiples agentes con condiciones lógicas
- **Monitorear actividad:** Visualizar logs de cambios y preguntas sin respuesta
- **Configurar herramientas:** Asignar herramientas (tools) disponibles para cada agente

## 🛠️ Tecnologías

- **Framework:** Next.js 16 con Turbopack
- **UI:** React 19, TailwindCSS 4
- **Estado:** TanStack Query (React Query)
- **Flujos visuales:** @xyflow/react
- **HTTP Client:** Axios
- **Iconos:** Lucide React
- **Lenguaje:** TypeScript

## 📁 Estructura

```
agents-app/
├── app/
│   ├── api/              # API routes (proxy, verify-jwt)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AgentCard.tsx          # Tarjeta de agente
│   ├── AgentChat.tsx          # Chat de prueba con agente
│   ├── AgentDashboard.tsx     # Dashboard principal
│   ├── AgentFlowBuilder.tsx   # Constructor visual de flujos
│   ├── AgentForm*.tsx         # Formularios de configuración
│   ├── AgentList.tsx          # Lista de agentes
│   ├── DocumentItem.tsx       # Item de documento
│   ├── FlowExecutionsList.tsx # Lista de ejecuciones de flujos
│   ├── FlowTraceViewer.tsx    # Visor de trazas
│   ├── Header.tsx             # Header de la app
│   ├── LogDetailModal.tsx     # Modal de detalle de logs
│   ├── Sidebar.tsx            # Barra lateral
│   ├── TabsLayout.tsx         # Layout con pestañas
│   ├── Unanswered.tsx         # Preguntas sin responder
│   └── flow-nodes/            # Nodos para el constructor de flujos
├── contexts/
│   └── UserContext.tsx        # Contexto de usuario
├── lib/
│   ├── api/                   # Servicios de API
│   └── hooks/                 # Custom hooks con React Query
├── providers/
│   └── QueryProvider.tsx      # Provider de React Query
└── public/
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

La aplicación estará disponible en `http://localhost:5000`

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

## 📡 API Endpoints Consumidos

| Endpoint | Descripción |
|----------|-------------|
| `GET /agents` | Listar agentes |
| `POST /agents` | Crear agente |
| `PUT /agents/:id` | Actualizar agente |
| `DELETE /agents/:id` | Eliminar agente |
| `GET /documents` | Listar documentos |
| `POST /documents` | Subir documento |
| `GET /flows` | Listar flujos |
| `POST /flows` | Crear flujo |
| `GET /tools` | Listar herramientas |
| `GET /logs` | Obtener logs |
| `GET /unanswered` | Preguntas sin respuesta |

## 🔐 Autenticación

La aplicación utiliza JWT para autenticación. El token se almacena en localStorage y se envía en el header `Authorization` de cada petición.
