"use client";

import { useState } from "react";

import { Agent } from "@/types";
import AgentList from "./AgentList";
import { PlusIcon } from './icons';
import {
  useCreateAgent,
  useDeleteAgent,
  useUpdateAgent,
} from '@/lib/hooks/useAgents';
import ModalDelete from './ModalDelete';
import ModalCreateAgent from './ModalCreateAgent';
import ModalEditAgent from './ModalEditAgent';

const AgentDashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleSaveCreate = async (newAgent: Omit<Agent, 'id'>) => {
    await createAgent.mutateAsync(newAgent);
    setIsCreateModalOpen(false);
  };

  const handleEdit = (agent: Agent) => {
    setIsEditModalOpen(true);
    setSelectedAgent(agent);
  };

  const handleSaveEdit = async (newAgent: Agent) => {
    await updateAgent.mutateAsync({
      id: newAgent.id,
      agentData: newAgent as Omit<Agent, 'id'>,
    });
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAgent(null);
  };

  const handleDelete = async (agent: Agent) => {
    setIsDeleteModalOpen(true);
    setAgentToDelete(agent);
  };

  const handleSaveDelete = async () => {
    if (!agentToDelete) return;
    await deleteAgent.mutateAsync(agentToDelete.id);
    handleCloseDeleteModal();
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAgentToDelete(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
      <div className="bg-white px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl text-gray-600">Todos los agentes</h2>
          <button
            onClick={handleCreate}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Crear Nuevo Agente
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AgentList onEdit={handleEdit} onDelete={handleDelete} />
      </div>
      {/* Modal de Creacion de Agente */}
      <ModalCreateAgent
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveCreate}
        isLoading={createAgent.isPending}
      />
      {/* Modal de editar Agente */}
      <ModalEditAgent
        isOpen={isEditModalOpen}
        agent={selectedAgent}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        isLoading={updateAgent.isPending}
      />
      {/* Modal de eliminar Agente */}
      <ModalDelete
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onSave={handleSaveDelete}
        isLoading={deleteAgent.isPending}
      />
    </div>
  );
};

export default AgentDashboard;
