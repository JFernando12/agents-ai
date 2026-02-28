import React, { useState } from 'react';
import type { Agent, IconName } from '@/types';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import AgentFormGeneral from './AgentFormGeneral';

const DEFAULT_AGENT: Omit<Agent, 'id'> = {
  name: '',
  description: '',
  icon: 'Default',
  customPrompt: '',
  model: 'claude-haiku-3.5',
  temperature: 0.8,
  topK: 50,
  maxTokens: 2000,
  isPublic: true,
  tools: [],
  questions: [],
};

interface ModalCreateAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Omit<Agent, 'id'>) => void;
  isLoading?: boolean;
}

const ModalCreateAgent: React.FC<ModalCreateAgentProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [agentData, setAgentData] = useState<Omit<Agent, 'id'>>(DEFAULT_AGENT);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const isNumberField = ['temperature', 'topK', 'maxTokens'].includes(name);
    const isBooleanField = ['isPublic'].includes(name);

    setAgentData((prev) => ({
      ...prev,
      [name]: isBooleanField
        ? value === 'true'
        : isNumberField
          ? Number(value)
          : value,
    }));
  };

  const handleIconSelect = (iconName: IconName) => {
    setAgentData((prev) => ({ ...prev, icon: iconName }));
  };

  const handlePresetChange = (preset: {
    temperature: number;
    topK: number;
    maxTokens: number;
  }) => {
    setAgentData((prev) => ({ ...prev, ...preset }));
  };

  const handleClose = () => {
    setAgentData(DEFAULT_AGENT);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(agentData);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Agente">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-2xl"
      >
        <div className="overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
          <AgentFormGeneral
            agent={agentData}
            handleChange={handleChange}
            handleIconSelect={handleIconSelect}
            handlePresetChange={handlePresetChange}
          />
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Creando...' : 'Crear Agente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalCreateAgent;
