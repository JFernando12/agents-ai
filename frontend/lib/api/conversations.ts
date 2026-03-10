import type { Conversation, ConversationMessage } from '@/types';
import { ApiService } from './api';

class ApiConversations extends ApiService {
  getAll = async (agentId?: string): Promise<Conversation[]> => {
    const params = agentId ? { agent_id: agentId } : {};
    const response = await this.api.get('/conversations/all', { params });
    return response.data.data;
  };

  getMessages = async (
    conversationId: string,
    limit = 50
  ): Promise<ConversationMessage[]> => {
    const response = await this.api.get('/messages', {
      params: { conversation_id: conversationId, limit },
    });
    return response.data.data;
  };

  delete = async (conversationId: string): Promise<void> => {
    await this.api.delete(`/conversations/${conversationId}`);
  };
}

export const apiConversations = new ApiConversations();
