"use client";

import { useState, useEffect } from 'react';
import { ScrollText, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { LogEntry, LastKey, Agent } from '@/types';
import { useLogs } from '@/lib/hooks/useLogs';

const fieldLabels: Record<keyof Agent, string> = {
  id: 'ID',
  name: 'Nombre',
  description: 'Descripción',
  icon: 'Icono',
  customPrompt: 'Master Prompt',
  model: 'Modelo',
  temperature: 'Temperatura',
  topK: 'Top K',
  maxTokens: 'Max Tokens',
  isPublic: 'Visibilidad',
  whatsappEnabled: 'Funciones de WhatsApp',
  tools: 'Herramientas',
  sub_agents: 'Sub-agentes',
  questions: 'Preguntas Frecuentes',
  ragConfig: 'RAG Config',
};

function ActionBadge({ action }: { action: LogEntry['action'] }) {
  const styles: Record<string, string> = {
    creado: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    editado: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    eliminado: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize tracking-wide ${styles[action] ?? 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400'}`}>
      {action}
    </span>
  );
}

function renderValue(value: unknown) {
  if (typeof value === 'boolean') {
    return <span className="text-sm text-gray-700 dark:text-gray-300">{value ? 'Público' : 'Privado'}</span>;
  }
  if (typeof value === 'string' && value.length > 100) {
    return <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{value}</pre>;
  }
  return <span className="text-sm text-gray-700 dark:text-gray-300">{String(value ?? 'N/A')}</span>;
}

function LogDetail({ log }: { log: LogEntry }) {
  const { action, previousState, currentState } = log;

  if (action === 'editado') {
    if (!previousState || !currentState) return null;
    const allKeys = Array.from(
      new Set([...Object.keys(previousState), ...Object.keys(currentState)])
    ) as (keyof Agent)[];
    const changedKeys = allKeys.filter(
      (key) => JSON.stringify(previousState[key]) !== JSON.stringify(currentState[key])
    );
    if (changedKeys.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No se detectaron cambios en los campos.</p>;
    }
    return (
      <div className="space-y-2.5">
        {changedKeys.map((key) => (
          <div key={key} className="rounded-lg border border-gray-100 dark:border-white/[0.07] overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.07]">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {fieldLabels[key] || key}
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-white/[0.06]">
              <div className="p-3 bg-red-50/60 dark:bg-red-500/[0.04]">
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1.5">Antes</p>
                {renderValue(previousState[key])}
              </div>
              <div className="p-3 bg-green-50/60 dark:bg-green-500/[0.04]">
                <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1.5">Después</p>
                {renderValue(currentState[key])}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const state = action === 'creado' ? currentState : previousState;
  if (!state) return <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No hay datos disponibles.</p>;
  return (
    <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {(Object.keys(state) as (keyof Agent)[]).map((key) => (
        <div key={key} className="flex items-start gap-4 py-2">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">
            {fieldLabels[key] || key}
          </span>
          <div className="flex-1 min-w-0">{renderValue(state[key])}</div>
        </div>
      ))}
    </div>
  );
}

export default function ChangelogPage() {
  const [limit, setLimit] = useState(10);
  const [lastKey, setLastKey] = useState<LastKey | null>(null);
  const [nextKey, setNextKey] = useState<LastKey | null>(null);
  const [history, setHistory] = useState<(LastKey | null)[]>([]);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useLogs(limit, lastKey);

  const logs = data?.items ?? [];
  const hasMore = data?.hasMore ?? false;

  useEffect(() => {
    setNextKey(data?.lastKey ?? null);
  }, [data]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(parseInt(e.target.value, 10));
    setLastKey(null);
    setHistory([]);
    setPage(1);
    setExpandedId(null);
  };

  const goNext = () => {
    if (!hasMore || !nextKey) return;
    setHistory((prev) => (prev.length < page ? [...prev, lastKey] : prev));
    setLastKey(nextKey);
    setPage((p) => p + 1);
    setExpandedId(null);
  };

  const goPrev = () => {
    if (page === 1) return;
    const newPage = page - 1;
    setLastKey(newPage === 1 ? null : history[newPage - 2]);
    setPage(newPage);
    setExpandedId(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Single card */}
      <div className="h-full bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden flex flex-col">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              Log de Cambios
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Historial de acciones realizadas sobre los agentes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Por página:
            </label>
            <select
              className="text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
              value={limit}
              onChange={handleLimitChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Table header */}
        <div className="flex-shrink-0 grid grid-cols-[2fr_1fr_3fr_2fr_2fr_auto] px-5 py-2.5 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02]">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Agente
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Acción
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Detalles
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Usuario
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Fecha
          </span>
          <span className="w-8" />
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400 dark:text-gray-500">
              Cargando registros...
            </div>
          )}

          {!isLoading && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
                <ScrollText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay cambios registrados todavía.
              </p>
            </div>
          )}

          {!isLoading &&
            logs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <div
                  key={log.id}
                  className="border-b border-gray-100 dark:border-white/[0.06] last:border-b-0"
                >
                  {/* Summary row */}
                  <div
                    className="grid grid-cols-[2fr_1fr_3fr_2fr_2fr_auto] items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-white truncate pr-3">
                      {log.agentName}
                    </span>
                    <span>
                      <ActionBadge action={log.action} />
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate pr-3">
                      {log.details}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate pr-3">
                      {log.user}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 pr-2">
                      {log.timestamp.toLocaleString('es-MX', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : log.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 py-4 bg-gray-50/60 dark:bg-white/[0.015] border-t border-gray-100 dark:border-white/[0.06]">
                      <LogDetail log={log} />
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Pagination footer */}
        {!isLoading && logs.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.01]">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Página {page}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={goPrev}
                disabled={page === 1}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <button
                onClick={goNext}
                disabled={!hasMore}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
