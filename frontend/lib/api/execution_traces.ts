import { ApiService } from './api';
import type { ExecutionTrace, ExecutionTracesResponse } from '@/types';

interface RawTrace {
  id: string;
  agent_id: string;
  agent_name: string;
  user: string;
  account_id: string;
  conversation_id: string | null;
  user_message: string;
  final_response: string;
  tool_calls: ExecutionTrace['tool_calls'];
  total_iterations: number;
  duration_ms: number;
  was_answered: boolean;
  created_at: string;
}

class ExecutionTracesApi extends ApiService {
  constructor() {
    super();
  }

  getTraces = async (
    agentId: string | null = null,
    limit = 20,
    lastKey: Record<string, string> | null = null,
  ): Promise<ExecutionTracesResponse> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (agentId) params.append('agent_id', agentId);
    if (lastKey) params.append('lastKey', JSON.stringify(lastKey));

    const response = await this.api.get(`/execution-traces?${params.toString()}`);
    const data = response.data.data;

    const items: ExecutionTrace[] = data.items.map((t: RawTrace) => ({
      ...t,
      created_at: t.created_at,
    }));

    return {
      items,
      lastKey: data.lastKey ?? null,
      hasMore: data.hasMore ?? false,
    };
  };

  getTrace = async (traceId: string): Promise<ExecutionTrace> => {
    const response = await this.api.get(`/execution-traces/${traceId}`);
    return response.data.data;
  };
}

export const executionTracesApi = new ExecutionTracesApi();
