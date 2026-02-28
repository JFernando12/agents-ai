import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiChats } from "../api/chats";
import { Message } from "@/types";

export const useChats = ({
  serviceId,
  user,
}: {
  serviceId?: string;
  user?: string;
}) => {
  return useQuery({
    queryKey: ['chats', serviceId, user],
    queryFn: () => apiChats.getChats({ serviceId, user }),
    enabled: !!serviceId && !!user,
  });
};

export const useConverse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiChats.converse,
    onMutate: async ({ chatId, message }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });

      const previousMessages = queryClient.getQueryData<Message[]>([
        'messages',
        chatId,
      ]);

      const optimisticMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        _optimistic: true,
      } as Message & { _optimistic?: boolean };

      queryClient.setQueryData<Message[]>(
        ['messages', chatId],
        (oldMessages = []) => [...oldMessages, optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData<Message[]>(
          ['messages', variables.chatId],
          context.previousMessages
        );
      }
    },
    onSuccess: (newMessage, variables) => {
      queryClient.setQueryData<Message[]>(
        ['messages', variables.chatId],
        (oldMessages = []) => {
          let updated = [...oldMessages];
          const optimisticIndex = [...updated]
            .reverse()
            .findIndex((m: any) => m._optimistic);
          if (optimisticIndex !== -1) {
            const realIndex = updated.length - 1 - optimisticIndex;
            updated[realIndex] = {
              ...updated[realIndex],
              attachments: newMessage.attachments,
            };
            delete (updated[realIndex] as any)._optimistic;
          }
          updated.push(newMessage);
          return updated;
        }
      );
    },
  });
};

export const useCreateAndConverse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiChats.createAndConverse,
    onSuccess: ({ chat, userMessage, modelMessage }, { serviceId, user }) => {
      queryClient.invalidateQueries({ queryKey: ['chats', serviceId, user] });
      queryClient.setQueryData<Message[]>(
        ['messages', chat.id],
        [userMessage, modelMessage]
      );

      queryClient.invalidateQueries({ queryKey: ['messages', 'new'] });
    },
    onMutate: async ({ message }) => {
      const userMessage: Message = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
        attachments: [],
      };

      queryClient.setQueryData<Message[]>(['messages', 'new'], [userMessage]);
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiChats.deleteChat,
    onSuccess: (_data, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.removeQueries({ queryKey: ["messages", chatId ] });
    },
  });
}