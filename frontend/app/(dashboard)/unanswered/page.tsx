'use client';

import { useState } from 'react';
import UnansweredQuestionItem from '@/components/unanswered/UnansweredItem';
import { useUnansweredQuestions } from '@/lib/hooks/useUnanswered';
import { useAgents } from '@/lib/hooks/useAgents';
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

  const selectClass = "px-2.5 py-1.5 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors";

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
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Cargando preguntas...</div>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <p className="text-lg font-medium">
                  No hay preguntas sin respuesta
                </p>
                <p className="text-sm mt-1">
                  {Object.keys(filters).length > 0
                    ? 'Intenta ajustar los filtros'
                    : 'Las preguntas que los agentes no puedan responder aparecerán aquí'}
                </p>
              </div>
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
