import json
import time

import boto3

from app.config import env
from app.enums import ModelType
from app.integrations.answer_analyzer import answer_analyzer
from app.integrations.rag_service import rag_service
from app.integrations.tools_integration import tools_integration
from app.models import ToolResult
from app.models.agent import RAGConfig
from app.models.execution import AgentConfig, AgentResponse, ExecutionTraceCreate, ToolCallTrace
from app.models.rag_trace import RAGTraceCreate
from app.repositories import agent_repository, tool_repository

# ── WhatsApp-specific tool names ──────────────────────────────────────────────
WA_TOOL_NAMES = {
    "send_whatsapp_text",
    "send_whatsapp_image",
    "send_whatsapp_document",
    "send_whatsapp_buttons",
    "send_whatsapp_list",
}

WA_TOOL_SPECS = [
    {
        "toolSpec": {
            "name": "send_whatsapp_text",
            "description": (
                "Envía un mensaje de texto al usuario en WhatsApp. "
                "Úsala cuando necesites enviar texto en un momento específico del flujo, "
                "por ejemplo antes o después de una imagen. "
                "Permite controlar el orden de los mensajes."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "description": "Texto del mensaje a enviar",
                        },
                    },
                    "required": ["message"],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "send_whatsapp_image",
            "description": (
                "Envía una imagen al usuario en WhatsApp. "
                "Úsala cuando necesites mostrar una imagen, gráfica, captura de pantalla o foto. "
                "El campo 'url' debe ser una URL pública."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "URL pública de la imagen (jpg, png, webp, gif)",
                        },
                        "caption": {
                            "type": "string",
                            "description": "Texto descriptivo opcional que aparece debajo de la imagen",
                        },
                    },
                    "required": ["url"],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "send_whatsapp_document",
            "description": (
                "Envía un documento (PDF, Excel, Word, CSV, etc.) al usuario en WhatsApp. "
                "Úsala cuando necesites compartir un archivo descargable."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "URL pública del documento",
                        },
                        "filename": {
                            "type": "string",
                            "description": "Nombre del archivo que verá el usuario (ej. 'reporte_enero.pdf')",
                        },
                        "caption": {
                            "type": "string",
                            "description": "Texto descriptivo opcional",
                        },
                    },
                    "required": ["url", "filename"],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "send_whatsapp_buttons",
            "description": (
                "Envía un mensaje interactivo con botones de respuesta rápida en WhatsApp. "
                "Úsala cuando quieras que el usuario elija entre 2 o 3 opciones cortas. "
                "El campo 'body' es el texto principal del mensaje (obligatorio). "
                "Máximo 3 botones; el título de cada botón tiene un máximo de 20 caracteres."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "body": {
                            "type": "string",
                            "description": "Texto principal del mensaje",
                        },
                        "footer": {
                            "type": "string",
                            "description": "Texto secundario pequeño debajo del cuerpo (opcional)",
                        },
                        "buttons": {
                            "type": "array",
                            "description": "Lista de botones (mínimo 1, máximo 3)",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string", "description": "Identificador único del botón"},
                                    "title": {"type": "string", "description": "Texto del botón (máximo 20 caracteres)"},
                                },
                                "required": ["id", "title"],
                            },
                            "minItems": 1,
                            "maxItems": 3,
                        },
                    },
                    "required": ["body", "buttons"],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "send_whatsapp_list",
            "description": (
                "Envía un mensaje interactivo con una lista de opciones en WhatsApp. "
                "Úsala cuando el usuario necesite elegir entre más de 3 opciones o que estén "
                "organizadas en secciones. El campo 'body' es el texto principal. "
                "Máximo 10 filas en total entre todas las secciones."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "body": {
                            "type": "string",
                            "description": "Texto principal del mensaje",
                        },
                        "button_label": {
                            "type": "string",
                            "description": "Texto del botón que abre la lista (ej. 'Ver opciones')",
                        },
                        "footer": {
                            "type": "string",
                            "description": "Texto secundario opcional",
                        },
                        "sections": {
                            "type": "array",
                            "description": "Secciones de la lista",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string", "description": "Título de la sección"},
                                    "rows": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "id": {"type": "string"},
                                                "title": {"type": "string", "description": "Máximo 24 caracteres"},
                                                "description": {"type": "string", "description": "Descripción opcional"},
                                            },
                                            "required": ["id", "title"],
                                        },
                                    },
                                },
                                "required": ["title", "rows"],
                            },
                        },
                    },
                    "required": ["body", "button_label", "sections"],
                }
            },
        }
    },
]

