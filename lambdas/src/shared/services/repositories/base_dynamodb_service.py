import boto3
from decimal import Decimal

from ....config.environment import env

class BaseDynamoDBService:
    def __init__(self):
        self.dynamodb = boto3.resource(
            'dynamodb', 
            region_name=env.region
        )
    
    @staticmethod
    def _decimal_to_float(value):
        if isinstance(value, Decimal):
            return float(value)
        return value
