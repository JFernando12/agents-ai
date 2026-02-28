import { ApiService } from './api';

class ApiChat extends ApiService {
  constructor() {
    super();
  }
  async converse({
    agent_id,
    message,
  }: {
    agent_id: string;
    message: string;
  }): Promise<string> {
    const body = {
      message: message,
      user: 'default_user',
      agent_id: agent_id,
    };
    const response = await this.api.post('/chat', body);
    console.log('Converse response:', response);

    return response.data.data.answer;
  }
}

export const apiChat = new ApiChat();
