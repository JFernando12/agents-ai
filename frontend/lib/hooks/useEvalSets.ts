import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiEvalSets } from '../api/eval_sets';
import { EvalSetCreate } from '@/types';

export function useEvalSets(agentId: string | null) {
  return useQuery({
    queryKey: ['eval-sets', agentId],
    queryFn: () => apiEvalSets.listByAgent(agentId!),
    enabled: !!agentId,
  });
}

export function useEvalSet(evalSetId: string | null) {
  return useQuery({
    queryKey: ['eval-set', evalSetId],
    queryFn: () => apiEvalSets.get(evalSetId!),
    enabled: !!evalSetId,
  });
}

export function useCreateEvalSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EvalSetCreate) => apiEvalSets.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['eval-sets', result.agent_id] });
    },
  });
}

export function useUpdateEvalSet(evalSetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EvalSetCreate) => apiEvalSets.update(evalSetId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['eval-sets', result.agent_id] });
      queryClient.invalidateQueries({ queryKey: ['eval-set', evalSetId] });
    },
  });
}

export function useDeleteEvalSet(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evalSetId: string) => apiEvalSets.delete(evalSetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eval-sets', agentId] });
    },
  });
}

export function useEvalRuns(evalSetId: string | null) {
  return useQuery({
    queryKey: ['eval-runs', evalSetId],
    queryFn: () => apiEvalSets.listRuns(evalSetId!),
    enabled: !!evalSetId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasActive = data.some((r) => r.status === 'pending' || r.status === 'running');
      return hasActive ? 3000 : false;
    },
  });
}

export function useEvalRun(evalSetId: string | null, runId: string | null) {
  return useQuery({
    queryKey: ['eval-run', runId],
    queryFn: () => apiEvalSets.getRun(evalSetId!, runId!),
    enabled: !!evalSetId && !!runId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return data.status === 'pending' || data.status === 'running' ? 3000 : false;
    },
  });
}

export function useTriggerEvalRun(evalSetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiEvalSets.triggerRun(evalSetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eval-runs', evalSetId] });
    },
  });
}
