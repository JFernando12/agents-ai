"""
Script to create all DynamoDB tables required by the application.

Usage:
    python scripts/create_dynamo_tables.py

Environment variables are read from .env (or the shell environment).
Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (default: us-east-1)

Optional overrides for table names (defaults shown):
    CONVERSATION_TABLE=ai-conversation
    MESSAGE_TABLE=ai-message
    DOCUMENT_TABLE=ai-document
    AGENT_TABLE=ai-agent
    LOG_TABLE=ai-log
    UNANSWERED_TABLE=ai-unanswered
    UNANSWERED_COMMENT_TABLE=ai-unanswered-comment
    TOOL_TABLE=ai-tool
    PRODUCT_TABLE=ai-product
"""

import os
import sys
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

TABLE_NAMES = {
    "conversation":        os.getenv("CONVERSATION_TABLE",       "ai-conversation"),
    "message":             os.getenv("MESSAGE_TABLE",            "ai-message"),
    "document":            os.getenv("DOCUMENT_TABLE",           "ai-document"),
    "agent":               os.getenv("AGENT_TABLE",              "ai-agent"),
    "log":                 os.getenv("LOG_TABLE",                "ai-log"),
    "unanswered":          os.getenv("UNANSWERED_TABLE",         "ai-unanswered"),
    "unanswered_comment":  os.getenv("UNANSWERED_COMMENT_TABLE", "ai-unanswered-comment"),
    "tool":                os.getenv("TOOL_TABLE",               "ai-tool"),
    "product":             os.getenv("PRODUCT_TABLE",            "ai-product"),
    "account":             os.getenv("ACCOUNT_TABLE",            "ai-account"),
    "user":                os.getenv("USER_TABLE",               "ai-user"),
    "execution_trace":     os.getenv("EXECUTION_TRACE_TABLE",    "ai-execution-trace"),
    "rag_trace":           os.getenv("RAG_TRACE_TABLE",          "ai-rag-trace"),
    "eval_set":            os.getenv("EVAL_SET_TABLE",            "ai-eval-set"),
    "eval_run":            os.getenv("EVAL_RUN_TABLE",            "ai-eval-run"),
}

# Default billing / throughput for every table
BILLING_MODE = "PAY_PER_REQUEST"

# ---------------------------------------------------------------------------
# Table definitions
# ---------------------------------------------------------------------------

