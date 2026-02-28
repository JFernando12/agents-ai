from app.repositories import conversation_repository
from app.models import ConversationCreate

class ConversationService:
    def get_all(self, user: str, agent_id: str) -> list[dict]:
        conversations = conversation_repository.get_by_user_and_agent(user=user, agent_id=agent_id)
        return [conversation.model_dump(mode='json') for conversation in conversations]

    def create(self, conversation_data: ConversationCreate) -> str:
        conversation_id = conversation_repository.create(conversation_data)
        return conversation_id
    
    def delete(self, conversation_id: str) -> bool:
        success = conversation_repository.delete(conversation_id)
        return success

conversation_service = ConversationService()