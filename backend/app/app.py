from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    agent_router,
    chat_router,
    conversation_router,
    document_router,
    execution_trace_router,
    log_router,
    message_router,
    tool_router,
    unanswered_router,
    auth_router,
    account_router,
    rag_trace_router,
    eval_set_router,
    whatsapp_router,
)

def create_app() -> FastAPI:
    app = FastAPI()

    # Configuración de CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "*"
        ],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/api")
    app.include_router(account_router, prefix="/api")
    app.include_router(agent_router, prefix="/api")
    app.include_router(chat_router, prefix="/api")
    app.include_router(conversation_router, prefix="/api")
    app.include_router(document_router, prefix="/api")
    app.include_router(execution_trace_router, prefix="/api")
    app.include_router(log_router, prefix="/api")
    app.include_router(message_router, prefix="/api")
    app.include_router(tool_router, prefix="/api")
    app.include_router(unanswered_router, prefix="/api")
    app.include_router(rag_trace_router, prefix="/api")
    app.include_router(eval_set_router, prefix="/api")
    app.include_router(whatsapp_router, prefix="/api")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app

app = create_app()