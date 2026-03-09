import React, { useState, useEffect } from "react";
import type { Agent, FrequestQuestion, IconName, RAGConfig } from '@/types';
import AgentChat from './AgentChat';
import { Loader2 } from 'lucide-react';
import AgentFormGeneral from './AgentFormGeneral';
import AgentFormSources from './AgentFormSources';
import AgentFormIntegration from './AgentFormIntegration';
import AgentFormQuestions from './AgentFormQuestions';
import AgentFormTools from './AgentFormTools';
import AgentFormRAG from './AgentFormRAG';

interface AgentFormProps {
  agentToEdit: Agent | null;
  onSave: (agent: Omit<Agent, 'id'> | Agent) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const AgentForm: React.FC<AgentFormProps> = ({
  agentToEdit,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [agentData, setAgentData] = useState<Omit<Agent, 'id'>>({
    name: '',
    description: '',
    icon: 'Default',
    customPrompt: '',
    model: 'gemini-2.5-flash',
    temperature: 0.8,
    topK: 50,
    maxTokens: 2000,
    isPublic: true,
    tools: [],
    sub_agents: [],
    questions: [],
  });

  const [activeTab, setActiveTab] = useState<
    'general' | 'fuentes' | 'integracion' | 'preguntas' | 'tools' | 'rag'
  >('general');

  useEffect(() => {
    if (agentToEdit) {
      setAgentData(agentToEdit);
    } else {
      setAgentData({
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
        sub_agents: [],
        questions: [],
      });
    }
  }, [agentToEdit]);

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

  const handleQuestionsChange = (questions: FrequestQuestion[]) => {
    setAgentData((prev) => ({ ...prev, questions }));
  };

  const handleRAGConfigChange = (ragConfig: RAGConfig) => {
    setAgentData((prev) => ({ ...prev, ragConfig }));
  };

  const handlePresetChange = (preset: {
    temperature: number;
    topK: number;
    maxTokens: number;
  }) => {
    setAgentData((prev) => ({ ...prev, ...preset }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentToEdit) {
      onSave({ ...agentData, id: agentToEdit.id });
    } else {
      onSave(agentData);
    }
  };

  return (
    <div className="flex flex-row gap-3 h-full w-full max-w-7xl">
      {/* Configuracion */}
      <div className="flex flex-col min-h-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full flex-1">
          <div className="flex-shrink-0 flex space-x-2 mb-2 border-b pb-2">
            {(
              [
                'general',
                'fuentes',
                'tools',
                'rag',
                'integracion',
                'preguntas',
              ] as const
            ).map((tab) => {
              const requiresExisting =
                tab === 'fuentes' || tab === 'integracion';
              const disabled = requiresExisting && !agentToEdit;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => !disabled && setActiveTab(tab)}
                  disabled={disabled}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab === 'fuentes'
                    ? 'Fuentes'
                    : tab === 'integracion'
                      ? 'Integración'
                      : tab === 'preguntas'
                        ? 'Preguntas'
                        : tab === 'tools'
                          ? 'Capacidades'
                          : tab === 'rag'
                            ? 'RAG'
                            : 'General'}
                </button>
              );
            })}
          </div>

          {activeTab === 'general' && (
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
              <AgentFormGeneral
                agent={agentData}
                handleChange={handleChange}
                handlePresetChange={handlePresetChange}
              />
            </div>
          )}
          {activeTab === 'fuentes' && <AgentFormSources agent={agentToEdit} />}

          {activeTab === 'tools' && (
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
              <AgentFormTools
                agentId={agentToEdit?.id}
                assignedTools={agentData.tools || []}
                onToolsChange={(tools) =>
                  setAgentData((prev) => ({ ...prev, tools }))
                }
                assignedSubAgents={agentData.sub_agents || []}
                onSubAgentsChange={(sub_agents) =>
                  setAgentData((prev) => ({ ...prev, sub_agents }))
                }
              />
            </div>
          )}

          {activeTab === 'integracion' && (
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
              <AgentFormIntegration agentId={agentToEdit?.id} />)
            </div>
          )}

          {activeTab === 'preguntas' && (
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
              <AgentFormQuestions
                questions={agentData.questions || []}
                onQuestionsChange={handleQuestionsChange}
              />
            </div>
          )}

          {activeTab === 'rag' && (
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
              <AgentFormRAG
                agent={agentData}
                onRAGConfigChange={handleRAGConfigChange}
              />
            </div>
          )}

          <div className="flex-shrink-0 pt-2 border-t border-gray-200 w-full flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
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
      </div>
      {/* Agente Chat */}
      {agentToEdit && (
        <div className="border border-gray-200 rounded-lg p-4 flex flex-col min-h-0 w-xl">
          <AgentChat agent={agentToEdit} />
        </div>
      )}
    </div>
  );
};

export default AgentForm;
