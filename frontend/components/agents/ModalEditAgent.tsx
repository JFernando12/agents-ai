import React, { useState, useEffect } from 'react';
import type { Agent, FrequestQuestion, IconName } from '@/types';
import { Loader2 } from 'lucide-react';
import SlideOver from '../ui/SlideOver';
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

const TABS: EditTab[] = [
  'general',
  'fuentes',
  'tools',
  'integracion',
  'preguntas',
];

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const isNumberField = ['temperature', 'topK', 'topP', 'maxTokens'].includes(
      name,
    );
    const isBooleanField = ['isPublic'].includes(name);

    setAgentData((prev) =>
      prev
        ? {
            ...prev,
            [name]: isBooleanField
              ? value === 'true'
              : isNumberField
                ? Number(value)
                : value,
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
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={agentData.name}
      subtitle="Editar configuración del agente"
      width="xl"
    >
      {/* Two-column layout: form on the left, chat panel on the right */}
      <div className="flex flex-row h-full min-h-0">
        {/* Left column: tabs + form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-w-0 min-h-0 h-full"
        >
          {/* Tabs */}
          <div className="flex-shrink-0 flex flex-wrap gap-1 px-6 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 custom-scrollbar">
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
          <div className="flex-shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
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
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>

        {/* Right column: chat test panel */}
        <div className="w-[360px] flex-shrink-0 border-l border-gray-100 dark:border-white/[0.06] flex flex-col min-h-0">
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Probar agente
            </p>
          </div>
          <div className="flex-1 min-h-0 px-4 pb-4">
            <AgentChat agent={agentData} />
          </div>
        </div>
      </div>
    </SlideOver>
  );
};

export default ModalEditAgent;
