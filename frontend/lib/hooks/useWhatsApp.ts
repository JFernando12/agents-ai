import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '../api/whatsapp';
import { WhatsAppChannelCreate, WhatsAppChannelUpdate } from '@/types';

// ── Channels ──────────────────────────────────────────────────────────────────

export const useWhatsAppChannels = () =>
  useQuery({
    queryKey: ['whatsapp-channels'],
    queryFn: whatsappApi.getChannels,
  });

export const useWhatsAppChannel = (channelId: string) =>
  useQuery({
    queryKey: ['whatsapp-channel', channelId],
    queryFn: () => whatsappApi.getChannel(channelId),
    enabled: !!channelId,
  });

export const useCreateWhatsAppChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WhatsAppChannelCreate) => whatsappApi.createChannel(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-channels'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-stats'] });
    },
  });
};

export const useUpdateWhatsAppChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WhatsAppChannelUpdate }) =>
      whatsappApi.updateChannel({ id, data }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['whatsapp-channels'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-channel', id] });
    },
  });
};

export const useDeleteWhatsAppChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => whatsappApi.deleteChannel(channelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-channels'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-stats'] });
    },
  });
};

export const useToggleWhatsAppChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => whatsappApi.toggleChannel(channelId),
    onSuccess: (_data, channelId) => {
      qc.invalidateQueries({ queryKey: ['whatsapp-channels'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-channel', channelId] });
    },
  });
};

// ── Stats ─────────────────────────────────────────────────────────────────────

export const useWhatsAppStats = () =>
  useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: whatsappApi.getStats,
    refetchInterval: 10_000,
  });

// ── Sessions (inbox) — polled every 3s ───────────────────────────────────────

export const useWhatsAppSessions = (channelId: string) =>
  useQuery({
    queryKey: ['whatsapp-sessions', channelId],
    queryFn: () => whatsappApi.getSessions(channelId),
    enabled: !!channelId,
    refetchInterval: 3_000,
    select: (data) => data.items,
  });

// ── Messages — polled every 2s while conversation is open ────────────────────

export const useWhatsAppMessages = (sessionId: string) =>
  useQuery({
    queryKey: ['whatsapp-messages', sessionId],
    queryFn: () => whatsappApi.getMessages(sessionId),
    enabled: !!sessionId,
    refetchInterval: 2_000,
    select: (data) => data.items,
  });

// ── Send manual message ───────────────────────────────────────────────────────

export const useSendWhatsAppMessage = (sessionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => whatsappApi.sendMessage({ sessionId, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-messages', sessionId] });
      // Also refresh sessions to update preview
      qc.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
    },
  });
};
