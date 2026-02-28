from app.repositories import agent_repository, document_repository
from app.models import AgentCreate, AgentUpdate, CreateLog
from app.integrations import s3_service, logger_service
from app.config import env, DEFAULT_AGENT_PROMPT, PROMPT_IMPROVEMENT_SYSTEM
import boto3

class AgentService:
    def get_all(self, is_public: bool | None = False) -> list[dict]:
        agents = agent_repository.get_all(is_public=is_public)
        return [agent.model_dump(mode='json') for agent in agents]
    
    def get_one(self, agent_id: str) -> dict | None:
        agent = agent_repository.get_by_id(agent_id)
        if not agent:
            return None
        return agent.model_dump(mode='json')
    
    def create(self, agent_data: AgentCreate, user: str) -> str |None:
        agent_data.custom_prompt = agent_data.custom_prompt or DEFAULT_AGENT_PROMPT
        agent_data.status = "active"

        new_agent_id = agent_repository.create(agent_data=agent_data, user=user)

        created_agent = agent_repository.get_by_id(agent_id=new_agent_id)
        
        if not created_agent:
            return None
        
        logger_service.save_log(CreateLog(
            user=user,
            agent_id=created_agent.id,
            agent_name=created_agent.name,
            action="CREATE_AGENT",
            agent_before_state=None,
            agent_after_state=created_agent
        ))

        return new_agent_id
    
    def update(self, agent_id: str, agent_data: AgentUpdate, user: str) -> bool:
        existing_agent = agent_repository.get_by_id(agent_id)

        if not existing_agent:
            return False

        agent_repository.update(agent_id=agent_id, agent_data=agent_data)

        updated_agent = agent_repository.get_by_id(agent_id=agent_id)

        if not updated_agent:
            return False

        logger_service.save_log(
            CreateLog(
                user=user,
                agent_id=updated_agent.id,
                agent_name=updated_agent.name,
                action="UPDATE_AGENT",
                agent_before_state=existing_agent,
                agent_after_state=updated_agent
            )
        )
        return True
    
    def delete(self, agent_id: str, user: str) -> bool:
        existing_agent = agent_repository.get_by_id(agent_id=agent_id)
        if not existing_agent:
            return False
        
        agent_name = existing_agent.name
        
        documents = document_repository.get(agent_id=agent_id)
        s3_files_deleted = 0
        
        for document in documents:
            try:
                s3_service.delete_file(document.s3_key)
                s3_files_deleted += 1
                
                index_key = f"faiss/{agent_id}/{document.id}/index.faiss"
                metadata_key = f"faiss/{agent_id}/{document.id}/metadata.pkl"
                
                try:
                    s3_service.delete_file(index_key)
                    s3_service.delete_file(metadata_key)
                    s3_files_deleted += 2
                except Exception as e:
                    print(f"FAISS files not found for document {document.id}: {e}")
                    
            except Exception as e:
                print(f"Error deleting S3 files for document {document.id}: {e}")
        
        try:
            additional_files = s3_service.delete_files_by_prefix(f"{agent_id}/")
            additional_faiss_files = s3_service.delete_files_by_prefix(f"faiss/{agent_id}/")
            s3_files_deleted += additional_files + additional_faiss_files
        except Exception as e:
            print(f"Error during prefix-based cleanup: {e}")
        
        deletion_success = agent_repository.delete(agent_id=agent_id)
        
        if not deletion_success:
            return False
        
        logger_service.save_log(CreateLog(
            user=user,
            agent_id=agent_id,
            agent_name=agent_name,
            action="DELETE_AGENT",
            agent_before_state=existing_agent,
            agent_after_state=None
        ))

        return True
    
    def improve_prompt(self, prompt: str) -> str:
        bedrock_runtime = boto3.client(
            "bedrock-runtime",
            region_name=env.region,
            aws_access_key_id=env.aws_access_key_id,
            aws_secret_access_key=env.aws_secret_access_key
        )
        
        try:
            response = bedrock_runtime.converse(
                modelId="us.anthropic.claude-sonnet-4-20250514-v1:0",
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": prompt}]
                    }
                ],
                system=[{"text": PROMPT_IMPROVEMENT_SYSTEM}],
                inferenceConfig={
                    "maxTokens": 8000,
                    "temperature": 0.7
                }
            )
            
            improved_prompt = response["output"]["message"]["content"][0]["text"]
            return improved_prompt
            
        except Exception as e:
            print(f"Error improving prompt: {e}")
            raise Exception(f"Failed to improve prompt: {str(e)}")
    
agent_service = AgentService()