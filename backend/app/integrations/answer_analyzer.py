import json

import boto3

from app.config import env
from app.models import UnansweredCreate
from app.services.unanswered_service import unanswered_service

_ANALYSIS_MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"

_ANALYSIS_PROMPT_TEMPLATE = """Analiza si la respuesta contiene información ESPECÍFICA y CONCRETA que responde la pregunta del usuario, o si es una respuesta genérica sin información real.

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


class AnswerAnalyzer:
    """Analyzes whether an agent answer actually resolved the user's question,
    and persists unanswered questions for later review."""

    def __init__(self) -> None:
        self.bedrock = boto3.client(
            "bedrock-runtime",
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key,
        )

    def is_answered(self, question: str, answer: str) -> bool:
        prompt = _ANALYSIS_PROMPT_TEMPLATE.format(question=question, answer=answer)
        try:
            response = self.bedrock.converse(
                modelId=_ANALYSIS_MODEL_ID,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"maxTokens": 200, "temperature": 0.1},
            )
            analysis_text = response["output"]["message"]["content"][0]["text"]

            start = analysis_text.find("{")
            end = analysis_text.rfind("}") + 1
            if start != -1 and end > start:
                analysis = json.loads(analysis_text[start:end])
                return analysis.get("answered", True)

            # Fallback heuristic if JSON parsing fails
            negative_indicators = ["no puedo", "no tengo", "no dispongo", "no sé", "no conozco"]
            return not any(ind in answer.lower() for ind in negative_indicators)

        except Exception as e:
            print(f"[ANALYSIS ERROR] Failed to analyze answer: {e}")
            return True  # Default to answered on error

    def save_unanswered(
        self,
        agent_id: str,
        agent_name: str,
        question: str,
        answer: str,
        user: str | None = None,
        context: str | None = None,
    ) -> None:
        try:
            unanswered_data = UnansweredCreate(
                question=question,
                agent_id=agent_id,
                agent_name=agent_name,
                user=user or "unknown",
                context=context,
                attempted_response=answer,
                category=None,
                tags=None,
            )
            question_id = unanswered_service.create_question(unanswered_data)
            print(f"[UNANSWERED] Saved unanswered question with ID: {question_id}")
        except Exception as e:
            print(f"[UNANSWERED ERROR] Failed to save unanswered question: {e}")


answer_analyzer = AnswerAnalyzer()
