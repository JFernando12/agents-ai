'use client';

import Link from 'next/link';
import { WhatsAppChannel } from '@/types';
import {
  Bot,
  Phone,
  Power,
  Pencil,
  Trash2,
  ChevronRight,
  Info,
} from 'lucide-react';

interface Props {
  channel: WhatsAppChannel;
  agentName?: string;
  onToggle: (id: string) => void;
  onEdit: (channel: WhatsAppChannel) => void;
  onDelete: (channel: WhatsAppChannel) => void;
  onSetup: (channel: WhatsAppChannel) => void;
}

export default function WhatsAppChannelCard({
  channel,
  agentName,
  onToggle,
  onEdit,
  onDelete,
  onSetup,
}: Props) {
  return (
    <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-white/[0.14] transition-colors">
      {/* Card header: status indicator */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {channel.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {channel.phone_number_id}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            channel.is_active
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-500'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${channel.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}
          />
          {channel.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Agent info */}
      {agentName && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {agentName}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(channel.id)}
            title={channel.is_active ? 'Desactivar' : 'Activar'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetup(channel)}
            title="Ver configuración"
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(channel)}
            title="Editar canal"
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(channel)}
            title="Eliminar canal"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <Link
          href={`/whatsapp/${channel.id}`}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Ver inbox
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
