import { useQuery } from '@tanstack/react-query';
import { executionTracesApi } from '../api/execution_traces';
import type { ExecutionTrace } from '@/types';

export function useExecutionTraces(agentId: string | null = null) {
  return useQuery({
    queryKey: ['execution-traces', agentId],
    queryFn: () => executionTracesApi.getTraces(agentId),
  });
}

export function useExecutionTrace(traceId: string) {
  return useQuery<ExecutionTrace>({
    queryKey: ['execution-trace', traceId],
    queryFn: () => executionTracesApi.getTrace(traceId),
    enabled: !!traceId,
  });
}
