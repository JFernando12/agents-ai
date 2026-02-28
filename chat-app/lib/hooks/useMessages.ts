import { useQuery } from "@tanstack/react-query";
import { apiMessages } from "../api/messages";

export const useMessages = ({ chatId }: { chatId: string }) => {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => apiMessages.getMessages(chatId),
    enabled: !!chatId && chatId !== "new"
  });
}