TABLES = [
    # ------------------------------------------------------------------
    # ai-conversation  (conversations)
    # PK: id (S)
    # GSI user-agent_id-index  →  user (S)  +  agent_id (S)
    # GSI agent_id-index       →  agent_id (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["conversation"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",       "AttributeType": "S"},
            {"AttributeName": "user",     "AttributeType": "S"},
            {"AttributeName": "agent_id", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "user-agent_id-index",
                "KeySchema": [
                    {"AttributeName": "user",     "KeyType": "HASH"},
                    {"AttributeName": "agent_id", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "agent_id-index",
                "KeySchema": [
                    {"AttributeName": "agent_id", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-message  (messages)
    # PK: id (S)
    # GSI conversation_id-index  →  conversation_id (S)  +  timestamp (N)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["message"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",              "AttributeType": "S"},
            {"AttributeName": "conversation_id", "AttributeType": "S"},
            {"AttributeName": "timestamp",       "AttributeType": "N"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "conversation_id-index",
                "KeySchema": [
                    {"AttributeName": "conversation_id", "KeyType": "HASH"},
                    {"AttributeName": "timestamp",       "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-document  (documents)
    # PK: id (S)
    # GSI s3_key-index   →  s3_key (S)
    # GSI agent_id-index →  agent_id (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["document"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",       "AttributeType": "S"},
            {"AttributeName": "s3_key",   "AttributeType": "S"},
            {"AttributeName": "agent_id", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "s3_key-index",
                "KeySchema": [
                    {"AttributeName": "s3_key", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "agent_id-index",
                "KeySchema": [
                    {"AttributeName": "agent_id", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-agent  (agents)
    # PK: id (S)
    # GSI is_public-index  →  is_public (N)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["agent"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",        "AttributeType": "S"},
            {"AttributeName": "is_public", "AttributeType": "N"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "is_public-index",
                "KeySchema": [
                    {"AttributeName": "is_public", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-log  (audit logs)
    # PK: id (S)
    # GSI log_id-created_at-index  →  log_id (S)  +  created_at (N)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["log"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",         "AttributeType": "S"},
            {"AttributeName": "log_id",     "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "N"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "log_id-created_at-index",
                "KeySchema": [
                    {"AttributeName": "log_id",     "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-unanswered  (unanswered questions)
    # PK: id (S)
    # GSI AgentIdTimestampIndex  →  agent_id (S)  +  timestamp (S)
    # GSI StatusTimestampIndex   →  status (S)    +  timestamp (S)
    # GSI UserTimestampIndex     →  user (S)       +  timestamp (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["unanswered"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",        "AttributeType": "S"},
            {"AttributeName": "agent_id",  "AttributeType": "S"},
            {"AttributeName": "status",    "AttributeType": "S"},
            {"AttributeName": "user",      "AttributeType": "S"},
            {"AttributeName": "timestamp", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "AgentIdTimestampIndex",
                "KeySchema": [
                    {"AttributeName": "agent_id",  "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "StatusTimestampIndex",
                "KeySchema": [
                    {"AttributeName": "status",    "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "UserTimestampIndex",
                "KeySchema": [
                    {"AttributeName": "user",      "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-unanswered-comment  (comments on unanswered questions)
    # PK: id (S)
    # GSI question_id-created_at-index  →  question_id (S)  +  created_at (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["unanswered_comment"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",          "AttributeType": "S"},
            {"AttributeName": "question_id", "AttributeType": "S"},
            {"AttributeName": "created_at",  "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "question_id-created_at-index",
                "KeySchema": [
                    {"AttributeName": "question_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at",  "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-tool  (tools / API integrations)
    # PK: id (S)
    # GSI all_tools-index   →  all_tools (S)
    # GSI product_id-index  →  product_id (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["tool"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",         "AttributeType": "S"},
            {"AttributeName": "all_tools",  "AttributeType": "S"},
            {"AttributeName": "product_id", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "all_tools-index",
                "KeySchema": [
                    {"AttributeName": "all_tools", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "product_id-index",
                "KeySchema": [
                    {"AttributeName": "product_id", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-product  (products)
    # PK: id (S)
    # GSI slug-index  →  slug (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["product"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",   "AttributeType": "S"},
            {"AttributeName": "slug", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "slug-index",
                "KeySchema": [
                    {"AttributeName": "slug", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-account  (organizations / tenants)
    # PK: id (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["account"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id", "AttributeType": "S"},
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-user  (users within accounts)
    # PK: id (S)
    # GSI email-index          →  email (S)
    # GSI account_id-index     →  account_id (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["user"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",         "AttributeType": "S"},
            {"AttributeName": "email",      "AttributeType": "S"},
            {"AttributeName": "account_id", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "email-index",
                "KeySchema": [
                    {"AttributeName": "email", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "account_id-index",
                "KeySchema": [
                    {"AttributeName": "account_id", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },
    # ------------------------------------------------------------------
    # ai-execution-trace  (agent execution traces)
    # PK: id (S)
    # GSI account_id-created_at-index  →  account_id (S) + created_at (N)
    # GSI agent_id-created_at-index    →  agent_id (S)   + created_at (N)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["execution_trace"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",         "AttributeType": "S"},
            {"AttributeName": "account_id", "AttributeType": "S"},
            {"AttributeName": "agent_id",   "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "N"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "account_id-created_at-index",
                "KeySchema": [
                    {"AttributeName": "account_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at",  "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "agent_id-created_at-index",
                "KeySchema": [
                    {"AttributeName": "agent_id",   "KeyType": "HASH"},
                    {"AttributeName": "created_at",  "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },
    # ------------------------------------------------------------------
    # ai-rag-trace  (RAG retrieval traces per agent)
    # PK: id (S)
    # GSI agent_id-created_at-index  →  agent_id (S) + created_at (N)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["rag_trace"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",         "AttributeType": "S"},
            {"AttributeName": "agent_id",   "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "N"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "agent_id-created_at-index",
                "KeySchema": [
                    {"AttributeName": "agent_id",   "KeyType": "HASH"},
                    {"AttributeName": "created_at",  "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-eval-set  (evaluation question sets)
    # PK: id (S)
    # GSI agent_id-index  →  agent_id (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["eval_set"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",       "AttributeType": "S"},
            {"AttributeName": "agent_id", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "agent_id-index",
                "KeySchema": [
                    {"AttributeName": "agent_id", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },

    # ------------------------------------------------------------------
    # ai-eval-run  (evaluation run executions)
    # PK: id (S)
    # GSI eval_set_id-index  →  eval_set_id (S)
    # ------------------------------------------------------------------
    {
        "TableName": TABLE_NAMES["eval_run"],
        "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"},
        ],
        "AttributeDefinitions": [
            {"AttributeName": "id",          "AttributeType": "S"},
            {"AttributeName": "eval_set_id", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "eval_set_id-index",
                "KeySchema": [
                    {"AttributeName": "eval_set_id", "KeyType": "HASH"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": BILLING_MODE,
    },
]

def get_client():
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        print("ERROR: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set.")
        sys.exit(1)

    return boto3.client(
        "dynamodb",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )


def table_exists(client, table_name: str) -> bool:
    try:
        client.describe_table(TableName=table_name)
        return True
    except client.exceptions.ResourceNotFoundException:
        return False


def create_table(client, definition: dict) -> None:
    table_name = definition["TableName"]

    if table_exists(client, table_name):
        print(f"  [SKIP]    {table_name}  (already exists)")
        return

    try:
        client.create_table(**definition)
        # Wait until the table is active
        waiter = client.get_waiter("table_exists")
        waiter.wait(TableName=table_name, WaiterConfig={"Delay": 2, "MaxAttempts": 30})
        print(f"  [CREATED] {table_name}")
    except ClientError as exc:
        print(f"  [ERROR]   {table_name}: {exc.response['Error']['Message']}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"Region : {AWS_REGION}")
    print(f"Tables : {len(TABLES)}\n")

    client = get_client()

    for table_def in TABLES:
        create_table(client, table_def)

    print("\nDone.")


if __name__ == "__main__":
    main()
