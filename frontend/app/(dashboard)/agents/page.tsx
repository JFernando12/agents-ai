'use client';

import { useState } from 'react';
import { Agent } from '@/types';
import AgentList from '@/components/agents/AgentList';
import { Plus } from 'lucide-react';
import { useCreateAgent, useDeleteAgent } from '@/lib/hooks/useAgents';
import ModalDelete from '@/components/ui/ModalDelete';
import ModalCreateAgent from '@/components/agents/ModalCreateAgent';

export default function AgentsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();

  const handleSaveCreate = async (newAgent: Omit<Agent, 'id'>) => {
    await createAgent.mutateAsync(newAgent);
    setIsCreateModalOpen(false);
  };

  const handleDelete = (agent: Agent) => {
    setAgentToDelete(agent);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!agentToDelete) return;
    await deleteAgent.mutateAsync(agentToDelete.id);
    setIsDeleteModalOpen(false);
    setAgentToDelete(null);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Page header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Centro de Agentes
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Crea y gestiona tus agentes de IA
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo agente
        </button>
      </div>

      {/* Content card */}
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.05] flex-shrink-0">
          <div className="w-9 flex-shrink-0" />
          <span className="flex-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Agente
          </span>
          <span className="hidden sm:block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-24 text-right">
            Modelo
          </span>
          <div className="w-20 flex-shrink-0" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <AgentList onDelete={handleDelete} />
        </div>
      </div>

      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSave={handleConfirmDelete}
        isLoading={deleteAgent.isPending}
      />
      <ModalCreateAgent
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveCreate}
        isLoading={createAgent.isPending}
      />
    </div>
  );
}
