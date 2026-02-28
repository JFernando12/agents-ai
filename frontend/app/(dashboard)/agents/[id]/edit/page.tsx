'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Loader2, Settings, Database, Wrench, Plug, HelpCircle, Save } from 'lucide-react';
import type { Agent, FrequestQuestion, IconName } from '@/types';
import { useAgents, useUpdateAgent } from '@/lib/hooks/useAgents';
import AgentChat from '@/components/agents/AgentChat';
import AgentFormGeneral from '@/components/agents/AgentFormGeneral';
import AgentFormSources from '@/components/agents/AgentFormSources';
import AgentFormIntegration from '@/components/agents/AgentFormIntegration';
import AgentFormQuestions from '@/components/agents/AgentFormQuestions';
import AgentFormTools from '@/components/agents/AgentFormTools';
import { AgentIcon } from '@/components/agents/AgentIcon';

type EditTab = 'general' | 'fuentes' | 'tools' | 'integracion' | 'preguntas';

const TABS: { id: EditTab; label: string; icon: React.ElementType }[] = [
  { id: 'general',     label: 'General',     icon: Settings   },
  { id: 'fuentes',     label: 'Fuentes',     icon: Database   },
  { id: 'tools',       label: 'Capacidades', icon: Wrench     },
  { id: 'integracion', label: 'Integración', icon: Plug       },
  { id: 'preguntas',   label: 'Preguntas',   icon: HelpCircle },
];

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: agents } = useAgents();
  const updateAgent = useUpdateAgent();

  const source = agents?.find((a) => a.id === id) ?? null;
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<EditTab>('general');

  useEffect(() => {
    if (source && !agentData) setAgentData(source);
  }, [source]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNum = ['temperature', 'topK', 'topP', 'maxTokens'].includes(name);
    const isBool = ['isPublic'].includes(name);
    setAgentData((prev) => prev ? { ...prev, [name]: isBool ? value === 'true' : isNum ? Number(value) : value } : prev);
  };

  const handleIconSelect = (iconName: IconName) =>
    setAgentData((prev) => (prev ? { ...prev, icon: iconName } : prev));

  const handleQuestionsChange = (questions: FrequestQuestion[]) =>
    setAgentData((prev) => (prev ? { ...prev, questions } : prev));

  const handlePresetChange = (preset: { temperature: number; topK: number; maxTokens: number }) =>
    setAgentData((prev) => (prev ? { ...prev, ...preset } : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentData) return;
    await updateAgent.mutateAsync({ id: agentData.id, agentData: agentData as Omit<Agent, 'id'> });
    router.push('/agents');
  };

  if (!agentData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl">
        {/* Row 1: breadcrumb + agent name + actions */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.06]">
          <button
            onClick={() => router.push('/agents')}
            className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Agentes
          </button>
          <span className="text-gray-200 dark:text-gray-700">/</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <AgentIcon name={agentData.icon} className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{agentData.name}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => router.push('/agents')}
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-agent-form"
              disabled={updateAgent.isPending}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {updateAgent.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {updateAgent.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
        {/* Row 2: tabs */}
        <div className="flex px-3">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 flex gap-3">

        {/* Form */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <form
            id="edit-agent-form"
            onSubmit={handleSubmit}
            className="h-full overflow-y-auto px-6 py-5 custom-scrollbar"
          >
            {activeTab === 'general' && (
              <AgentFormGeneral
                agent={agentData}
                handleChange={handleChange}
                handleIconSelect={handleIconSelect}
                handlePresetChange={handlePresetChange}
              />
            )}
            {activeTab === 'fuentes' && <AgentFormSources agent={source} />}
            {activeTab === 'tools' && (
              <AgentFormTools
                agentId={agentData.id}
                assignedTools={agentData.tools || []}
                onToolsChange={(tools) => setAgentData((prev) => (prev ? { ...prev, tools } : prev))}
                assignedSubAgents={agentData.sub_agents || []}
                onSubAgentsChange={(sub_agents) => setAgentData((prev) => (prev ? { ...prev, sub_agents } : prev))}
              />
            )}
            {activeTab === 'integracion' && <AgentFormIntegration agentId={agentData.id} />}
            {activeTab === 'preguntas' && (
              <AgentFormQuestions
                questions={agentData.questions || []}
                onQuestionsChange={handleQuestionsChange}
              />
            )}
          </form>
        </div>

        {/* Chat panel */}
        <div className="w-[300px] flex-shrink-0 flex flex-col min-h-0 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Probar agente</span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AgentChat agent={agentData} />
          </div>
        </div>

      </div>
    </div>
  );
}
