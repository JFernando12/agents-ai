from datetime import datetime

from app.services.conversation_service import conversation_service
from app.repositories import conversation_repository
from app.integrations import AgentExecutor
from app.models import ChatRequest, ConversationCreate, Message, User
from app.utils.upload_s3 import UploadedFile
from app.utils.pdf_extract import extract_pdf_text_from_s3

class ChatService:
    def chat(self, user: User, chat_data: ChatRequest, file=None) -> dict | None:
        uploaded_pdf = None
        extracted_text = ""
        attachments = None
        if file:
            file_bytes = file.file.read()
            uploaded_file = UploadedFile(
                filename=file.filename,
                content=file_bytes,
                content_type=file.content_type,
            )

            uploaded_pdf = uploaded_file.upload_to_s3()
            attachments= [uploaded_pdf["url"]]
        
        if uploaded_pdf:
            extracted_text = extract_pdf_text_from_s3(
                bucket=uploaded_pdf["bucket"],
                key=uploaded_pdf["pdf_key"]
            )    
        
        if chat_data.type == 'conversation' and not chat_data.conversation_id:
            if not user.email:
                return None
            
            if not chat_data.agent_id:
                return None

            title = ' '.join(chat_data.message.split()[:5])
            chat_data.conversation_id = conversation_service.create(
                ConversationCreate(
                    user=user.email,
                    agent_id=chat_data.agent_id,
                    title=title
                )
            )

        user_timestamp = datetime.now()
        user_message = {'role': 'user', 'text': chat_data.message}
            
        message_objects = []
        conversation = None
        if chat_data.type == 'conversation':
            if not chat_data.conversation_id:
                return None
            conversation = conversation_repository.get_by_id(chat_data.conversation_id)
            if not conversation:
                return None
            message_objects = conversation_repository.get_messages(
                chat_id=chat_data.conversation_id,
                limit=30
            )
            chat_data.agent_id = conversation.agent_id
        
        if not chat_data.agent_id:
            return None
        
        messages = []
        for msg in message_objects:
            message_dict = {
                'role': msg.role,
                'text': msg.content,
            }
            messages.append(message_dict)
        messages = messages[::-1]
        messages.append(user_message)

        agent = AgentExecutor(agent_id=chat_data.agent_id)
        agent_response = agent.run(
            user=user.email,
            messages=messages,
            attached_text=extracted_text or None,
            context=chat_data.context or None,
        )
        answer = agent_response.response
        used_contexts = agent_response.contexts

        context_data = {
            'contexts': used_contexts,
            'uploaded_file': uploaded_pdf,
            'search_info': {
                'queries_used': [chat_data.message],
                'contexts_used': len(used_contexts),
                'agent_id': chat_data.agent_id,
            }
        }
        
        user_msg = Message(
            role='user',
            content=chat_data.message,
            attachments=attachments,
            timestamp=user_timestamp
        )
        
        assistant_timestamp = datetime.now()
        assistant_msg = Message(
            role='assistant',
            content=answer,
            timestamp=assistant_timestamp,
            context_data=context_data
        )
        
        if chat_data.conversation_id:
            conversation_repository.save_message(chat_data.conversation_id, user_msg)
            conversation_repository.save_message(chat_data.conversation_id, assistant_msg)
        
        return {
            'answer': answer,
            'contexts': used_contexts,
            'assistant_timestamp': assistant_timestamp.isoformat(),
            'conversation_id': chat_data.conversation_id,
            'query': chat_data.message,
            'user_timestamp': user_timestamp.isoformat(),
            'title': conversation.title if conversation else None,
            'attachments': attachments,
            'search_info': {
                'queries_used': [chat_data.message],
                'contexts_used': len(used_contexts),
                'agent_id': chat_data.agent_id,
            }
        }
    
chat_service = ChatService()