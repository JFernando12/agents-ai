'use client';

import { Agent, WhatsAppChannel } from '@/types';
import { MessageSquareDashed } from 'lucide-react';
import WhatsAppChannelCard from './WhatsAppChannelCard';

interface Props {
  channels: WhatsAppChannel[];
  agents: Agent[];
  onToggle: (id: string) => void;
  onEdit: (channel: WhatsAppChannel) => void;
  onDelete: (channel: WhatsAppChannel) => void;
  onSetup: (channel: WhatsAppChannel) => void;
}

export default function WhatsAppChannelList({
  channels,
  agents,
  onToggle,
  onEdit,
  onDelete,
  onSetup,
}: Props) {
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name]));

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mb-4">
          <MessageSquareDashed className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Sin canales de WhatsApp
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 max-w-xs">
          Crea tu primer canal para conectar un número de WhatsApp Business con
          un agente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {channels.map((channel) => (
        <WhatsAppChannelCard
          key={channel.id}
          channel={channel}
          agentName={agentMap[channel.agent_id]}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetup={onSetup}
        />
      ))}
    </div>
  );
}
