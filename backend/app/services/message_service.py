from app.repositories import conversation_repository

class MessageService:
    def get_all(self, conversation_id: str, limit: int | None = 100) -> list[dict]:
        conversation = conversation_repository.get_by_id(conversation_id)
        if not conversation:
            return []
        
        messages = conversation_repository.get_messages(conversation_id, limit)
        return [message.model_dump(mode='json') for message in messages]

message_service = MessageService()