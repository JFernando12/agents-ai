'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Trash2, Bot, BotOff } from 'lucide-react';
import {
  useWhatsAppMessages,
  useSendWhatsAppMessage,
  useDeleteWhatsAppSession,
  useToggleWhatsAppSession,
  useMarkSessionRead,
} from '@/lib/hooks/useWhatsApp';
import { useQuery } from '@tanstack/react-query';
import { whatsappApi } from '@/lib/api/whatsapp';
import WhatsAppConversationView from '@/components/whatsapp/WhatsAppConversationView';
import WhatsAppSendBar from '@/components/whatsapp/WhatsAppSendBar';

interface Props {
  params: Promise<{ channelId: string; sessionId: string }>;
}

export default function WhatsAppConversationPage({ params }: Props) {
  const { channelId, sessionId } = use(params);
  const router = useRouter();
  const deleteSession = useDeleteWhatsAppSession();
  const markRead = useMarkSessionRead();

  useEffect(() => {
    if (sessionId) markRead.mutate(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const { data: session } = useQuery({
    queryKey: ['whatsapp-session', sessionId],
    queryFn: () =>
      whatsappApi
        .getSessions(channelId)
        .then((r) => r.items.find((s) => s.id === sessionId)),
    enabled: !!sessionId,
  });

  const { data: messages = [], isLoading } = useWhatsAppMessages(sessionId);
  const sendMessage = useSendWhatsAppMessage(sessionId);
  const toggleAgent = useToggleWhatsAppSession(sessionId);

  const isAgentActive = session?.status === 'active';

  const handleDelete = () => {
    const name =
      session?.contact_name || session?.from_phone || 'esta conversación';
    if (
      !confirm(
        `¿Eliminar la conversación con ${name}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    deleteSession.mutate(sessionId, {
      onSuccess: () => router.push(`/whatsapp/${channelId}`),
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <Link
            href={`/whatsapp/${channelId}`}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.08] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {session?.contact_name || session?.from_phone || '...'}
            </p>
            {session?.contact_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {session?.from_phone}
              </p>
            )}
          </div>

          {/* Agent status + toggle */}
          <button
            onClick={() => toggleAgent.mutate()}
            disabled={toggleAgent.isPending}
            title={isAgentActive ? 'Desactivar agente' : 'Activar agente'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              isAgentActive
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20'
            }`}
          >
            {isAgentActive ? (
              <Bot className="w-3.5 h-3.5" />
            ) : (
              <BotOff className="w-3.5 h-3.5" />
            )}
            {isAgentActive ? 'Activo' : 'Desactivado'}
          </button>

          {/* Processing indicator */}
          {messages.some((m) => m.status === 'processing') && (
            <span className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              Agente respondiendo...
            </span>
          )}

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleteSession.isPending}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
            title="Eliminar conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <WhatsAppConversationView messages={messages} isLoading={isLoading} />

        {/* Send bar */}
        <WhatsAppSendBar
          onSend={(msg) => sendMessage.mutateAsync(msg)}
          isSending={sendMessage.isPending}
        />
      </div>
    </div>
  );
}
