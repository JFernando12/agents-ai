# Backend - API de Agentes IA

API REST construida con FastAPI para gestionar agentes de inteligencia artificial con integración a AWS Bedrock.

## 📋 Descripción

Backend que proporciona:

- **Gestión de agentes:** CRUD completo de agentes de IA con configuración de modelos, prompts y parámetros
- **Chat con IA:** Integración con Amazon Bedrock para conversaciones inteligentes
- **Gestión de documentos:** Subida, procesamiento y vectorización de documentos PDF
- **Flujos de trabajo:** Ejecución de flujos que conectan múltiples agentes
- **Herramientas (Tools):** Integración de herramientas externas que los agentes pueden utilizar
- **Logs y auditoría:** Registro de cambios y actividad del sistema

## 🛠️ Tecnologías

- **Framework:** FastAPI 0.125
- **Runtime:** Python 3.12+, Uvicorn
- **Validación:** Pydantic 2.12
- **AWS SDK:** Boto3
- **IA/ML:** LangChain, LangChain AWS
- **PDF Processing:** PyPDF2
- **Auth:** PyJWT

## 📁 Estructura

```
backend/
├── app/
│   ├── config/
│   │   └── environment.py    # Variables de entorno
│   ├── enums/                # Enumeraciones (ModelType, etc.)
│   ├── integrations/
│   │   ├── agent_executor.py      # Ejecutor de agentes con Bedrock
│   │   ├── flow_execution_service.py
│   │   ├── logger_service.py
│   │   ├── pdf_service.py
│   │   ├── s3_service.py
│   │   └── tools_integration.py
│   ├── middleware/           # Middlewares personalizados
│   ├── models/               # Modelos Pydantic
│   ├── repositories/         # Acceso a DynamoDB
│   ├── routers/
│   │   ├── agent_route.py
│   │   ├── chat_route.py
│   │   ├── conversation_route.py
│   │   ├── document_route.py
│   │   ├── execution_route.py
│   │   ├── flow_route.py
│   │   ├── log_route.py
│   │   ├── message_route.py
│   │   ├── tool_route.py
│   │   ├── trace_route.py
│   │   └── unanswered_route.py
│   ├── services/             # Lógica de negocio
│   ├── shared/               # Utilidades compartidas
│   ├── tools/                # Definición de herramientas
│   ├── utils/                # Utilidades generales
│   └── app.py                # Configuración de FastAPI
├── main.py                   # Entry point
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## 🔧 Configuración

### Variables de Entorno

Copiar `.env.example` a `.env` y configurar las variables necesarias.

### Instalación

```bash
pip install -r requirements.txt
```

### Desarrollo

```bash
python main.py
```

La API estará disponible en `http://localhost:8000`

- Documentación interactiva: http://localhost:8000/docs
- Documentación alternativa: http://localhost:8000/redoc

### Con Docker

```bash
docker-compose up --build
```

## 📡 API Endpoints

### Agentes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/agents` | Listar todos los agentes |
| GET | `/api/agents/:id` | Obtener agente por ID |
| POST | `/api/agents` | Crear nuevo agente |
| PUT | `/api/agents/:id` | Actualizar agente |
| DELETE | `/api/agents/:id` | Eliminar agente |

### Chat
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/chat` | Enviar mensaje al agente |
| POST | `/api/chat/create-and-converse` | Crear conversación y enviar mensaje |

### Conversaciones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/conversations` | Listar conversaciones |
| GET | `/api/conversations/:id` | Obtener conversación |
| DELETE | `/api/conversations/:id` | Eliminar conversación |

### Documentos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/documents` | Listar documentos |
| POST | `/api/documents` | Subir documento |
| DELETE | `/api/documents/:id` | Eliminar documento |

### Flujos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/flows` | Listar flujos |
| POST | `/api/flows` | Crear flujo |
| PUT | `/api/flows/:id` | Actualizar flujo |
| POST | `/api/flows/:id/execute` | Ejecutar flujo |

### Health Check
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado del servicio |

## 🗄️ Base de Datos

### DynamoDB Tables

| Tabla | Descripción |
|-------|-------------|
| `ia-servicio` | Configuración de agentes |
| `ia-chat` | Conversaciones |
| `ia-mensaje` | Mensajes de chat |
| `ia-documento` | Documentos subidos |
| `ia-flow` | Definición de flujos |
| `ia-flow-execution` | Ejecuciones de flujos |
| `ia-flow-trace` | Trazas de ejecución |
| `ia-log` | Logs de auditoría |
| `ia-unanswered` | Preguntas sin respuesta |

## 🤖 Modelos de IA Soportados

Los agentes pueden configurarse con diferentes modelos de Amazon Bedrock:

- Claude 3.5 Sonnet
- Claude 3 Haiku
- Amazon Titan

## 🚀 Despliegue

### Plataforma: AWS App Runner + ECR

El despliegue es automático mediante Bitbucket Pipelines:

1. Se realiza merge a la rama `main` con cambios en `backend/**`
2. Bitbucket Pipelines detecta los cambios
3. Construye la imagen Docker
4. Publica en Amazon ECR
5. AWS App Runner detecta la nueva imagen y actualiza el servicio

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Bitbucket     │────▶│   Amazon ECR    │────▶│  AWS App Runner │
│   Pipelines     │     │  (Container)    │     │   (Deploy)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

> Ver `bitbucket-pipelines.yml` en la raíz del repositorio para más detalles.

## 🔐 Autenticación

La API utiliza JWT Bearer tokens. Incluir el header:

```
Authorization: Bearer <token>
```
