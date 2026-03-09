'use client';

import type { WhatsAppStats } from '@/types';
import { MessageCircle, Wifi, Users, CheckCircle2 } from 'lucide-react';

interface Props {
  stats: WhatsAppStats | undefined;
  isLoading: boolean;
}

const statCards = (stats: WhatsAppStats) => [
  {
    label: 'Canales totales',
    value: stats.total_channels,
    icon: MessageCircle,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
  },
  {
    label: 'Canales activos',
    value: stats.active_channels,
    icon: Wifi,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    label: 'Conversaciones',
    value: stats.total_sessions,
    icon: Users,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
  },
  {
    label: 'Sesiones activas',
    value: stats.active_sessions,
    icon: CheckCircle2,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
  },
];

export default function WhatsAppStats({ stats, isLoading }: Props) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-3" />
            <div className="h-7 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {statCards(stats).map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex p-1.5 rounded-lg ${bg}`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={2} />
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}
