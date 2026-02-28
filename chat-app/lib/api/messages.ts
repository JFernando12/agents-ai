import { Message } from '@/types';
import { ApiService } from './api';

class ApiMessages extends ApiService {
  constructor() {
    super();
  }

  getMessages = async (chatId: string): Promise<Message[]> => {
    if (!chatId) return [];

    const response = await this.api.get('/messages', {
      params: { conversation_id: chatId },
    });
    const messages = response.data.data as Message[];
    messages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return messages;
  };
}

export const apiMessages = new ApiMessages();
