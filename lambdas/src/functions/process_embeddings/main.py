import urllib.parse

from .process_embeddings import process_embeddings

def handler(event, context):
    try:
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = urllib.parse.unquote_plus(record['s3']['object']['key'], encoding='utf-8')
            
            print(f"Processing S3 object: {key} from bucket: {bucket}")
            
            path_parts = key.split('/')
            if len(path_parts) < 2:
                print(f"Invalid S3 key format: {key}. Expected: agent_id/filename.pdf")
                continue
            
            agent_id = path_parts[0]
            file_name = path_parts[-1].replace('.pdf', '')
    
            process_embeddings(agent_id=agent_id, file_name=file_name)            
    except Exception as error:
        print(f"Error processing embeddings: {error}")
        raise error
