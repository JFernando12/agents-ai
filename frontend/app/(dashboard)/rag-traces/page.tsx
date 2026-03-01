'use client';

import { useState } from 'react';
import {
  DatabaseZap,
  BarChart3,
  Clock,
  Layers,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useRAGTraces, useRAGMetrics } from '@/lib/hooks/useRAGTraces';
import { useAgents } from '@/lib/hooks/useAgents';
import type { RAGTrace, RAGMetrics } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function scoreColor(score: number): string {
  if (score >= 0.75) return 'text-green-600 dark:text-green-400';
  if (score >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-500 dark:text-red-400';
}

function ScoreBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 75
      ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
      : pct >= 50
        ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
        : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${color}`}>
      {pct}%
    </span>
  );
}

// ── Metrics strip ─────────────────────────────────────────────────────────────

function MetricsStrip({ metrics }: { metrics: RAGMetrics }) {
  const items = [
    {
      label: 'Total consultas',
      value: metrics.total_queries,
      sub: undefined as string | undefined,
      icon: BarChart3,
      color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Hit Rate',
      value: `${Math.round(metrics.hit_rate * 100)}%`,
      sub: `${metrics.queries_with_results} con resultados`,
      icon: Target,
      color:
        metrics.hit_rate >= 0.8
          ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
          : metrics.hit_rate >= 0.5
            ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
    },
    {
      label: 'Score promedio',
      value: `${Math.round(metrics.avg_score * 100)}%`,
      sub: `${metrics.avg_chunks_used.toFixed(1)} chunks/consulta`,
      icon: Layers,
      color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Latencia promedio',
      value:
        metrics.avg_latency_ms < 1000
          ? `${Math.round(metrics.avg_latency_ms)}ms`
          : `${(metrics.avg_latency_ms / 1000).toFixed(1)}s`,
      sub: undefined as string | undefined,
      icon: Clock,
      color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-white/[0.06]">
      {items.map(({ label, value, sub, icon: Icon, color }) => (
        <div key={label} className="flex items-start gap-3 px-5 py-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 leading-none">{value}</p>
            {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Trace row ─────────────────────────────────────────────────────────────────

function TraceRow({ trace }: { trace: RAGTrace }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-white/[0.04] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        {/* Query */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{trace.query}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(trace.created_at)}</p>
        </div>

        {/* Chunks */}
        <div className="text-center w-20 flex-shrink-0">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Chunks</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            {trace.chunks_used}
            <span className="text-gray-400 font-normal">/{trace.chunks_retrieved}</span>
          </p>
        </div>

        {/* Score */}
        <div className="text-center w-20 flex-shrink-0">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Score</p>
          <ScoreBadge value={trace.avg_score} />
        </div>

        {/* Latency */}
        <div className="text-center w-20 flex-shrink-0">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Latencia</p>
          <p className={`text-sm font-semibold ${trace.latency_ms > 2000 ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
            {trace.latency_ms < 1000
              ? `${trace.latency_ms}ms`
              : `${(trace.latency_ms / 1000).toFixed(1)}s`}
          </p>
        </div>

        {/* Expand */}
        <div className="flex-shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div className="px-5 pb-4 space-y-3 bg-gray-50/60 dark:bg-white/[0.02]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Score máx.</p>
              <p className={`text-sm font-semibold mt-0.5 ${scoreColor(trace.max_score)}`}>
                {Math.round(trace.max_score * 100)}%
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Score mín.</p>
              <p className={`text-sm font-semibold mt-0.5 ${scoreColor(trace.min_score)}`}>
                {Math.round(trace.min_score * 100)}%
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Top-K solicitado</p>
              <p className="text-sm font-semibold mt-0.5 text-gray-800 dark:text-white">
                {trace.top_k_requested}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Score threshold</p>
              <p className="text-sm font-semibold mt-0.5 text-gray-800 dark:text-white">
                {trace.score_threshold != null
                  ? `${Math.round(trace.score_threshold * 100)}%`
                  : '—'}
              </p>
            </div>
          </div>

          {trace.documents_hit.length > 0 && (
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Documentos usados</p>
              <div className="flex flex-wrap gap-1.5">
                {trace.documents_hit.map((doc) => (
                  <span
                    key={doc}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                  >
                    <FileText className="w-3 h-3" />
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Modelo embedding</p>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-300">{trace.embedding_model}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RAGTracesPage() {
  const { data: agents = [] } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const agentId = selectedAgentId || null;

  const { data: tracesData, isLoading: tracesLoading } = useRAGTraces(agentId);
  const { data: metrics, isLoading: metricsLoading } = useRAGMetrics(agentId);

  const traces = tracesData?.items ?? [];

  const selectClass =
    'px-2.5 py-1.5 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors';

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">RAG Analytics</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Observabilidad y calidad del sistema de recuperación de conocimiento.
            </p>
          </div>
        </div>

        {/* Filters row */}
        <div className="px-5 py-2 border-b border-gray-100 dark:border-white/[0.05] flex-shrink-0 bg-gray-50/60 dark:bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className={`${selectClass} max-w-[200px]`}
            >
              <option value="">Agente: Todos</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {!agentId ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
                <DatabaseZap className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Selecciona un agente para ver sus métricas RAG
              </p>
            </div>
          ) : (
            <>
              {/* Metrics strip */}
              {metricsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400 dark:text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando métricas...
                </div>
              ) : metrics ? (
                <div className="border-b border-gray-100 dark:border-white/[0.06]">
                  <MetricsStrip metrics={metrics} />
                </div>
              ) : null}

              {/* Top documents */}
              {metrics && metrics.top_documents.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 mb-3">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Documentos más consultados
                    </p>
                  </div>
                  <div className="space-y-2">
                    {metrics.top_documents.map(({ document, hits }, idx) => {
                      const maxHits = metrics.top_documents[0]?.hits ?? 1;
                      const pct = Math.round((hits / maxHits) * 100);
                      return (
                        <div key={document} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-mono w-4 flex-shrink-0 text-right">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                {document}
                              </span>
                              <span className="text-xs font-semibold text-gray-500 ml-2 flex-shrink-0">
                                {hits}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full">
                              <div
                                className="h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Traces section */}
              <div>
                {/* Section header */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/60 dark:bg-white/[0.01]">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Trazas recientes
                  </p>
                  {traces.length > 0 && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {traces.length} registros
                    </span>
                  )}
                </div>

                {tracesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400 dark:text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando trazas...
                  </div>
                ) : traces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
                      <DatabaseZap className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Sin trazas RAG para este agente
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 opacity-70">
                        Las trazas se generan cuando el agente usa la herramienta de búsqueda en KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Table column headers */}
                    <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/60 dark:bg-white/[0.01]">
                      <p className="flex-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Consulta
                      </p>
                      <p className="w-20 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Chunks
                      </p>
                      <p className="w-20 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Score
                      </p>
                      <p className="w-20 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Latencia
                      </p>
                      <div className="w-4" />
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                      {traces.map((trace) => (
                        <TraceRow key={trace.id} trace={trace} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
