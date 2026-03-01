"""
Eval Set Service — creates eval sets and executes evaluation runs.
"""
from __future__ import annotations
import json
import re
import threading
import time
import uuid
from datetime import datetime, timezone

import boto3

from app.config import env
from app.integrations.answer_evaluator_rag import rag_evaluator
from app.models.eval_set import (
    EvalSet,
    EvalSetCreate,
    EvalRun,
    EvalRunResult,
    EvalRunSummary,
)
from app.repositories.eval_set_repository import eval_set_repository
from app.repositories.agent_repository import agent_repository


_CORRECTNESS_PROMPT = """\
You are an answer correctness evaluator for a RAG system.

QUESTION:
{question}

EXPECTED ANSWER:
{expected}

ACTUAL ANSWER:
{actual}

Rate how semantically similar and correct the actual answer is compared to the expected answer.
Score from 0.0 (completely wrong / unrelated) to 1.0 (semantically equivalent, all key facts present).

Respond ONLY with a valid JSON object: {{"answer_correctness": 0.85}}
Example: if the actual answer captures 85% of the expected facts correctly, respond {{"answer_correctness": 0.85}}"""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _avg(values: list[float | None]) -> float | None:
    valid = [v for v in values if v is not None]
    return round(sum(valid) / len(valid), 3) if valid else None


