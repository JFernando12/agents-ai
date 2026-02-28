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
