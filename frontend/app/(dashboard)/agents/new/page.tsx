'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Agent } from '@/types';
import { useCreateAgent } from '@/lib/hooks/useAgents';
import AgentFormGeneral from '@/components/agents/AgentFormGeneral';

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

export default function NewAgentPage() {
  const router = useRouter();
  const createAgent = useCreateAgent();
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

  const handlePresetChange = (preset: {
    temperature: number;
    topK: number;
    maxTokens: number;
  }) => {
    setAgentData((prev) => ({ ...prev, ...preset }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAgent.mutateAsync(agentData);
    router.push('/agents');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/agents')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a agentes
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Nuevo agente
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Configura el nombre, descripción, prompt y parámetros del agente.
        </p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl">
          <div className="px-6 py-6">
            <AgentFormGeneral
              agent={agentData}
              handleChange={handleChange}
              handlePresetChange={handlePresetChange}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => router.push('/agents')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createAgent.isPending || !agentData.name.trim()}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createAgent.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {createAgent.isPending ? 'Creando...' : 'Crear agente'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
