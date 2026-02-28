'use client';

import { useState } from 'react';
import UnansweredQuestionItem from '@/components/unanswered/UnansweredItem';
import { useUnansweredQuestions } from '@/lib/hooks/useUnanswered';
import { useAgents } from '@/lib/hooks/useAgents';
import { MessageCircleQuestion, Loader2 } from 'lucide-react';
import type { UnansweredFilters } from '@/types';

export default function UnansweredPage() {
  const [filters, setFilters] = useState<UnansweredFilters>({});

  const {
    data: questions = [],
    isLoading,
    error,
  } = useUnansweredQuestions(filters);
  const { data: agents = [] } = useAgents();

  const handleFilterChange = (key: keyof UnansweredFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error al cargar las preguntas</p>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  const selectClass =
    'px-2.5 py-1.5 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors';

  return (
    <div className="flex flex-col h-full">
      {/* Single card */}
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              Sin Respuesta
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Preguntas que los agentes no pudieron responder.
            </p>
          </div>
        </div>

        {/* Filters row */}
        <div className="px-5 py-2.5 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={selectClass}
            >
              <option value="">Estado: Todos</option>
              <option value="pending">Pendiente</option>
              <option value="reviewed">Revisado</option>
              <option value="resolved">Resuelto</option>
              <option value="dismissed">Descartado</option>
            </select>

            <select
              value={filters.agentId || ''}
              onChange={(e) => handleFilterChange('agentId', e.target.value)}
              className={`${selectClass} max-w-[160px]`}
            >
              <option value="">Agente: Todos</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>

            <select
              value={
                filters.wasFedToAgent === undefined
                  ? ''
                  : filters.wasFedToAgent
                    ? 'true'
                    : 'false'
              }
              onChange={(e) =>
                handleFilterChange(
                  'wasFedToAgent',
                  e.target.value === '' ? undefined : e.target.value === 'true',
                )
              }
              className={selectClass}
            >
              <option value="">Info: Todos</option>
              <option value="true">Con info</option>
              <option value="false">Sin info</option>
            </select>

            {(filters.status ||
              filters.agentId ||
              filters.wasFedToAgent !== undefined) && (
              <button
                onClick={() => setFilters({})}
                className="px-2 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors"
                title="Limpiar filtros"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full gap-2 text-sm text-gray-400 dark:text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando
              escalaciones...
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
                <MessageCircleQuestion className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {Object.keys(filters).length > 0
                  ? 'Ninguna escalación coincide con los filtros.'
                  : 'No hay escalaciones pendientes.'}
              </p>
              {Object.keys(filters).length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Las preguntas que los agentes no puedan responder aparecerán
                  aquí.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {questions.map((question) => (
                <UnansweredQuestionItem key={question.id} question={question} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
