import { RAGMetrics, RAGTrace, RAGTracesResponse } from '@/types';
import { ApiService } from './api';

class ApiRAGTraces extends ApiService {
  constructor() {
    super();
  }

  getTraces = async (
    agentId: string,
    limit = 50,
    lastKey?: string,
  ): Promise<RAGTracesResponse> => {
    const params: Record<string, string | number> = { agent_id: agentId, limit };
    if (lastKey) params.lastKey = lastKey;
    const response = await this.api.get('/rag-traces', { params });
    return response.data.data as RAGTracesResponse;
  };

  getMetrics = async (agentId: string): Promise<RAGMetrics> => {
    const response = await this.api.get('/rag-traces/metrics', {
      params: { agent_id: agentId },
    });
    return response.data.data as RAGMetrics;
  };
}

export const apiRAGTraces = new ApiRAGTraces();
