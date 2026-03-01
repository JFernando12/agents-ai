"""
Fase 4 — RAG Answer Evaluator
Evaluates the quality of a RAG-grounded answer using a small LLM.
Runs asynchronously in a background thread so it never blocks the user response.
"""
import json
import re
import boto3

from app.config import env


_EVAL_PROMPT = """\
You are an expert RAG evaluation system. Given a question, retrieved context chunks, \
and the agent's answer, rate the quality on three dimensions.

QUESTION:
{question}

RETRIEVED CONTEXT CHUNKS:
{context}

AGENT ANSWER:
{answer}

Rate each metric from 0.0 to 1.0 (two decimal places):

1. FAITHFULNESS — Is every factual claim in the answer directly supported by the context?
   1.0 = fully grounded, no hallucinations
   0.5 = mostly grounded, minor unsupported details
   0.0 = contradicts or ignores the context

2. ANSWER_RELEVANCE — Does the answer actually address the question asked?
   1.0 = fully and directly answers the question
   0.5 = partially answers or slightly off-topic
   0.0 = off-topic, evasive, or refuses to answer

3. CONTEXT_PRECISION — Were the retrieved chunks useful for answering?
   1.0 = all chunks were directly relevant
   0.5 = some chunks were useful
   0.0 = no chunks were useful despite being retrieved

Your response must be ONLY a valid JSON object with exactly these three keys and float values between 0.0 and 1.0.
Example format (replace with your actual scores):
{{"faithfulness": 0.85, "answer_relevance": 0.72, "context_precision": 0.90}}"""


class RAGEvaluator:
    """Evaluates RAG answer quality using a small Bedrock model (runs in background)."""

    def __init__(self) -> None:
        self._client = boto3.client(
            "bedrock-runtime",
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key,
        )

    def evaluate(
        self,
        query: str,
        contexts: list[dict],
        answer: str,
        model_id: str = "amazon.nova-micro-v1:0",
    ) -> dict[str, float | None]:
        """
        Returns a dict with faithfulness, answer_relevance, context_precision (each 0–1).
        Falls back to None values on any error so it never crashes the caller.
        """
        try:
            context_text = "\n\n".join(
                f"[Chunk {i + 1}] {c.get('content', '')[:800]}"
                for i, c in enumerate(contexts[:8])  # cap at 8 chunks to stay within token limits
            )
            prompt = _EVAL_PROMPT.format(
                question=query[:500],
                context=context_text,
                answer=answer[:1500],
            )

            response = self._client.converse(
                modelId=model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"maxTokens": 128, "temperature": 0.0},
            )
            raw = response["output"]["message"]["content"][0]["text"].strip()

            # Extract JSON even if model wraps it in markdown fences
            json_match = re.search(r'\{[^{}]+\}', raw, re.DOTALL)
            if not json_match:
                raise ValueError(f"No JSON found in eval response: {raw}")

            scores = json.loads(json_match.group())
            result = {
                "faithfulness": round(float(scores["faithfulness"]), 2) if scores.get("faithfulness") is not None else None,
                "answer_relevance": round(float(scores["answer_relevance"]), 2) if scores.get("answer_relevance") is not None else None,
                "context_precision": round(float(scores["context_precision"]), 2) if scores.get("context_precision") is not None else None,
            }
            print(f"[RAG EVAL] scores={result}")
            return result

        except Exception as e:
            print(f"[RAG EVAL] Evaluation failed (non-blocking): {e}")
            return {
                "faithfulness": None,
                "answer_relevance": None,
                "context_precision": None,
            }


rag_evaluator = RAGEvaluator()
