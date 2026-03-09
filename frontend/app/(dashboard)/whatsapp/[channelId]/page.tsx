'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wifi, WifiOff, Bot } from 'lucide-react';
import { useWhatsAppChannel, useWhatsAppSessions } from '@/lib/hooks/useWhatsApp';
import WhatsAppInbox from '@/components/whatsapp/WhatsAppInbox';

interface Props {
  params: Promise<{ channelId: string }>;
}

export default function WhatsAppInboxPage({ params }: Props) {
  const { channelId } = use(params);
  const { data: channel, isLoading: loadingChannel } = useWhatsAppChannel(channelId);
  const { data: sessions = [], isLoading: loadingSessions } = useWhatsAppSessions(channelId);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <Link
            href="/whatsapp"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {loadingChannel ? (
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-40 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-28 animate-pulse" />
            </div>
          ) : channel ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {channel.name}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  channel.is_active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-500'
                }`}>
                  {channel.is_active ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {channel.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  📞 {channel.phone_number_id}
                </span>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Bot className="w-3 h-3" />
                  {channel.agent_id}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Canal no encontrado</span>
          )}

          <div className="ml-auto text-xs text-gray-400 dark:text-gray-600 flex-shrink-0">
            {sessions.length} conversación{sessions.length !== 1 ? 'es' : ''}
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          <WhatsAppInbox
            sessions={sessions}
            channelId={channelId}
            isLoading={loadingSessions}
          />
        </div>
      </div>
    </div>
  );
}
