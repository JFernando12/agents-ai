"""
Adds the conversation_id-index GSI to the existing ai-whatsapp-session table.

Usage:
    python scripts/add_gsi_whatsapp_session.py
"""

import os
import time
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION            = os.getenv("AWS_REGION",            "us-east-1")
AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID",     "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
TABLE_NAME            = os.getenv("WHATSAPP_SESSION_TABLE", "ai-whatsapp-session")
INDEX_NAME            = "conversation_id-index"


def main():
    client = boto3.client(
        "dynamodb",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )

    # Check if GSI already exists
    desc = client.describe_table(TableName=TABLE_NAME)
    existing = [gsi["IndexName"] for gsi in desc["Table"].get("GlobalSecondaryIndexes", [])]
    if INDEX_NAME in existing:
        print(f"GSI '{INDEX_NAME}' already exists on '{TABLE_NAME}'. Nothing to do.")
        return

    print(f"Adding GSI '{INDEX_NAME}' to '{TABLE_NAME}'...")

    client.update_table(
        TableName=TABLE_NAME,
        AttributeDefinitions=[
            {"AttributeName": "conversation_id", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexUpdates=[
            {
                "Create": {
                    "IndexName": INDEX_NAME,
                    "KeySchema": [
                        {"AttributeName": "conversation_id", "KeyType": "HASH"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            }
        ],
    )

    # Wait until the index is active
    print("Waiting for GSI to become ACTIVE", end="", flush=True)
    while True:
        time.sleep(5)
        desc = client.describe_table(TableName=TABLE_NAME)
        gsi_list = desc["Table"].get("GlobalSecondaryIndexes", [])
        gsi = next((g for g in gsi_list if g["IndexName"] == INDEX_NAME), None)
        if gsi and gsi["IndexStatus"] == "ACTIVE":
            break
        print(".", end="", flush=True)

    print(f"\nDone. GSI '{INDEX_NAME}' is now ACTIVE on '{TABLE_NAME}'.")


if __name__ == "__main__":
    main()
