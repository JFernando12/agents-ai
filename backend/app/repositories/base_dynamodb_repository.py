import boto3
from decimal import Decimal

from app.config import env

class BaseDynamoDBRepository:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb', 
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key
        )
    
    @staticmethod
    def _decimal_to_float(value):
        if isinstance(value, Decimal):
            return float(value)
        return value

    @staticmethod
    def _serialize_decimals(obj):
        """Recursively convert Decimal values to int/float for JSON serialization."""
        if isinstance(obj, Decimal):
            return int(obj) if obj == obj.to_integral_value() else float(obj)
        if isinstance(obj, dict):
            return {k: BaseDynamoDBRepository._serialize_decimals(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [BaseDynamoDBRepository._serialize_decimals(i) for i in obj]
        return obj