class EvalSetService:
    def __init__(self) -> None:
        self._bedrock = boto3.client(
            "bedrock-runtime",
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key,
        )

    # ------------------------------------------------------------------
    # EvalSet CRUD
    # ------------------------------------------------------------------

    def create(self, data: EvalSetCreate) -> EvalSet:
        now = _now_iso()
        doc = {
            "id": str(uuid.uuid4()),
            "agent_id": data.agent_id,
            "name": data.name,
            "description": data.description,
            "items": [item.model_dump() for item in data.items],
            "created_at": now,
            "updated_at": now,
        }
        saved = eval_set_repository.save_eval_set(doc)
        return EvalSet(**saved)

    def get(self, eval_set_id: str) -> EvalSet | None:
        doc = eval_set_repository.get_eval_set(eval_set_id)
        return EvalSet(**doc) if doc else None

    def list_by_agent(self, agent_id: str) -> list[EvalSet]:
        docs = eval_set_repository.list_by_agent(agent_id)
        return [EvalSet(**d) for d in docs]

    def update(self, eval_set_id: str, data: EvalSetCreate) -> EvalSet | None:
        existing = eval_set_repository.get_eval_set(eval_set_id)
        if not existing:
            return None
        now = _now_iso()
        existing.update({
            "name": data.name,
            "description": data.description,
            "items": [item.model_dump() for item in data.items],
            "agent_id": data.agent_id,
            "updated_at": now,
        })
        saved = eval_set_repository.save_eval_set(existing)
        return EvalSet(**saved)

    def delete(self, eval_set_id: str) -> bool:
        existing = eval_set_repository.get_eval_set(eval_set_id)
        if not existing:
            return False
        eval_set_repository.delete_runs_by_set(eval_set_id)
        eval_set_repository.delete_eval_set(eval_set_id)
        return True

    # ------------------------------------------------------------------
    # EvalRun
    # ------------------------------------------------------------------

    def trigger_run(self, eval_set_id: str) -> EvalRun:
        """Create a pending EvalRun and start execution in a background thread."""
        eval_set_doc = eval_set_repository.get_eval_set(eval_set_id)
        if not eval_set_doc:
            raise ValueError(f"EvalSet {eval_set_id} not found")

        agent_doc = agent_repository.get_by_id(eval_set_doc["agent_id"])
        if not agent_doc:
            raise ValueError(f"Agent {eval_set_doc['agent_id']} not found")

        rag_config_snapshot = None
        if agent_doc.rag_config:
            rag_config_snapshot = agent_doc.rag_config.model_dump()

        now = _now_iso()
        run_doc = {
            "id": str(uuid.uuid4()),
            "eval_set_id": eval_set_id,
            "agent_id": eval_set_doc["agent_id"],
            "eval_set_name": eval_set_doc.get("name"),
            "status": "pending",
            "rag_config_snapshot": rag_config_snapshot,
            "results": [],
            "created_at": now,
            "completed_at": None,
            "error": None,
        }
        saved = eval_set_repository.save_eval_run(run_doc)
        run = EvalRun(**saved)

        threading.Thread(
            target=self._execute_run,
            args=(run.id, eval_set_doc),
            daemon=True,
        ).start()

        return run

    def get_run(self, run_id: str) -> EvalRun | None:
        doc = eval_set_repository.get_eval_run(run_id)
        return EvalRun(**doc) if doc else None

    def list_runs(self, eval_set_id: str) -> list[EvalRunSummary]:
        docs = eval_set_repository.list_runs_by_set(eval_set_id)
        return [self._to_summary(d) for d in docs]

    # ------------------------------------------------------------------
    # Internal execution
    # ------------------------------------------------------------------

    def _execute_run(self, run_id: str, eval_set_doc: dict) -> None:
        eval_set_repository.update_run_status(run_id, "running")
        results: list[dict] = []

        try:
            from app.integrations.agent_executor import AgentExecutor

            agent_id: str = eval_set_doc["agent_id"]
            items: list[dict] = eval_set_doc.get("items", [])

            for item in items:
                result = self._run_single_item(agent_id, item)
                results.append(result)
                # Persist partial results so the run is queryable mid-flight
                eval_set_repository.update_run_results(run_id, results)

            eval_set_repository.update_run_status(
                run_id, "completed", completed_at=_now_iso()
            )
            eval_set_repository.update_run_results(run_id, results)

        except Exception as exc:
            print(f"[EVAL RUN] run {run_id} failed: {exc}")
            eval_set_repository.update_run_status(
                run_id, "failed", completed_at=_now_iso(), error=str(exc)[:500]
            )

    def _run_single_item(self, agent_id: str, item: dict) -> dict:
        from app.integrations.agent_executor import AgentExecutor

        question: str = item.get("question", "")
        expected_answer: str | None = item.get("expected_answer")

        result: dict = {
            "item_id": item.get("id", str(uuid.uuid4())),
            "question": question,
            "expected_answer": expected_answer,
            "answer": None,
            "rewritten_query": None,
            "chunks_used": None,
            "faithfulness": None,
            "answer_relevance": None,
            "context_precision": None,
            "answer_correctness": None,
            "latency_ms": None,
            "error": None,
        }

        try:
            t0 = time.monotonic()
            executor = AgentExecutor(agent_id)
            agent_response = executor.run(
                user="eval-system",
                messages=[{"role": "user", "text": question}],
            )
            latency_ms = int((time.monotonic() - t0) * 1000)

            answer = agent_response.response
            contexts = agent_response.contexts or []

            result["answer"] = answer
            result["chunks_used"] = len(contexts)
            result["latency_ms"] = latency_ms

            # Evaluate with RAG evaluator
            scores = rag_evaluator.evaluate(
                query=question,
                contexts=contexts,
                answer=answer,
            )
            result["faithfulness"] = scores.get("faithfulness")
            result["answer_relevance"] = scores.get("answer_relevance")
            result["context_precision"] = scores.get("context_precision")

            # Optional answer correctness when expected answer provided
            if expected_answer:
                result["answer_correctness"] = self._eval_correctness(
                    question=question,
                    expected=expected_answer,
                    actual=answer,
                )

        except Exception as exc:
            print(f"[EVAL RUN] item {item.get('id')} failed: {exc}")
            result["error"] = str(exc)[:300]

        return result

    def _eval_correctness(
        self,
        question: str,
        expected: str,
        actual: str,
        model_id: str = "amazon.nova-micro-v1:0",
    ) -> float | None:
        try:
            prompt = _CORRECTNESS_PROMPT.format(
                question=question[:500],
                expected=expected[:800],
                actual=actual[:800],
            )
            response = self._bedrock.converse(
                modelId=model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"maxTokens": 64, "temperature": 0.0},
            )
            raw = response["output"]["message"]["content"][0]["text"].strip()
            json_match = re.search(r'\{[^{}]+\}', raw, re.DOTALL)
            if not json_match:
                return None
            scores = json.loads(json_match.group())
            return round(float(scores["answer_correctness"]), 2)
        except Exception as e:
            print(f"[EVAL CORRECTNESS] failed: {e}")
            return None

    @staticmethod
    def _to_summary(doc: dict) -> EvalRunSummary:
        results: list[dict] = doc.get("results", [])
        completed = [r for r in results if r.get("answer") is not None]
        return EvalRunSummary(
            id=doc["id"],
            eval_set_id=doc["eval_set_id"],
            eval_set_name=doc.get("eval_set_name"),
            agent_id=doc["agent_id"],
            status=doc.get("status", "pending"),
            total_items=len(results),
            completed_items=len(completed),
            avg_faithfulness=_avg([r.get("faithfulness") for r in completed]),
            avg_answer_relevance=_avg([r.get("answer_relevance") for r in completed]),
            avg_context_precision=_avg([r.get("context_precision") for r in completed]),
            avg_answer_correctness=_avg([r.get("answer_correctness") for r in completed]),
            created_at=doc["created_at"],
            completed_at=doc.get("completed_at"),
        )


eval_set_service = EvalSetService()
