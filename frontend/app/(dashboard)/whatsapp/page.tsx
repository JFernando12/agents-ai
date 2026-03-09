'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { WhatsAppChannel, WhatsAppChannelCreate } from '@/types';
import { useAgents } from '@/lib/hooks/useAgents';
import {
  useWhatsAppChannels,
  useWhatsAppStats,
  useCreateWhatsAppChannel,
  useUpdateWhatsAppChannel,
  useDeleteWhatsAppChannel,
  useToggleWhatsAppChannel,
} from '@/lib/hooks/useWhatsApp';
import WhatsAppStats from '@/components/whatsapp/WhatsAppStats';
import WhatsAppChannelList from '@/components/whatsapp/WhatsAppChannelList';
import ModalCreateChannel from '@/components/whatsapp/ModalCreateChannel';
import ModalEditChannel from '@/components/whatsapp/ModalEditChannel';
import WhatsAppChannelSetupGuide from '@/components/whatsapp/WhatsAppChannelSetupGuide';
import ModalDelete from '@/components/ui/ModalDelete';

export default function WhatsAppPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<WhatsAppChannel | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<WhatsAppChannel | null>(null);
  const [newChannelForSetup, setNewChannelForSetup] = useState<WhatsAppChannel | null>(null);

  const { data: channels = [], isLoading: loadingChannels } = useWhatsAppChannels();
  const { data: stats, isLoading: loadingStats } = useWhatsAppStats();
  const { data: agents = [] } = useAgents();

  const createChannel = useCreateWhatsAppChannel();
  const updateChannel = useUpdateWhatsAppChannel();
  const deleteChannel = useDeleteWhatsAppChannel();
  const toggleChannel = useToggleWhatsAppChannel();

  const handleCreate = async (data: WhatsAppChannelCreate) => {
    const created = await createChannel.mutateAsync(data);
    setIsCreateOpen(false);
    setNewChannelForSetup(created);
  };

  const handleUpdate = async (data: WhatsAppChannelCreate) => {
    if (!editingChannel) return;
    await updateChannel.mutateAsync({ id: editingChannel.id, data });
    setEditingChannel(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingChannel) return;
    await deleteChannel.mutateAsync(deletingChannel.id);
    setDeletingChannel(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">WhatsApp</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Conecta números de WhatsApp Business con tus agentes de IA
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo canal
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <WhatsAppStats stats={stats} isLoading={loadingStats} />

          {loadingChannels ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : (
            <WhatsAppChannelList
              channels={channels}
              agents={agents}
              onToggle={(id) => toggleChannel.mutate(id)}
              onEdit={setEditingChannel}
              onDelete={setDeletingChannel}
            />
          )}

          {/* Setup guide shown right after channel creation */}
          {newChannelForSetup && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Canal creado: {newChannelForSetup.name}
                </p>
                <button
                  onClick={() => setNewChannelForSetup(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Cerrar
                </button>
              </div>
              <WhatsAppChannelSetupGuide
                channelId={newChannelForSetup.id}
                verifyToken={newChannelForSetup.verify_token}
              />
            </div>
          )}
        </div>
      </div>

      <ModalCreateChannel
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreate}
        agents={agents}
        isLoading={createChannel.isPending}
      />

      <ModalEditChannel
        isOpen={!!editingChannel}
        onClose={() => setEditingChannel(null)}
        onSave={handleUpdate}
        agents={agents}
        channel={editingChannel}
        isLoading={updateChannel.isPending}
      />

      <ModalDelete
        isOpen={!!deletingChannel}
        onClose={() => setDeletingChannel(null)}
        onSave={handleConfirmDelete}
        isLoading={deleteChannel.isPending}
      />
    </div>
  );
}
