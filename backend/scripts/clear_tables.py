"""
Script to delete ALL items from every application table.
Use only in development/testing environments.

Usage:
    python scripts/clear_tables.py              # clears all tables
    python scripts/clear_tables.py ai-agent     # clears only 'ai-agent'
    python scripts/clear_tables.py ai-user ai-account  # clears specific tables

Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (same as the app)
"""

import os
import sys
import boto3
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

AWS_REGION        = os.getenv("AWS_REGION",            "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID",     "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
ENDPOINT_URL      = os.getenv("DYNAMODB_ENDPOINT_URL", None)  # set for local DynamoDB

ALL_TABLES = [
    os.getenv("CONVERSATION_TABLE",       "ai-conversation"),
    os.getenv("MESSAGE_TABLE",            "ai-message"),
    os.getenv("DOCUMENT_TABLE",           "ai-document"),
    os.getenv("AGENT_TABLE",              "ai-agent"),
    os.getenv("LOG_TABLE",                "ai-log"),
    os.getenv("UNANSWERED_TABLE",         "ai-unanswered"),
    os.getenv("UNANSWERED_COMMENT_TABLE", "ai-unanswered-comment"),
    os.getenv("TOOL_TABLE",               "ai-tool"),
    os.getenv("PRODUCT_TABLE",            "ai-product"),
    os.getenv("ACCOUNT_TABLE",            "ai-account"),
    os.getenv("USER_TABLE",               "ai-user"),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_key_names(client, table_name: str) -> list[str]:
    """Return the list of primary key attribute names for a table."""
    desc = client.describe_table(TableName=table_name)
    return [k["AttributeName"] for k in desc["Table"]["KeySchema"]]


def clear_table(dynamodb, client, table_name: str) -> int:
    """Delete every item in the table. Returns number of items deleted."""
    table     = dynamodb.Table(table_name)
    key_names = get_key_names(client, table_name)

    deleted = 0
    last_key = None

    while True:
        kwargs = {}
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key

        response = table.scan(
            ProjectionExpression=", ".join(f"#k{i}" for i in range(len(key_names))),
            ExpressionAttributeNames={
                f"#k{i}": name for i, name in enumerate(key_names)
            },
            **kwargs,
        )

        items = response.get("Items", [])

        # Batch delete in groups of 25 (DynamoDB limit)
        for i in range(0, len(items), 25):
            batch = items[i : i + 25]
            with table.batch_writer() as writer:
                for item in batch:
                    key = {name: item[name] for name in key_names}
                    writer.delete_item(Key=key)
            deleted += len(batch)

        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break

    return deleted


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    target_tables = sys.argv[1:] if len(sys.argv) > 1 else ALL_TABLES

    dynamodb = boto3.resource(
        "dynamodb",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        **({"endpoint_url": ENDPOINT_URL} if ENDPOINT_URL else {}),
    )
    client = boto3.client(
        "dynamodb",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        **({"endpoint_url": ENDPOINT_URL} if ENDPOINT_URL else {}),
    )

    print(f"\n{'='*55}")
    print(f"  CLEARING {len(target_tables)} TABLE(S)")
    print(f"{'='*55}")

    total = 0
    for table_name in target_tables:
        print(f"\n  [{table_name}]  scanning...", end=" ", flush=True)
        try:
            count = clear_table(dynamodb, client, table_name)
            print(f"deleted {count} item(s)  ✓")
            total += count
        except client.exceptions.ResourceNotFoundException:
            print("table not found, skipping.")
        except Exception as e:
            print(f"ERROR  →  {e}")

    print(f"\n{'='*55}")
    print(f"  Done.  Total items deleted: {total}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
