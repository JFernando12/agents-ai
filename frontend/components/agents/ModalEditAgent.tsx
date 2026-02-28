import React, { useState, useEffect } from 'react';
import type { Agent, FrequestQuestion, IconName } from '@/types';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import AgentChat from './AgentChat';
import AgentFormGeneral from './AgentFormGeneral';
import AgentFormSources from './AgentFormSources';
import AgentFormIntegration from './AgentFormIntegration';
import AgentFormQuestions from './AgentFormQuestions';
import AgentFormTools from './AgentFormTools';

type EditTab = 'general' | 'fuentes' | 'tools' | 'integracion' | 'preguntas';

const TAB_LABELS: Record<EditTab, string> = {
  general: 'General',
  fuentes: 'Fuentes',
  tools: 'Capacidades',
  integracion: 'Integración',
  preguntas: 'Preguntas',
};

const TABS: EditTab[] = ['general', 'fuentes', 'tools', 'integracion', 'preguntas'];

interface ModalEditAgentProps {
  isOpen: boolean;
  agent: Agent | null;
  onClose: () => void;
  onSave: (agent: Agent) => void;
  isLoading?: boolean;
}

const ModalEditAgent: React.FC<ModalEditAgentProps> = ({
  isOpen,
  agent,
  onClose,
  onSave,
  isLoading,
}) => {
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<EditTab>('general');

  useEffect(() => {
    if (agent) {
      setAgentData(agent);
      setActiveTab('general');
    }
  }, [agent]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const isNumberField = ['temperature', 'topK', 'topP', 'maxTokens'].includes(name);
    const isBooleanField = ['isPublic'].includes(name);

    setAgentData((prev) =>
      prev
        ? {
            ...prev,
            [name]: isBooleanField ? value === 'true' : isNumberField ? Number(value) : value,
          }
        : prev,
    );
  };

  const handleIconSelect = (iconName: IconName) => {
    setAgentData((prev) => (prev ? { ...prev, icon: iconName } : prev));
  };

  const handleQuestionsChange = (questions: FrequestQuestion[]) => {
    setAgentData((prev) => (prev ? { ...prev, questions } : prev));
  };

  const handlePresetChange = (preset: {
    temperature: number;
    topK: number;
    maxTokens: number;
  }) => {
    setAgentData((prev) => (prev ? { ...prev, ...preset } : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentData) {
      onSave(agentData);
    }
  };

  if (!agentData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Agente" size="full">
      {/* Two-column layout: form on the left, chat panel on the right (fixed width) */}
      <div className="flex flex-row gap-4 h-full w-full overflow-hidden">
        {/* Left column: tabs + form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-w-0 min-h-0 h-full"
        >
          {/* Tabs */}
          <div className="flex-shrink-0 flex flex-wrap gap-1 mb-3 border-b pb-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'general' && (
              <AgentFormGeneral
                agent={agentData}
                handleChange={handleChange}
                handleIconSelect={handleIconSelect}
                handlePresetChange={handlePresetChange}
              />
            )}
            {activeTab === 'fuentes' && <AgentFormSources agent={agent} />}
            {activeTab === 'tools' && (
              <AgentFormTools
                agentId={agentData.id}
                assignedTools={agentData.tools || []}
                onToolsChange={(tools) =>
                  setAgentData((prev) => (prev ? { ...prev, tools } : prev))
                }
                assignedSubAgents={agentData.sub_agents || []}
                onSubAgentsChange={(sub_agents) =>
                  setAgentData((prev) =>
                    prev ? { ...prev, sub_agents } : prev,
                  )
                }
              />
            )}
            {activeTab === 'integracion' && (
              <AgentFormIntegration agentId={agentData.id} />
            )}
            {activeTab === 'preguntas' && (
              <AgentFormQuestions
                questions={agentData.questions || []}
                onQuestionsChange={handleQuestionsChange}
              />
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex-shrink-0 pt-2 border-t border-gray-200 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
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
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {/* Right column: chat test panel — fixed width so it never shifts */}
        <div className="w-[400px] flex-shrink-0 border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
          <AgentChat agent={agentData} />
        </div>
      </div>
    </Modal>
  );
};

export default ModalEditAgent;
