'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DatabaseZap,
  BarChart3,
  Clock,
  Layers,
  Target,
  FileText,
  Loader2,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { useRAGTraces, useRAGMetrics } from '@/lib/hooks/useRAGTraces';
import { useAgents } from '@/lib/hooks/useAgents';
import type { RAGTrace, RAGMetrics } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';

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
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-white/[0.06]">
        {items.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="flex items-start gap-3 px-5 py-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 leading-none">
                {value}
              </p>
              {sub && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {metrics.evaluated_traces > 0 && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] px-5 py-3 flex items-center gap-6">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex-shrink-0">
            Evaluación &middot; {metrics.evaluated_traces} trazas
          </p>
          <div className="flex items-center gap-4">
            {metrics.avg_faithfulness != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Faithfulness</span>
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    metrics.avg_faithfulness >= 0.7
                      ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                      : metrics.avg_faithfulness >= 0.4
                        ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {(metrics.avg_faithfulness * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {metrics.avg_answer_relevance != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Relevancia</span>
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    metrics.avg_answer_relevance >= 0.7
                      ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                      : metrics.avg_answer_relevance >= 0.4
                        ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {(metrics.avg_answer_relevance * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {metrics.avg_context_precision != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">Precisión ctx.</span>
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    metrics.avg_context_precision >= 0.7
                      ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                      : metrics.avg_context_precision >= 0.4
                        ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {(metrics.avg_context_precision * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Trace row ─────────────────────────────────────────────────────────────────

function TraceRow({ trace, agentId }: { trace: RAGTrace; agentId: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/rag-traces/${trace.id}?agentId=${agentId}`)}
      className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.04] last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-medium text-gray-800 dark:text-gray-100">
          {trace.query}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {formatDate(trace.created_at)}
        </p>
      </div>
      <div className="text-center w-20 flex-shrink-0">
        <p className="text-[11px] text-gray-400 dark:text-gray-500">Chunks</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-white">
          {trace.chunks_used}
          <span className="text-gray-400 font-normal">/{trace.chunks_retrieved}</span>
        </p>
      </div>
      <div className="text-center w-20 flex-shrink-0">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">Score</p>
        <ScoreBadge value={trace.avg_score} />
      </div>
      <div className="text-center w-20 flex-shrink-0">
        <p className="text-[11px] text-gray-400 dark:text-gray-500">Latencia</p>
        <p
          className={`text-sm font-semibold ${trace.latency_ms > 2000 ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}
        >
          {trace.latency_ms < 1000 ? `${trace.latency_ms}ms` : `${(trace.latency_ms / 1000).toFixed(1)}s`}
        </p>
      </div>
      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
    </button>
  );
}

// ── Agent picker ──────────────────────────────────────────────────────────────

function AgentPicker() {
  const router = useRouter();
  const { data: agents, isLoading } = useAgents();

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        <PageHeader
          crumbs={[{ label: 'RAG Analytics' }]}
          subtitle="Selecciona un agente para ver sus métricas y trazas RAG."
        />

        <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-100 dark:border-white/[0.05] flex-shrink-0 bg-gray-50/60 dark:bg-white/[0.01]">
          <div className="w-8 flex-shrink-0" />
          <span className="flex-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Agente
          </span>
          <div className="w-6 flex-shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando agentes…
            </div>
          ) : !agents || agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
                <Bot className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sin agentes</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Crea un agente primero desde el Centro de Agentes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => router.push(`/rag-traces?agentId=${agent.id}`)}
                  className="group w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <DatabaseZap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {agent.name}
                    </p>
                    {agent.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {agent.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RAG Dashboard ─────────────────────────────────────────────────────────────

function RAGDashboard({ agentId }: { agentId: string }) {
  const { data: agents = [] } = useAgents();
  const agent = agents.find((a) => a.id === agentId);

  const { data: tracesData, isLoading: tracesLoading } = useRAGTraces(agentId);
  const { data: metrics, isLoading: metricsLoading } = useRAGMetrics(agentId);

  const traces = tracesData?.items ?? [];

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        <PageHeader
          crumbs={[
            { label: 'RAG Analytics', href: '/rag-traces' },
            { label: agent?.name ?? '…' },
          ]}
        />

        <div className="flex-1 overflow-auto">
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

          {metrics && metrics.top_documents.length > 0 && (
            <div className="border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-50/60 dark:bg-white/[0.01] border-b border-gray-100 dark:border-white/[0.05]">
                <FileText className="w-3 h-3 text-gray-400" />
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Documentos más consultados
                </p>
              </div>
              <div className="space-y-2 px-5 py-4">
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

          <div>
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/60 dark:bg-white/[0.01] sticky top-0 z-10">
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
                <div>
                  {traces.map((trace) => (
                    <TraceRow key={trace.id} trace={trace} agentId={agentId} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────

function RAGTracesContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');

  if (agentId) return <RAGDashboard agentId={agentId} />;
  return <AgentPicker />;
}

export default function RAGTracesPage() {
  return (
    <Suspense>
      <RAGTracesContent />
    </Suspense>
  );
}