class AgentExecutor:
    def __init__(self, agent_id: str) -> None:
        self.agent_id = agent_id
        self.bedrock = boto3.client(
            "bedrock-runtime",
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key,
        )

    # -------------------------------------------------------------------------
    # Config helpers
    # -------------------------------------------------------------------------

    def _load_agent_config(self):
        agent_config = agent_repository.get_by_id(self.agent_id)
        if not agent_config:
            raise ValueError(f"Agent configuration not found for agent_id: {self.agent_id}")
        return agent_config

    def _resolve_model_id(self, model: str) -> str:
        model_type = ModelType(model) if isinstance(model, str) else model
        if not isinstance(model_type, ModelType):
            raise ValueError("Invalid model type provided in service configuration.")
        return ModelType.get_model_id(model_type)

    # -------------------------------------------------------------------------
    # Prompt / message builders
    # -------------------------------------------------------------------------

    def _build_system_prompt(self, system_prompt: str, context: dict | None) -> str:
        parts = []
        if system_prompt:
            parts.append(system_prompt)
        if context:
            context_lines = "\n".join(f"- {k}: {v}" for k, v in context.items())
            parts.append(f"### Contexto adicional\n\n{context_lines}")
        return "\n\n".join(parts)

    def _build_converse_messages(self, messages: list, attached_text: str | None) -> list:
        converse_messages = []
        if attached_text:
            converse_messages.append({
                "role": "user",
                "content": [{"text": f"### Contenido de archivo adjunto\n\n{attached_text[:12000]}"}],
            })
            converse_messages.append({
                "role": "assistant",
                "content": [{"text": "Entendido, he recibido el contenido del archivo adjunto."}],
            })
        for msg in messages:
            converse_messages.append({"role": msg["role"], "content": [{"text": msg["text"]}]})
        return converse_messages

    # -------------------------------------------------------------------------
    # Tool spec builder
    # -------------------------------------------------------------------------

    def _build_tool_specs(
        self,
        enabled_tool_ids: list[str],
        enabled_sub_agent_ids: list[str],
        whatsapp_enabled: bool = False,
    ) -> tuple[list, dict[str, str]]:
        db_tools = tool_repository.get_by_ids(enabled_tool_ids)
        tool_specs = [
            {
                "toolSpec": {
                    "name": t.name,
                    "description": t.description,
                    "inputSchema": {"json": t.input_schema},
                }
            }
            for t in db_tools
        ]

        sub_agent_name_to_id: dict[str, str] = {}
        for sub_agent_id in enabled_sub_agent_ids:
            sub_agent_config = agent_repository.get_by_id(sub_agent_id)
            if sub_agent_config:
                tool_name = f"sub_{sub_agent_id.replace('-', '')}"
                sub_agent_name_to_id[tool_name] = sub_agent_id
                tool_specs.append({
                    "toolSpec": {
                        "name": tool_name,
                        "description": (
                            f"Sub-agente: {sub_agent_config.name}. "
                            f"{sub_agent_config.description or ''}"
                        ).strip(),
                        "inputSchema": {
                            "json": {
                                "type": "object",
                                "properties": {
                                    "message": {
                                        "type": "string",
                                        "description": "Mensaje o instrucción para el sub-agente",
                                    }
                                },
                                "required": ["message"],
                            }
                        },
                    }
                })

        # Always expose search_knowledge_base so the agent can query its KB on demand
        tool_specs.append({
            "toolSpec": {
                "name": "search_knowledge_base",
                "description": (
                    "Busca en la base de conocimientos del agente documentos relevantes para responder "
                    "la consulta del usuario. Úsalo cuando necesites información específica que podría "
                    "estar en los documentos cargados como fuentes de conocimiento."
                ),
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Consulta o pregunta para buscar en la base de conocimientos",
                            }
                        },
                        "required": ["query"],
                    }
                },
            }
        })

        if whatsapp_enabled:
            tool_specs.extend(WA_TOOL_SPECS)

        return tool_specs, sub_agent_name_to_id

    # -------------------------------------------------------------------------
    # Tool dispatch
    # -------------------------------------------------------------------------

    def _execute_sub_agent(
        self,
        tool_name: str,
        sub_agent_id: str,
        message: str,
        user: str | None,
    ) -> ToolResult:
        print(f"[SUB-AGENT EXECUTED] {tool_name} → agent_id={sub_agent_id} | message: {message}")
        try:
            sub_response = AgentExecutor(sub_agent_id).run(
                user=user,
                messages=[{"role": "user", "text": message}],
            )
            print(f"[SUB-AGENT SUCCESS] {tool_name} completed")
            return ToolResult(tool_name=tool_name, success=True, result=sub_response.response, error=None)
        except Exception as e:
            print(f"[SUB-AGENT ERROR] {tool_name} failed: {e}")
            return ToolResult(tool_name=tool_name, success=False, result=None, error=str(e))

    def _dispatch_tool(
        self,
        tool_name: str,
        tool_input: dict,
        tool_use_id: str,
        sub_agent_name_to_id: dict[str, str],
        enabled_tool_ids: list[str],
        last_user_text: str,
        used_contexts: list,
        rag_eval_records: list,
        user: str | None,
        iteration: int,
        rag_config: RAGConfig | None = None,
        conversation_id: str | None = None,
        channel_context: dict | None = None,
    ) -> tuple[dict, ToolCallTrace]:
        print(f"[BEDROCK] Iteration {iteration}: Executing tool: {tool_name} with input: {tool_input}")

        # ── WhatsApp rich-message tools: enqueue as side-effect ───────────────
        if tool_name in WA_TOOL_NAMES and channel_context is not None:
            channel_context["message_queue"].append({
                "type": tool_name.replace("send_whatsapp_", ""),
                "payload": tool_input,
            })
            # For interactive messages (buttons/list) the body is self-contained:
            # instruct the model NOT to emit additional user-facing text.
            # For media/text tools, a neutral ack is enough.
            interactive_tools = {"send_whatsapp_buttons", "send_whatsapp_list"}
            if tool_name in interactive_tools:
                ack = (
                    "Encolado. El campo 'body' ya contiene todo el texto para el usuario. "
                    "NO generes texto adicional para el usuario en esta respuesta."
                )
            else:
                ack = "Encolado."
            result = ToolResult(
                tool_name=tool_name,
                success=True,
                result=ack,
                error=None,
            )
            trace = ToolCallTrace(
                tool_name=tool_name,
                tool_use_id=tool_use_id,
                input=tool_input,
                output=ack,
                success=True,
                error=None,
                iteration=iteration,
            )
            return {
                "toolResult": {
                    "toolUseId": tool_use_id,
                    "content": [{"text": ack}],
                }
            }, trace
        # ─────────────────────────────────────────────────────────────────────

        if tool_name == "search_knowledge_base":
            query = tool_input.get("query", last_user_text)
            print(f"[RAG TOOL] Searching KB for: {query}")
            rag_context, rag_contexts, rag_trace_data = rag_service.build_context(self.agent_id, query, config=rag_config)
            used_contexts.extend(rag_contexts)

            # Persist RAG trace asynchronously (non-blocking)
            try:
                from app.repositories.rag_trace_repository import rag_trace_repository
                rag_trace_id = rag_trace_repository.save(RAGTraceCreate(
                    agent_id=self.agent_id,
                    conversation_id=conversation_id,
                    **rag_trace_data,
                ))
                # Store record for background evaluation after final answer
                rag_eval_records.append({
                    "trace_id": rag_trace_id,
                    "query": query,
                    "contexts": rag_contexts,
                })
            except Exception as _rag_err:
                print(f"[RAG TRACE] Failed to save trace: {_rag_err}")

            result = ToolResult(
                tool_name=tool_name,
                success=True,
                result=rag_context or "No se encontraron documentos relevantes en la base de conocimientos.",
                error=None,
            )
        elif tool_name in sub_agent_name_to_id:
            result = self._execute_sub_agent(
                tool_name=tool_name,
                sub_agent_id=sub_agent_name_to_id[tool_name],
                message=tool_input.get("message", ""),
                user=user,
            )
        else:
            result = tools_integration.execute_tool(tool_name, tool_input, enabled_tool_ids)

        # Serialize output for trace (convert dicts to JSON string)
        if result.result is None:
            output_str = None
        elif isinstance(result.result, str):
            output_str = result.result
        else:
            output_str = json.dumps(result.result, ensure_ascii=False)

        trace = ToolCallTrace(
            tool_name=tool_name,
            tool_use_id=tool_use_id,
            input=tool_input,
            output=output_str,
            success=result.success,
            error=result.error,
            iteration=iteration,
        )

        is_text_response = tool_name in sub_agent_name_to_id or tool_name == "search_knowledge_base"
        if result.success:
            content = [{"text": result.result}] if is_text_response else [{"json": result.result}]
            return {"toolResult": {"toolUseId": tool_use_id, "content": content}}, trace
        return {
            "toolResult": {
                "toolUseId": tool_use_id,
                "content": [{"text": f"Error: {result.error}"}],
                "status": "error",
            }
        }, trace

    # -------------------------------------------------------------------------
    # Tool use loop
    # -------------------------------------------------------------------------

    def _run_tool_loop(
        self,
        converse_params: dict,
        sub_agent_name_to_id: dict[str, str],
        enabled_tool_ids: list[str],
        last_user_text: str,
        used_contexts: list,
        rag_eval_records: list,
        user: str | None,
        rag_config: RAGConfig | None = None,
        conversation_id: str | None = None,
        channel_context: dict | None = None,
    ) -> tuple[dict, list, list[ToolCallTrace], int]:
        max_iterations = 5
        iteration = 0
        response = None
        last_non_tool_response = None
        tool_results: list = []
        all_tool_call_traces: list[ToolCallTrace] = []

        while iteration < max_iterations:
            iteration += 1
            response = self.bedrock.converse(**converse_params)
            stop_reason = response.get("stopReason")
            print(f"[BEDROCK] Iteration {iteration}: stopReason={stop_reason}")

            if stop_reason != "tool_use":
                last_non_tool_response = response
                break

            output_message = response["output"]["message"]
            tool_use_blocks = [b for b in output_message["content"] if "toolUse" in b]
            results_and_traces = [
                self._dispatch_tool(
                    tool_name=b["toolUse"]["name"],
                    tool_input=b["toolUse"]["input"],
                    tool_use_id=b["toolUse"]["toolUseId"],
                    sub_agent_name_to_id=sub_agent_name_to_id,
                    enabled_tool_ids=enabled_tool_ids,
                    last_user_text=last_user_text,
                    used_contexts=used_contexts,
                    rag_eval_records=rag_eval_records,
                    user=user,
                    iteration=iteration,
                    rag_config=rag_config,
                    conversation_id=conversation_id,
                    channel_context=channel_context,
                )
                for b in tool_use_blocks
            ]
            tool_results = [r for r, _ in results_and_traces]
            all_tool_call_traces.extend([t for _, t in results_and_traces])
            converse_params["messages"].append(output_message)
            converse_params["messages"].append({"role": "user", "content": tool_results})

        final_response = last_non_tool_response or response
        if final_response is None:
            raise RuntimeError("Failed to get a response from the model after maximum iterations")
        return final_response, tool_results, all_tool_call_traces, iteration

    # -------------------------------------------------------------------------
    # Response extraction
    # -------------------------------------------------------------------------

    def _extract_final_answer(self, response: dict, tool_results: list) -> str:
        content_blocks = response["output"]["message"].get("content", [])
        print(f"[BEDROCK] Final content blocks: {json.dumps([list(b.keys()) for b in content_blocks])}")

        for block in content_blocks:
            if "text" in block:
                return block["text"]
            if "guardContent" in block:
                guard = block["guardContent"]
                if "text" in guard:
                    text_obj = guard["text"]
                    return text_obj if isinstance(text_obj, str) else text_obj.get("text", "")

        stop_reason = response.get("stopReason", "unknown")
        print(f"[BEDROCK] WARNING: No text block found. stopReason={stop_reason}, content={content_blocks}")
        for tr in reversed(tool_results):
            for c in tr.get("toolResult", {}).get("content", []):
                if "text" in c and c["text"]:
                    print("[BEDROCK] Falling back to last tool result text")
                    return c["text"]

        raise RuntimeError(
            f"No text block found in the model's final response (stopReason={stop_reason}). "
            f"Block types: {[list(b.keys()) for b in content_blocks]}"
        )

    # -------------------------------------------------------------------------
    # Main entry point
    # -------------------------------------------------------------------------

    def run(
        self,
        user: str | None,
        messages: list,
        attached_text: str | None = None,
        context: dict | None = None,
        account_id: str = "default",
        conversation_id: str | None = None,
        channel_context: dict | None = None,
    ) -> AgentResponse:
        start_time = time.monotonic()
        agent_config = self._load_agent_config()
        agent_name = agent_config.name or "Unknown Agent"
        model = agent_config.model or ""
        system_prompt = agent_config.custom_prompt or ""
        temperature = agent_config.temperature or 0.7
        max_tokens = agent_config.max_tokens or 1000
        top_k = agent_config.top_k or None
        tools = agent_config.tools or []
        rag_config = agent_config.rag_config  # may be None → rag_service uses defaults
        enabled_tool_ids = [t.id for t in tools if t.enabled]
        enabled_sub_agent_ids = [t.id for t in (agent_config.sub_agents or []) if t.enabled]
        whatsapp_enabled = agent_config.whatsapp_enabled and channel_context is not None
        if channel_context is not None and "message_queue" not in channel_context:
            channel_context["message_queue"] = []

        last_user_text = next(
            (m["text"] for m in reversed(messages) if m["role"] == "user"),
            messages[-1]["text"] if messages else "",
        )
        used_contexts: list = []
        rag_eval_records: list = []

        model_id = self._resolve_model_id(model)
        full_system_prompt = self._build_system_prompt(system_prompt, context)
        converse_messages = self._build_converse_messages(messages, attached_text)
        tool_specs, sub_agent_name_to_id = self._build_tool_specs(
            enabled_tool_ids, enabled_sub_agent_ids, whatsapp_enabled=whatsapp_enabled
        )

        converse_params: dict = {
            "modelId": model_id,
            "messages": converse_messages,
            "inferenceConfig": {"maxTokens": max_tokens, "temperature": temperature},
        }
        if full_system_prompt:
            converse_params["system"] = [{"text": full_system_prompt}]
        if top_k is not None:
            converse_params["additionalModelRequestFields"] = {"top_k": top_k}
        if tool_specs:
            converse_params["toolConfig"] = {"tools": tool_specs}

        final_response, tool_results, tool_call_traces, total_iterations = self._run_tool_loop(
            converse_params=converse_params,
            sub_agent_name_to_id=sub_agent_name_to_id,
            enabled_tool_ids=enabled_tool_ids,
            last_user_text=last_user_text,
            used_contexts=used_contexts,
            rag_eval_records=rag_eval_records,
            user=user,
            rag_config=rag_config,
            conversation_id=conversation_id,
            channel_context=channel_context,
        )
        final_answer = self._extract_final_answer(final_response, tool_results)
        duration_ms = int((time.monotonic() - start_time) * 1000)

        # ── Fase 4: background RAG evaluation ──────────────────────────────────
        if rag_config and rag_config.eval_enabled and rag_eval_records:
            import threading
            from app.integrations.answer_evaluator_rag import rag_evaluator
            from app.repositories.rag_trace_repository import rag_trace_repository as _rtr

            def _run_eval(records: list, answer: str, question: str, model_id: str) -> None:
                for rec in records:
                    try:
                        scores = rag_evaluator.evaluate(
                            query=rec["query"],
                            contexts=rec["contexts"],
                            answer=answer,
                            model_id=model_id,
                        )
                        _rtr.update_eval_scores(
                            trace_id=rec["trace_id"],
                            faithfulness=scores.get("faithfulness"),
                            answer_relevance=scores.get("answer_relevance"),
                            context_precision=scores.get("context_precision"),
                        )
                    except Exception as _e:
                        print(f"[RAG EVAL] Background eval failed for trace {rec['trace_id']}: {_e}")

            threading.Thread(
                target=_run_eval,
                args=(rag_eval_records, final_answer, messages[-1]["text"], rag_config.eval_model),
                daemon=True,
            ).start()
            print(f"[RAG EVAL] Fired background eval for {len(rag_eval_records)} trace(s)")

        was_answered = answer_analyzer.is_answered(question=messages[-1]["text"], answer=final_answer)
        print(f"[ANALYSIS] Question answered: {was_answered}")
        if not was_answered:
            answer_analyzer.save_unanswered(
                agent_id=self.agent_id,
                agent_name=agent_name,
                question=messages[-1]["text"],
                answer=final_answer,
                user=user,
                context=None,
            )

        # Persist execution trace (lazy import avoids circular dependency risk)
        try:
            from app.services.execution_trace_service import execution_trace_service
            execution_trace_service.save(ExecutionTraceCreate(
                agent_id=self.agent_id,
                agent_name=agent_name,
                user=user or "unknown",
                account_id=account_id,
                user_message=messages[-1]["text"],
                final_response=final_answer,
                tool_calls=tool_call_traces,
                total_iterations=total_iterations,
                duration_ms=duration_ms,
                was_answered=was_answered,
            ))
        except Exception as e:
            print(f"[TRACE ERROR] Failed to save execution trace: {e}")

        wa_messages_queued = len(channel_context["message_queue"]) if channel_context else 0

        return AgentResponse(
            agent_name=agent_name,
            response=final_answer,
            configuration=AgentConfig(
                model=model,
                custom_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                top_k=top_k,
                tools=tools,
            ),
            contexts=used_contexts,
            wa_messages_queued=wa_messages_queued,
        )