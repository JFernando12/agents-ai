import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ToolCreate, ToolUpdate } from '@/types';
import { apiTools } from '../api/tools';

/** Catálogo completo. Se considera fresco 5 min → sin refetch en cada foco de ventana. */
export const useAllTools = () => {
  return useQuery({
    queryKey: ['tools'],
    queryFn: () => apiTools.getAllTools(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useToolsByProduct = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['tools', 'product', productId],
    queryFn: () => apiTools.getToolsByProduct(productId!),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toolData: ToolCreate) => apiTools.createTool(toolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
};

export const useUpdateTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      toolId,
      toolData,
    }: {
      toolId: string;
      toolData: ToolUpdate;
    }) => apiTools.updateTool(toolId, toolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
};

export const useDeleteTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) => apiTools.deleteTool(toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
};
