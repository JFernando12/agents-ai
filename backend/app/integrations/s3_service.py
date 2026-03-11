import boto3
from botocore.exceptions import ClientError
import logging

from app.config import env

class S3Service:    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key
        )
        self.bucket_name = env.s3_bucket_name
    
    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> str | None:
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            logging.error(f"Error generating presigned URL for {s3_key}: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Unexpected error generating presigned URL for {s3_key}: {str(e)}")
            return None
    
    def check_object_exists(self, s3_key: str) -> bool:
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            logging.error(f"Error checking if object exists {s3_key}: {str(e)}")
            return False
        except Exception as e:
            logging.error(f"Unexpected error checking if object exists {s3_key}: {str(e)}")
            return False

    def delete_file(self, s3_key: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logging.info(f"Successfully deleted S3 object: {s3_key}")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey' or error_code == '404':
                logging.info(f"S3 object {s3_key} does not exist, treating as deleted")
                return True
            else:
                logging.error(f"ClientError deleting S3 object {s3_key}: {str(e)}")
                raise Exception(f"Failed to delete S3 object {s3_key}: {str(e)}")
        except Exception as e:
            logging.error(f"Unexpected error deleting S3 object {s3_key}: {str(e)}")
            raise Exception(f"Failed to delete S3 object {s3_key}: {str(e)}")

    def delete_files_by_prefix(self, prefix: str) -> int:
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            if 'Contents' not in response:
                logging.info(f"No objects found with prefix: {prefix}")
                return 0
            
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
            
            if objects_to_delete:
                delete_response = self.s3_client.delete_objects(
                    Bucket=self.bucket_name,
                    Delete={'Objects': objects_to_delete}
                )
                
                deleted_count = len(delete_response.get('Deleted', []))
                return deleted_count
            
            return 0
            
        except Exception as e:
            logging.error(f"Error deleting objects with prefix {prefix}: {str(e)}")
            raise Exception(f"Failed to delete objects with prefix {prefix}: {str(e)}")

    def upload_bytes(self, content: bytes, key: str, content_type: str = "image/jpeg") -> str:
        """Upload raw bytes to S3 and return the public HTTPS URL."""
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        return f"https://{self.bucket_name}.s3.amazonaws.com/{key}"

s3_service = S3Service()