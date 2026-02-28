import boto3
import json
from pydantic import BaseModel

from app.enums import ModelType
from app.config import env
from app.integrations.tools_integration import tools_integration
from app.repositories import agent_repository, tool_repository
from app.services.unanswered_service import unanswered_service
from app.models import UnansweredCreate, AgentTool, ToolResult

s3vectors_client = boto3.client(
    "s3vectors",
    region_name=env.region,
    aws_access_key_id=env.aws_access_key_id,
    aws_secret_access_key=env.aws_secret_access_key
)

bedrock_embed_client = boto3.client(
    "bedrock-runtime",
    region_name="us-east-1",
    aws_access_key_id=env.aws_access_key_id,
    aws_secret_access_key=env.aws_secret_access_key
)

class AgentConfig(BaseModel):
    model: str
    custom_prompt: str | None
    temperature: float
    max_tokens: int
    top_k: int | None
    tools: list[AgentTool] | None

class AgentResponse(BaseModel):
    agent_name: str
    response: str
    configuration: AgentConfig
    contexts: list = []

class AgentExecutor:
    def __init__(
            self,
            agent_id: str
        ):

        self.agent_id = agent_id

        self.bedrock = boto3.client(
            'bedrock-runtime',
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key
        )

    def _build_context_for_agent(self, agent_id: str, message: str) -> tuple[str | None, list]:
        """Query S3 Vectors for documents belonging to agent_id, relevant to message.
        Returns (context_string, used_contexts_list)."""
        try:
            embed_response = bedrock_embed_client.invoke_model(
                modelId="amazon.titan-embed-text-v2:0",
                body=json.dumps({"inputText": message})
            )
            embedding = json.loads(embed_response["body"].read())["embedding"]

            vec_response = s3vectors_client.query_vectors(
                vectorBucketName="ai-agents",
                indexName="ai-agents-index",
                queryVector={"float32": embedding},
                topK=5,
                filter={"agent_id": agent_id},
                returnDistance=True,
                returnMetadata=True
            )
            vectors = vec_response.get("vectors", [])
            print(f"[CONTEXT] Agent {agent_id}: found {len(vectors)} relevant documents")

            context_parts = []
            used_contexts = []
            for i, doc in enumerate(vectors):
                metadata = doc.get('metadata', {})
                source_text = metadata.get('source_text', '')
                document_name = metadata.get('source', f'Document_{i+1}')
                context_parts.append(f'[Documento origen "{document_name}": \n {source_text}]')
                used_contexts.append({
                    'content': source_text,
                    'metadata': metadata,
                    'rank': i + 1
                })

            if context_parts:
                return "### Contexto base de conocimientos \n\n" + "\n\n".join(context_parts), used_contexts
            return None, []
        except Exception as e:
            print(f"[CONTEXT] Failed to build context for agent {agent_id}: {e}")
            return None, []

    def execute_sub_agent(
        self,
        tool_name: str,
        sub_agent_id: str,
        message: str,
        user: str | None,
    ) -> ToolResult:
        """Invoke a sub-agent and return a ToolResult mirroring execute_tool's interface."""
        print(f"[SUB-AGENT EXECUTED] {tool_name} → agent_id={sub_agent_id} | message: {message}")
        try:
            sub_executor = AgentExecutor(sub_agent_id)
            sub_response = sub_executor.run(
                user=user,
                messages=[{'role': 'user', 'text': message}],
            )
            print(f"[SUB-AGENT SUCCESS] {tool_name} completed")
            return ToolResult(
                tool_name=tool_name,
                success=True,
                result=sub_response.response,
                error=None,
            )
        except Exception as e:
            print(f"[SUB-AGENT ERROR] {tool_name} failed: {e}")
            return ToolResult(
                tool_name=tool_name,
                success=False,
                result=None,
                error=str(e),
            )

    def run(self, user: str | None, messages: list, attached_text: str | None = None, context: dict | None = None) -> AgentResponse:
        # Fetch agent configuration from DynamoDB
        agent_config = agent_repository.get_by_id(self.agent_id)
        if not agent_config:
            raise ValueError(f"Agent configuration not found for agent_id: {self.agent_id}")
        agent_name = agent_config.name or "Unknown Agent"
        model = agent_config.model or ""
        system_prompt = agent_config.custom_prompt or ""
        temperature = agent_config.temperature or 0.7
        max_tokens = agent_config.max_tokens or 1000
        top_k = agent_config.top_k or None
        tools = agent_config.tools or []
        enabled_tool_ids = [t.id for t in tools if t.enabled]
        sub_agents_config = agent_config.sub_agents or []
        enabled_sub_agent_ids = [t.id for t in sub_agents_config if t.enabled]

        # Compute last user message (used as fallback query for search_knowledge_base tool)
        last_user_text = next((m['text'] for m in reversed(messages) if m['role'] == 'user'), messages[-1]['text'] if messages else '')

        used_contexts = []
        
        model_type = ModelType(model) if isinstance(model, str) else model
        if isinstance(model_type, ModelType):
            model_id = ModelType.get_model_id(model_type)
        else:
            raise ValueError("Invalid model type provided in service configuration.")
        
        # Inject context dict into the system prompt
        system_parts = []
        if system_prompt:
            system_parts.append(system_prompt)
        if context:
            context_lines = "\n".join(f"- {k}: {v}" for k, v in context.items())
            system_parts.append(f"### Contexto adicional\n\n{context_lines}")
        full_system_prompt = "\n\n".join(system_parts)

        # Build conversation messages for Converse API
        converse_messages = []
        if attached_text:
            converse_messages.append({
                'role': 'user',
                'content': [{'text': f"### Contenido de archivo adjunto\n\n{attached_text[:12000]}"}]
            })
            converse_messages.append({
                'role': 'assistant',
                'content': [{'text': 'Entendido, he recibido el contenido del archivo adjunto.'}]
            })
        for msg in messages:
            converse_messages.append({
                'role': msg['role'],
                'content': [{'text': msg['text']}]
            })
        
        # Prepare inference configuration
        inference_config = {
            'maxTokens': max_tokens,
            'temperature': temperature
        }
        
        # Additional model-specific parameters
        additional_params = {}
        if top_k is not None:
            additional_params['top_k'] = top_k
        
        # Call Converse API with tool use loop
        converse_params = {
            'modelId': model_id,
            'messages': converse_messages,
            'inferenceConfig': inference_config,
            # 'guardrailConfig': {
            #     'guardrailIdentifier': 'uho38hh1x2kx',
            #     'guardrailVersion': '5'
            # }
        }
        
        # Add system prompt if present
        if full_system_prompt:
            converse_params['system'] = [{'text': full_system_prompt}]
        
        # Add additional parameters if any
        if additional_params:
            converse_params['additionalModelRequestFields'] = additional_params
        
        # Add tools configuration from DB (only enabled tools assigned to this agent)
        db_tools = tool_repository.get_by_ids(enabled_tool_ids)
        tool_specs = [
            {
                'toolSpec': {
                    'name': t.name,
                    'description': t.description,
                    'inputSchema': {'json': t.input_schema}
                }
            }
            for t in db_tools
        ]

        # Build tool specs for enabled sub-agents
        sub_agent_name_to_id: dict[str, str] = {}
        for sub_agent_id in enabled_sub_agent_ids:
            sub_agent_config = agent_repository.get_by_id(sub_agent_id)
            if sub_agent_config:
                tool_name = f"sub_{sub_agent_id.replace('-', '')}"
                sub_agent_name_to_id[tool_name] = sub_agent_id
                tool_specs.append({
                    'toolSpec': {
                        'name': tool_name,
                        'description': (
                            f"Sub-agente: {sub_agent_config.name}. "
                            f"{sub_agent_config.description or ''}"
                        ).strip(),
                        'inputSchema': {
                            'json': {
                                'type': 'object',
                                'properties': {
                                    'message': {
                                        'type': 'string',
                                        'description': 'Mensaje o instrucción para el sub-agente'
                                    }
                                },
                                'required': ['message']
                            }
                        }
                    }
                })

        # Always expose search_knowledge_base so the agent can query its KB on demand
        tool_specs.append({
            'toolSpec': {
                'name': 'search_knowledge_base',
                'description': (
                    'Busca en la base de conocimientos del agente documentos relevantes para responder '
                    'la consulta del usuario. Úsalo cuando necesites información específica que podría '
                    'estar en los documentos cargados como fuentes de conocimiento.'
                ),
                'inputSchema': {
                    'json': {
                        'type': 'object',
                        'properties': {
                            'query': {
                                'type': 'string',
                                'description': 'Consulta o pregunta para buscar en la base de conocimientos'
                            }
                        },
                        'required': ['query']
                    }
                }
            }
        })

        if tool_specs:
            converse_params['toolConfig'] = {
                'tools': tool_specs
            }
        
        # Tool use loop - continue until model provides final answer
        max_iterations = 5  # Prevent infinite loops
        iteration = 0
        response = None
        last_non_tool_response = None  # Track last response that wasn't a tool_use
        tool_results: list = []  # Keep last set of tool results for fallback
        
        while iteration < max_iterations:
            iteration += 1
            
            # Call Bedrock
            response = self.bedrock.converse(**converse_params)
            
            # Check stop reason
            stop_reason = response.get('stopReason')
            print(f"[BEDROCK] Iteration {iteration}: stopReason={stop_reason}")
            
            if stop_reason == 'tool_use':
                # Extract tool use requests
                output_message = response['output']['message']
                tool_use_blocks = [block for block in output_message['content'] if 'toolUse' in block]
                
                # Execute tools and prepare results
                tool_results = []
                for tool_block in tool_use_blocks:
                    tool_use = tool_block['toolUse']
                    tool_name = tool_use['name']
                    tool_input = tool_use['input']
                    tool_use_id = tool_use['toolUseId']
                    
                    print(f"[BEDROCK] Iteration {iteration}: Executing tool: {tool_name} with input: {tool_input}")
                    
                    # Dispatch: RAG search, sub-agent, or regular HTTP tool
                    if tool_name == 'search_knowledge_base':
                        query = tool_input.get('query', last_user_text)
                        print(f"[RAG TOOL] Searching KB for: {query}")
                        rag_context, rag_contexts = self._build_context_for_agent(self.agent_id, query)
                        used_contexts.extend(rag_contexts)
                        result = ToolResult(
                            tool_name=tool_name,
                            success=True,
                            result=rag_context or "No se encontraron documentos relevantes en la base de conocimientos.",
                            error=None,
                        )
                    elif tool_name in sub_agent_name_to_id:
                        result = self.execute_sub_agent(
                            tool_name=tool_name,
                            sub_agent_id=sub_agent_name_to_id[tool_name],
                            message=tool_input.get('message', ''),
                            user=user,
                        )
                    else:
                        result = tools_integration.execute_tool(tool_name, tool_input, enabled_tool_ids)
                    
                    # Build Bedrock tool result (sub-agents return plain text; regular tools return JSON)
                    if result.success:
                        content = (
                            [{'text': result.result}]
                            if tool_name in sub_agent_name_to_id or tool_name == 'search_knowledge_base'
                            else [{'json': result.result}]
                        )
                        tool_results.append({
                            'toolResult': {
                                'toolUseId': tool_use_id,
                                'content': content,
                            }
                        })
                    else:
                        tool_results.append({
                            'toolResult': {
                                'toolUseId': tool_use_id,
                                'content': [{'text': f"Error: {result.error}"}],
                                'status': 'error',
                            }
                        })
                
                # Add assistant's message and tool results to conversation
                converse_params['messages'].append(output_message)
                converse_params['messages'].append({
                    'role': 'user',
                    'content': tool_results
                })
                
                # Continue loop to get next response
                continue
            
            # Model provided a non-tool response — record it and exit
            last_non_tool_response = response
            break
        
        # Use the last non-tool response; fall back to the last response if max_iterations was hit
        final_response = last_non_tool_response or response
        
        # Check if we have a valid response
        if final_response is None:
            raise RuntimeError("Failed to get a response from the model after maximum iterations")

        # Extract text from the response content.
        # Handles: plain text blocks, guardrail-intervened guardContent blocks,
        # and max_iterations exhaustion (last response is a tool_use with no text).
        content_blocks = final_response['output']['message'].get('content', [])
        print(f"[BEDROCK] Final content blocks: {json.dumps([list(b.keys()) for b in content_blocks])}")
        
        final_answer = None
        for block in content_blocks:
            if 'text' in block:
                final_answer = block['text']
                break
            # Guardrail intervention wraps text inside guardContent
            if 'guardContent' in block:
                guard = block['guardContent']
                if 'text' in guard:
                    text_obj = guard['text']
                    final_answer = text_obj if isinstance(text_obj, str) else text_obj.get('text', '')
                    break
        
        if not final_answer:
            stop_reason = final_response.get('stopReason', 'unknown')
            print(f"[BEDROCK] WARNING: No text block found. stopReason={stop_reason}, content={content_blocks}")
            # Last-resort: return the sub-agent's answer directly from the last tool result
            if tool_results:
                for tr in reversed(tool_results):
                    tr_content = tr.get('toolResult', {}).get('content', [])
                    for c in tr_content:
                        if 'text' in c and c['text']:
                            print("[BEDROCK] Falling back to last tool result text")
                            final_answer = c['text']
                            break
                    if final_answer:
                        break
            if not final_answer:
                raise RuntimeError(
                    f"No text block found in the model's final response (stopReason={stop_reason}). "
                    f"Block types: {[list(b.keys()) for b in content_blocks]}"
                )

        was_answered = self.analyze_if_answered(
            question=messages[-1]['text'],
            answer=final_answer
        )
        print(f"[ANALYSIS] Question answered: {was_answered}")

        if not was_answered:
            self.save_unanswered_question(
                question=messages[-1]['text'],
                answer=final_answer,
                agent_name=agent_name,
                user=user,
                context=None
            )
        
        return AgentResponse(
            agent_name=agent_name,
            response=final_answer,
            configuration=AgentConfig(
                model=model,
                custom_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                top_k=top_k,
                tools=tools
            ),
            contexts=used_contexts
        )
    
    def analyze_if_answered(self, question: str, answer: str) -> bool:
        analysis_prompt = f"""Analiza si la respuesta contiene información ESPECÍFICA y CONCRETA que responde la pregunta del usuario, o si es una respuesta genérica sin información real.

Pregunta: {question}

Respuesta: {answer}

¿La respuesta proporciona información específica que responde la pregunta? Responde SOLO con un objeto JSON:
{{"answered": true/false, "reason": "breve explicación"}}

Marca como "answered": false si:
- Dice explícitamente "no puedo", "no tengo", "no conozco", "no dispongo de esa información"
- Redirige a contactar soporte, otra persona u otro sistema para obtener la respuesta
- Es una respuesta genérica/de cortesía sin información específica (ej: "estaré encantado de ayudar", "con gusto respondo", pero sin datos concretos)
- Evade la pregunta con información irrelevante o demasiado general
- Ofrece ayuda pero sin proporcionar ningún dato, procedimiento o instrucción específica

Marca como "answered": true si:
- Proporciona pasos específicos, instrucciones detalladas o procedimientos concretos
- Incluye datos específicos como nombres, números, ubicaciones, credenciales requeridas
- Da información técnica o administrativa concreta que responde la pregunta
- Explica CÓMO hacer algo con detalles específicos (aunque requiera acciones del usuario)
- Menciona información específica del sistema/plataforma que responde directamente la consulta"""
        
        try:
            # Use a simple, fast model for analysis
            response = self.bedrock.converse(
                modelId='us.anthropic.claude-haiku-4-5-20251001-v1:0',
                messages=[{
                    'role': 'user',
                    'content': [{'text': analysis_prompt}]
                }],
                inferenceConfig={
                    'maxTokens': 200,
                    'temperature': 0.1,
                }
            )
            
            analysis_text = response['output']['message']['content'][0]['text']
            
            # Extract JSON from response
            # Try to find JSON in the response
            start_idx = analysis_text.find('{')
            end_idx = analysis_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = analysis_text[start_idx:end_idx]
                analysis = json.loads(json_str)
                return analysis.get('answered', True)  # Default to true if unclear
            
            # Fallback: check for common negative indicators
            negative_indicators = ['no puedo', 'no tengo', 'no dispongo', 'no sé', 'no conozco']
            return not any(indicator in answer.lower() for indicator in negative_indicators)
            
        except Exception as e:
            print(f"[ANALYSIS ERROR] Failed to analyze answer: {e}")
            # On error, default to assuming it was answered
            return True
    
    def save_unanswered_question(
        self, 
        question: str, 
        answer: str, 
        agent_name: str, 
        user: str | None = None,
        context: str | None = None
    ) -> None:
        try:
            unanswered_data = UnansweredCreate(
                question=question,
                agent_id=self.agent_id,
                agent_name=agent_name,
                user=user or "unknown",
                context=context,
                attempted_response=answer,
                category=None,
                tags=None
            )
            
            question_id = unanswered_service.create_question(unanswered_data)
            print(f"[UNANSWERED] Saved unanswered question with ID: {question_id}")
            
        except Exception as e:
            print(f"[UNANSWERED ERROR] Failed to save unanswered question: {e}")