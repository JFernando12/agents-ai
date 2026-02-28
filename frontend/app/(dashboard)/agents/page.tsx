'use client';

import { useState } from 'react';
import { Agent } from '@/types';
import AgentList from '@/components/agents/AgentList';
import { PlusIcon } from '@/components/ui/icons';
import {
  useCreateAgent,
  useDeleteAgent,
  useUpdateAgent,
} from '@/lib/hooks/useAgents';
import ModalDelete from '@/components/ui/ModalDelete';
import ModalCreateAgent from '@/components/agents/ModalCreateAgent';
import ModalEditAgent from '@/components/agents/ModalEditAgent';

export default function AgentsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const handleCreate = () => setIsCreateModalOpen(true);

  const handleSaveCreate = async (newAgent: Omit<Agent, 'id'>) => {
    await createAgent.mutateAsync(newAgent);
    setIsCreateModalOpen(false);
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updated: Agent) => {
    await updateAgent.mutateAsync({
      id: updated.id,
      agentData: updated as Omit<Agent, 'id'>,
    });
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAgent(null);
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
    <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-sm h-full flex flex-col">
      <div className="px-6 py-5 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Todos los agentes
          </h2>
          <button
            onClick={handleCreate}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Crear Nuevo Agente
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AgentList onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <ModalCreateAgent
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveCreate}
        isLoading={createAgent.isPending}
      />
      <ModalEditAgent
        isOpen={isEditModalOpen}
        agent={selectedAgent}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        isLoading={updateAgent.isPending}
      />
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSave={handleConfirmDelete}
        isLoading={deleteAgent.isPending}
      />
    </div>
  );
}
