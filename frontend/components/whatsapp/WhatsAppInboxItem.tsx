'use client';

import Link from 'next/link';
import { WhatsAppSession } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { User } from 'lucide-react';

interface Props {
  session: WhatsAppSession;
  channelId: string;
  isActive: boolean;
}

export default function WhatsAppInboxItem({ session, channelId, isActive }: Props) {
  const timeLabel = session.last_message_at
    ? formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true, locale: es })
    : '';

  return (
    <Link
      href={`/whatsapp/${channelId}/${session.id}`}
      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100 dark:border-white/[0.05] last:border-b-0 ${
        isActive ? 'bg-indigo-50/60 dark:bg-indigo-500/[0.06]' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
        <User className="w-4.5 h-4.5 text-gray-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {session.contact_name || session.from_phone}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{timeLabel}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {session.from_phone}
        </p>
        {session.last_message_preview && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {session.last_message_preview}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {session.unread_count > 0 && (
        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center mt-1">
          {session.unread_count > 99 ? '99+' : session.unread_count}
        </span>
      )}
    </Link>
  );
}
