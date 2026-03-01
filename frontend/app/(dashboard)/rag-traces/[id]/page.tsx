'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Loader2,
  DatabaseZap,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { useRAGTrace } from '@/lib/hooks/useRAGTraces';
import { useAgents } from '@/lib/hooks/useAgents';
import { PageHeader } from '@/components/ui/PageHeader';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-semibold ${color}`}>
      {pct}%
    </span>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="text-sm text-gray-800 dark:text-gray-100">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RAGTraceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const agentIdParam = searchParams.get('agentId');

  const { data: trace, isLoading } = useRAGTrace(id);
  const { data: agents = [] } = useAgents();

  const agentId = trace?.agent_id ?? agentIdParam ?? '';
  const agent = agents.find((a) => a.id === agentId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando traza...
        </div>
      </div>
    );
  }

  if (!trace) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
          <DatabaseZap className="w-5 h-5 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">Traza no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        <PageHeader
          crumbs={[
            { label: 'RAG Analytics', href: '/rag-traces' },
            { label: agent?.name ?? '…', href: `/rag-traces?agentId=${agentId}` },
            { label: 'Detalle de traza' },
          ]}
          subtitle={formatDate(trace.created_at)}
        />

        <div className="flex-1 overflow-auto">
          {/* Query */}
          <div className="px-5 py-5 border-b border-gray-100 dark:border-white/[0.06]">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Consulta
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
              {trace.query}
            </p>
            {trace.rewritten_query && (
              <div className="mt-3 rounded-lg border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/[0.05] px-3.5 py-2.5">
                <p className="text-[11px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wide font-semibold mb-1">
                  Consulta reescrita
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                  {trace.rewritten_query}
                </p>
              </div>
            )}
          </div>

          {/* Score strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-white/[0.06] border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Score prom.</p>
                <div className="mt-1"><ScoreBadge value={trace.avg_score} /></div>
              </div>
            </div>
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Score máx.</p>
                <p className={`text-lg font-bold mt-0.5 leading-none ${scoreColor(trace.max_score)}`}>
                  {Math.round(trace.max_score * 100)}%
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Score mín.</p>
                <p className={`text-sm font-bold mt-0.5 leading-none ${scoreColor(trace.min_score)}`}>
                  {Math.round(trace.min_score * 100)}%
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Latencia</p>
                <p
                  className={`text-lg font-bold mt-0.5 leading-none ${
                    trace.latency_ms > 2000 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {trace.latency_ms < 1000
                    ? `${trace.latency_ms}ms`
                    : `${(trace.latency_ms / 1000).toFixed(1)}s`}
                </p>
              </div>
            </div>
          </div>

          {/* Retrieval details */}
          <div className="px-5 py-5 border-b border-gray-100 dark:border-white/[0.06]">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <DatabaseZap className="w-3 h-3" />
              Detalles de recuperación
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <DetailField label="Chunks recuperados">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {trace.chunks_retrieved}
                </span>
              </DetailField>
              <DetailField label="Chunks usados">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {trace.chunks_used}
                </span>
              </DetailField>
              <DetailField label="Top-K solicitado">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {trace.top_k_requested}
                </span>
              </DetailField>
              <DetailField label="Score threshold">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {trace.score_threshold != null
                    ? `${Math.round(trace.score_threshold * 100)}%`
                    : '—'}
                </span>
              </DetailField>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="Modelo de embedding">
                <code className="text-xs font-mono bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] px-2 py-1 rounded">
                  {trace.embedding_model}
                </code>
              </DetailField>
              {trace.hybrid_search_used && (
                <DetailField label="Modo de búsqueda">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide">
                      Hybrid Search activo
                    </span>
                  </div>
                </DetailField>
              )}
            </div>
          </div>

          {/* Documents */}
          {trace.documents_hit.length > 0 && (
            <div className="px-5 py-5 border-b border-gray-100 dark:border-white/[0.06]">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Documentos usados ({trace.documents_hit.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trace.documents_hit.map((doc) => (
                  <span
                    key={doc}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-medium"
                  >
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Eval scores */}
          {(trace.faithfulness != null ||
            trace.answer_relevance != null ||
            trace.context_precision != null) && (
            <div className="px-5 py-5 border-b border-gray-100 dark:border-white/[0.06]">
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">
                Evaluación de calidad
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {trace.faithfulness != null && (
                  <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.05] px-4 py-3">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                      Faithfulness
                    </p>
                    <ScoreBadge value={trace.faithfulness} />
                  </div>
                )}
                {trace.answer_relevance != null && (
                  <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.05] px-4 py-3">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                      Relevancia de respuesta
                    </p>
                    <ScoreBadge value={trace.answer_relevance} />
                  </div>
                )}
                {trace.context_precision != null && (
                  <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.05] px-4 py-3">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                      Precisión de contexto
                    </p>
                    <ScoreBadge value={trace.context_precision} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation */}
          {trace.conversation_id && (
            <div className="px-5 py-4">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                Conversación asociada
              </p>
              <code className="text-xs font-mono text-gray-500 dark:text-gray-400">
                {trace.conversation_id}
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
