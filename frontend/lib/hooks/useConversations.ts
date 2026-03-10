import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiConversations } from '../api/conversations';

export const useConversations = (agentId?: string) => {
  return useQuery({
    queryKey: ['conversations', agentId ?? 'all'],
    queryFn: () => apiConversations.getAll(agentId),
  });
};

export const useConversationMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => apiConversations.getMessages(conversationId!),
    enabled: !!conversationId,
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiConversations.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
