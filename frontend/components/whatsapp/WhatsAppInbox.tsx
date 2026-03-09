'use client';

import { WhatsAppSession } from '@/types';
import { Inbox } from 'lucide-react';
import WhatsAppInboxItem from './WhatsAppInboxItem';

interface Props {
  sessions: WhatsAppSession[];
  channelId: string;
  activeSessionId?: string;
  isLoading: boolean;
}

export default function WhatsAppInbox({ sessions, channelId, activeSessionId, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
              <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sin conversaciones</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 max-w-xs">
          Las conversaciones aparecerán aquí cuando los usuarios envíen mensajes a este canal.
        </p>
      </div>
    );
  }

  return (
    <div>
      {sessions.map((session) => (
        <WhatsAppInboxItem
          key={session.id}
          session={session}
          channelId={channelId}
          isActive={session.id === activeSessionId}
        />
      ))}
    </div>
  );
}
