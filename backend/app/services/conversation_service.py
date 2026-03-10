from app.repositories import conversation_repository
from app.models import ConversationCreate

class ConversationService:
    def get_all(self, user: str, agent_id: str) -> list[dict]:
        conversations = conversation_repository.get_by_user_and_agent(user=user, agent_id=agent_id)
        return [conversation.model_dump(mode='json') for conversation in conversations]

    def get_all_by_account(self, agent_id: str | None = None) -> list[dict]:
        conversations = conversation_repository.get_all(agent_id=agent_id)
        return [conversation.model_dump(mode='json') for conversation in conversations]

    def create(self, conversation_data: ConversationCreate) -> str:
        conversation_id = conversation_repository.create(conversation_data)
        return conversation_id

    def delete(self, conversation_id: str) -> bool:
        # Cascade: if a WhatsApp session is linked, remove it and its WA messages too
        from app.repositories.whatsapp_repository import whatsapp_repository
        wa_session = whatsapp_repository.find_session_by_conversation_id(conversation_id)
        if wa_session:
            whatsapp_repository.delete_session(wa_session.id)
        return conversation_repository.delete(conversation_id)

conversation_service = ConversationService()