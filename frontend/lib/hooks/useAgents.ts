import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiAgents } from "../api/agents";

export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: apiAgents.getModels,
    staleTime: Infinity,
  });
};

export const useAgents = () => {
  return useQuery({
    queryKey: ["agents"],
    queryFn: apiAgents.getAgents,
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiAgents.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiAgents.updateAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiAgents.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
};