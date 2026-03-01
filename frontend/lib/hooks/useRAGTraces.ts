import { useQuery } from '@tanstack/react-query';
import { apiRAGTraces } from '../api/rag_traces';

export function useRAGTraces(agentId: string | null, limit = 50) {
  return useQuery({
    queryKey: ['rag-traces', agentId, limit],
    queryFn: () => apiRAGTraces.getTraces(agentId!, limit),
    enabled: !!agentId,
  });
}

export function useRAGMetrics(agentId: string | null) {
  return useQuery({
    queryKey: ['rag-metrics', agentId],
    queryFn: () => apiRAGTraces.getMetrics(agentId!),
    enabled: !!agentId,
  });
}
