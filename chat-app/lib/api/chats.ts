import { Chat, Message } from "@/types";
import { ApiService } from "./api";

class ApiChats extends ApiService {
  constructor() {
    super();
  }

  getChats = async ({
    serviceId,
    user,
  }: {
    serviceId?: string;
    user?: string;
  }): Promise<Chat[]> => {
    if (!serviceId || !user) return [];

    const response = await this.api.get('/conversations', {
      params: { agent_id: serviceId, user },
    });

    const formmattedChats = [];
    for (let i = 0; i < response.data.data.length; i++) {
      const chat = response.data.data[i];
      if (!chat.title || chat.title.trim() === '') {
        chat.title = `Chat ${i + 1}`;
      }
      formmattedChats.push(chat);
    }
    console.log('Fetched chats:', formmattedChats);
    formmattedChats.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    console.log('Sorted chats:', formmattedChats);

    return formmattedChats;
  };

  converse = async ({
    chatId,
    message,
  }: {
    chatId: string;
    message: string;
  }): Promise<Message> => {
    const response = await this.api.post('/chat', {
      type: 'conversation',
      conversation_id: chatId,
      message,
    });
    const newMessage: Message = {
      role: 'model',
      content: response.data.data.answer,
      timestamp: new Date(response.data.data.assistant_timestamp).toISOString(),
    };
    return newMessage;
  };

  createAndConverse = async ({
    serviceId,
    user,
    message,
  }: {
    serviceId: string;
    user: string;
    message: string;
  }): Promise<{ chat: Chat; modelMessage: Message; userMessage: Message }> => {
    const response = await this.api.post('/chat', {
      type: 'conversation',
      agent_id: serviceId,
      user,
      message,
    });

    const newChat: Chat = {
      id: response.data.data.conversation_id,
      title: response.data.data.title || 'New Chat',
      timestamp: new Date().toISOString(),
    };

    const modelMessage: Message = {
      role: 'model',
      content: response.data.data.answer,
      timestamp: new Date(response.data.data.assistant_timestamp).toISOString(),
    };

    const userMessage: Message = {
      role: 'user',
      content: response.data.data.query,
      timestamp: new Date(response.data.data.user_timestamp).toISOString(),
    };

    return { chat: newChat, modelMessage, userMessage };
  };

  deleteChat = async ({ chatId }: { chatId: string }): Promise<void> => {
    await this.api.delete(`/conversations/${chatId}`);
  };
}

export const apiChats = new ApiChats();