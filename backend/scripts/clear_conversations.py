"""
Deletes all conversations and messages — both from the chat engine and WhatsApp.

Tables cleared:
  - ai-conversation          (agent chat conversations)
  - ai-message               (agent chat messages)
  - ai-whatsapp-session      (WhatsApp sessions)
  - ai-whatsapp-message      (WhatsApp messages)

Usage:
    python scripts/clear_conversations.py

Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION  (same as the app)
"""

import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION            = os.getenv("AWS_REGION",              "us-east-1")
AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID",       "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY",   "")
ENDPOINT_URL          = os.getenv("DYNAMODB_ENDPOINT_URL",   None)

TABLES = [
    os.getenv("CONVERSATION_TABLE",       "ai-conversation"),
    os.getenv("MESSAGE_TABLE",            "ai-message"),
    os.getenv("WHATSAPP_SESSION_TABLE",   "ai-whatsapp-session"),
    os.getenv("WHATSAPP_MESSAGE_TABLE",   "ai-whatsapp-message"),
]


def get_key_names(client, table_name: str) -> list[str]:
    desc = client.describe_table(TableName=table_name)
    return [k["AttributeName"] for k in desc["Table"]["KeySchema"]]


def clear_table(dynamodb, client, table_name: str) -> int:
    table = dynamodb.Table(table_name)
    key_names = get_key_names(client, table_name)

    deleted = 0
    last_key = None

    while True:
        kwargs = {}
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key

        response = table.scan(
            ProjectionExpression=", ".join(f"#k{i}" for i in range(len(key_names))),
            ExpressionAttributeNames={f"#k{i}": name for i, name in enumerate(key_names)},
            **kwargs,
        )

        items = response.get("Items", [])
        for i in range(0, len(items), 25):
            batch = items[i : i + 25]
            with table.batch_writer() as writer:
                for item in batch:
                    writer.delete_item(Key={name: item[name] for name in key_names})
            deleted += len(batch)

        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break

    return deleted


def main():
    print(f"\n{'='*55}")
    print("  CLEAR CONVERSATIONS & MESSAGES")
    print(f"  Tables: {', '.join(TABLES)}")
    print(f"{'='*55}")
    print("\n  ⚠️  This will permanently delete ALL conversation data.")
    confirm = input("  Type 'yes' to confirm: ").strip().lower()
    if confirm != "yes":
        print("  Aborted.")
        return

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

    total = 0
    for table_name in TABLES:
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
    print(f"  Done. Total items deleted: {total}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
