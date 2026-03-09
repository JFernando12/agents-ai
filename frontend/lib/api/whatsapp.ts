import {
  WhatsAppChannel,
  WhatsAppChannelCreate,
  WhatsAppChannelUpdate,
  WhatsAppMessage,
  WhatsAppMessagesResponse,
  WhatsAppSession,
  WhatsAppSessionsResponse,
  WhatsAppStats,
} from '@/types';
import { ApiService } from './api';

class WhatsAppApiService extends ApiService {
  // ── Channels ─────────────────────────────────────────────────────────────

  getChannels = async (): Promise<WhatsAppChannel[]> => {
    const res = await this.api.get('/whatsapp/channels');
    return res.data.data;
  };

  getChannel = async (channelId: string): Promise<WhatsAppChannel> => {
    const res = await this.api.get(`/whatsapp/channels/${channelId}`);
    return res.data.data;
  };

  createChannel = async (data: WhatsAppChannelCreate): Promise<WhatsAppChannel> => {
    const res = await this.api.post('/whatsapp/channels', data);
    return res.data.data;
  };

  updateChannel = async ({
    id,
    data,
  }: {
    id: string;
    data: WhatsAppChannelUpdate;
  }): Promise<WhatsAppChannel> => {
    const res = await this.api.put(`/whatsapp/channels/${id}`, data);
    return res.data.data;
  };

  deleteChannel = async (channelId: string): Promise<void> => {
    await this.api.delete(`/whatsapp/channels/${channelId}`);
  };

  toggleChannel = async (channelId: string): Promise<WhatsAppChannel> => {
    const res = await this.api.post(`/whatsapp/channels/${channelId}/toggle`);
    return res.data.data;
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats = async (): Promise<WhatsAppStats> => {
    const res = await this.api.get('/whatsapp/stats');
    return res.data.data;
  };

  // ── Sessions ─────────────────────────────────────────────────────────────

  getSessions = async (channelId: string): Promise<WhatsAppSessionsResponse> => {
    const res = await this.api.get(`/whatsapp/channels/${channelId}/sessions`);
    return res.data.data;
  };

  // ── Messages ─────────────────────────────────────────────────────────────

  getMessages = async (sessionId: string): Promise<WhatsAppMessagesResponse> => {
    const res = await this.api.get(`/whatsapp/sessions/${sessionId}/messages`);
    return res.data.data;
  };

  sendMessage = async ({
    sessionId,
    message,
  }: {
    sessionId: string;
    message: string;
  }): Promise<void> => {
    await this.api.post(`/whatsapp/sessions/${sessionId}/send`, { message });
  };
}

export const whatsappApi = new WhatsAppApiService();
