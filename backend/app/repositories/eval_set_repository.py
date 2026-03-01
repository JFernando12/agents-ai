"""
Repository for EvalSet and EvalRun DynamoDB tables.
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from decimal import Decimal

from app.config import env
from app.repositories.base_dynamodb_repository import BaseDynamoDBRepository


def _to_decimal(obj):
    """Recursively convert floats to Decimal for DynamoDB."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_decimal(i) for i in obj]
    return obj


def _from_decimal(obj):
    """Recursively convert Decimal back to float."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _from_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_from_decimal(i) for i in obj]
    return obj


class EvalSetRepository(BaseDynamoDBRepository):
    def __init__(self):
        super().__init__()
        self._eval_set_table = self.dynamodb.Table(env.eval_set_table)
        self._eval_run_table = self.dynamodb.Table(env.eval_run_table)

    # ------------------------------------------------------------------
    # EvalSet CRUD
    # ------------------------------------------------------------------

    def save_eval_set(self, eval_set: dict) -> dict:
        item = _to_decimal(eval_set)
        self._eval_set_table.put_item(Item=item)
        return _from_decimal(item)

    def get_eval_set(self, eval_set_id: str) -> dict | None:
        resp = self._eval_set_table.get_item(Key={"id": eval_set_id})
        item = resp.get("Item")
        return _from_decimal(item) if item else None

    def list_by_agent(self, agent_id: str) -> list[dict]:
        resp = self._eval_set_table.query(
            IndexName="agent_id-index",
            KeyConditionExpression="agent_id = :aid",
            ExpressionAttributeValues={":aid": agent_id},
        )
        items = resp.get("Items", [])
        return [_from_decimal(i) for i in items]

    def delete_eval_set(self, eval_set_id: str) -> None:
        self._eval_set_table.delete_item(Key={"id": eval_set_id})

    # ------------------------------------------------------------------
    # EvalRun CRUD
    # ------------------------------------------------------------------

    def save_eval_run(self, eval_run: dict) -> dict:
        item = _to_decimal(eval_run)
        self._eval_run_table.put_item(Item=item)
        return _from_decimal(item)

    def get_eval_run(self, run_id: str) -> dict | None:
        resp = self._eval_run_table.get_item(Key={"id": run_id})
        item = resp.get("Item")
        return _from_decimal(item) if item else None

    def list_runs_by_set(self, eval_set_id: str) -> list[dict]:
        resp = self._eval_run_table.query(
            IndexName="eval_set_id-index",
            KeyConditionExpression="eval_set_id = :esid",
            ExpressionAttributeValues={":esid": eval_set_id},
        )
        items = resp.get("Items", [])
        return sorted([_from_decimal(i) for i in items], key=lambda x: x.get("created_at", ""), reverse=True)

    def update_run_status(self, run_id: str, status: str, completed_at: str | None = None, error: str | None = None) -> None:
        update_expr = "SET #s = :s"
        expr_attr_names = {"#s": "status"}
        expr_attr_values: dict = {":s": status}
        if completed_at:
            update_expr += ", completed_at = :ca"
            expr_attr_values[":ca"] = completed_at
        if error:
            update_expr += ", #e = :e"
            expr_attr_names["#e"] = "error"
            expr_attr_values[":e"] = error
        self._eval_run_table.update_item(
            Key={"id": run_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values,
        )

    def update_run_results(self, run_id: str, results: list) -> None:
        self._eval_run_table.update_item(
            Key={"id": run_id},
            UpdateExpression="SET results = :r",
            ExpressionAttributeValues={":r": _to_decimal(results)},
        )

    def delete_runs_by_set(self, eval_set_id: str) -> None:
        runs = self.list_runs_by_set(eval_set_id)
        for run in runs:
            self._eval_run_table.delete_item(Key={"id": run["id"]})


eval_set_repository = EvalSetRepository()
