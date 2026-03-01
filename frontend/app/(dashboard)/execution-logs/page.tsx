'use client';

import { useState } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
  Wrench,
  MessageSquare,
  Bot,
  Search,
  X,
} from 'lucide-react';
import { useExecutionTraces } from '@/lib/hooks/useExecutionTraces';
import { useAgents } from '@/lib/hooks/useAgents';
import type { ExecutionTrace, ToolCallTrace } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toolIcon(toolName: string) {
  if (toolName === 'search_knowledge_base') return Search;
  if (toolName.startsWith('sub_')) return Bot;
  return Wrench;
}

// ── Tool call row (inside detail panel) ──────────────────────────────────────

function ToolCallRow({ tc, index }: { tc: ToolCallTrace; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = toolIcon(tc.tool_name);

  return (
    <div className="border-b border-gray-100 dark:border-white/[0.05] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group"
      >
        <span className="text-[11px] font-mono text-gray-300 dark:text-gray-600 w-4 flex-shrink-0">
          {index + 1}
        </span>
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
            tc.success
              ? 'bg-indigo-50 dark:bg-indigo-500/10'
              : 'bg-red-50 dark:bg-red-500/10'
          }`}
        >
          <Icon
            className={`w-3 h-3 ${
              tc.success
                ? 'text-indigo-500 dark:text-indigo-400'
                : 'text-red-500 dark:text-red-400'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
            {tc.tool_name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {tc.success ? (
            <CheckCircle className="w-3 h-3 text-emerald-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-400" />
          )}
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            iter {tc.iteration}
          </span>
          <ChevronRight
            className={`w-3.5 h-3.5 text-gray-300 dark:text-gray-600 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2.5 bg-gray-50/60 dark:bg-black/10">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1">
              Input
            </p>
            <pre className="text-[11px] text-gray-600 dark:text-gray-400 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/[0.06] rounded-md p-2.5 whitespace-pre-wrap break-all overflow-hidden">
              {JSON.stringify(tc.input, null, 2)}
            </pre>
          </div>
          {tc.success && tc.output && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1">
                Output
              </p>
              <pre className="text-[11px] text-gray-600 dark:text-gray-400 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/[0.06] rounded-md p-2.5 whitespace-pre-wrap break-all overflow-y-auto max-h-60">
                {tc.output}
              </pre>
            </div>
          )}
          {!tc.success && tc.error && (
            <div>
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                Error
              </p>
              <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-md p-2.5">
                {tc.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Detail panel (right column) ───────────────────────────────────────────────

function ExecutionDetail({
  trace,
  onClose,
}: {
  trace: ExecutionTrace;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Detail header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {trace.agent_name}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{trace.user}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable detail body */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300">
            <Clock className="w-3 h-3" />
            {formatDuration(trace.duration_ms)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
              trace.was_answered
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
            }`}
          >
            {trace.was_answered ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {trace.was_answered ? 'Respondido' : 'Sin respuesta'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-3 h-3" />
            {trace.total_iterations} iter.
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
            {formatDate(trace.created_at)}
          </span>
        </div>

        {/* User message */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-3 h-3 text-gray-400" />
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Mensaje
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] px-4 py-3 overflow-hidden">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">
              {trace.user_message}
            </p>
          </div>
        </div>

        {/* Tool calls */}
        {trace.tool_calls.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Wrench className="w-3 h-3 text-gray-400" />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Tools ({trace.tool_calls.length})
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-white/[0.06] overflow-hidden">
              {trace.tool_calls.map((tc, i) => (
                <ToolCallRow key={tc.tool_use_id} tc={tc} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Final response */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Bot className="w-3 h-3 text-indigo-500" />
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Respuesta
            </p>
          </div>
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/[0.05] border border-indigo-100 dark:border-indigo-500/20 px-4 py-3 overflow-hidden">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
              {trace.final_response}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trace row (list) ──────────────────────────────────────────────────────────

function TraceRow({
  trace,
  isSelected,
  compact,
  onClick,
}: {
  trace: ExecutionTrace;
  isSelected: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-500/[0.07]'
          : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
      }`}
    >
      {/* status icon */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-white/[0.05]">
        {trace.was_answered ? (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-amber-500" />
        )}
      </div>

      {/* main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p
            className={`text-sm font-medium truncate transition-colors ${
              isSelected
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
            }`}
          >
            {trace.user_message}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-indigo-500 dark:text-indigo-400">{trace.agent_name}</span>
          <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{trace.user}</span>
        </div>
      </div>

      {/* right side metadata */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {!compact && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {formatDate(trace.created_at)}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {trace.tool_calls.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500">
              <Wrench className="w-2.5 h-2.5" />
              {trace.tool_calls.length}
            </span>
          )}
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {formatDuration(trace.duration_ms)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExecutionLogsPage() {
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [selectedTrace, setSelectedTrace] = useState<ExecutionTrace | null>(null);

  const { data, isLoading, error } = useExecutionTraces(agentFilter || null);
  const { data: agents = [] } = useAgents();

  const traces = data?.items ?? [];

  const selectClass =
    'px-2.5 py-1.5 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors';

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">Ejecuciones</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Historial de ejecuciones con tools utilizadas por cada agente.
            </p>
          </div>
        </div>

        {/* Filters row */}
        <div className="px-5 py-2 border-b border-gray-100 dark:border-white/[0.05] flex-shrink-0 bg-gray-50/60 dark:bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setSelectedTrace(null);
              }}
              className={`${selectClass} max-w-[200px]`}
            >
              <option value="">Agente: Todos</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Two-panel body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* Left — list */}
          <div
            className={`flex flex-col overflow-x-hidden overflow-y-auto transition-all duration-200 ${
              selectedTrace ? 'w-[46%] border-r border-gray-100 dark:border-white/[0.06]' : 'w-full'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-red-500">Error al cargar las ejecuciones</p>
              </div>
            ) : traces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No hay ejecuciones registradas aún
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.04] w-full">
                {traces.map((trace) => (
                  <TraceRow
                    key={trace.id}
                    trace={trace}
                    isSelected={selectedTrace?.id === trace.id}
                    compact={!!selectedTrace}
                    onClick={() =>
                      setSelectedTrace((prev) => (prev?.id === trace.id ? null : trace))
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right — detail */}
          {selectedTrace && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <ExecutionDetail
                trace={selectedTrace}
                onClose={() => setSelectedTrace(null)}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
