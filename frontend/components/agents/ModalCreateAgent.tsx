import React, { useState } from 'react';
import type { Agent, IconName } from '@/types';
import { Loader2 } from 'lucide-react';
import SlideOver from '../ui/SlideOver';
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
    <SlideOver
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo agente"
      subtitle="Configura el nombre, descripción, icono y prompt del agente"
      width="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          <AgentFormGeneral
            agent={agentData}
            handleChange={handleChange}
            handleIconSelect={handleIconSelect}
            handlePresetChange={handlePresetChange}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-white/[0.06] px-6 py-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Creando...' : 'Crear agente'}
          </button>
        </div>
      </form>
    </SlideOver>
  );
};

export default ModalCreateAgent;
