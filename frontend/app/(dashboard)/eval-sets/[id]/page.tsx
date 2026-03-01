'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FlaskConical,
} from 'lucide-react';
import {
  useEvalSet,
  useEvalRuns,
  useEvalRun,
  useTriggerEvalRun,
  useDeleteEvalSet,
} from '@/lib/hooks/useEvalSets';
import { useAgents } from '@/lib/hooks/useAgents';
import type { EvalRunResult, EvalRunSummary } from '@/types';
import ModalDelete from '@/components/ui/ModalDelete';
import { PageHeader } from '@/components/ui/PageHeader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ScoreBadge({ value }: { value: number | null | undefined }) {
  if (value == null)
    return (
      <span className="text-xs text-gray-400 dark:text-gray-600">—</span>
    );
  const pct = Math.round(value * 100);
  const color =
    pct >= 75
      ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
      : pct >= 50
        ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
        : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400';
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold tabular-nums ${color}`}
    >
      {pct}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:
      'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400',
    running:
      'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
    completed:
      'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
    failed: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400',
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock size={10} />,
    running: <Loader2 size={10} className="animate-spin" />,
    completed: <CheckCircle2 size={10} />,
    failed: <XCircle size={10} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${map[status] ?? map.pending}`}
    >
      {icons[status]}
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Result row — one level of expand
// ---------------------------------------------------------------------------

function ResultRow({ result }: { result: EvalRunResult }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${
          open
            ? 'bg-indigo-50/50 dark:bg-indigo-500/[0.06]'
            : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
        }`}
        onClick={() => setOpen((p) => !p)}
      >
        <td className="pl-5 pr-3 py-2.5 w-4">
          {open ? (
            <ChevronUp
              size={12}
              className="text-indigo-500 dark:text-indigo-400"
            />
          ) : (
            <ChevronDown size={12} className="text-gray-400" />
          )}
        </td>
        <td className="pr-4 py-2.5 max-w-0 w-full">
          <p
            className={`text-sm truncate ${result.error ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}
          >
            {result.question}
          </p>
        </td>
        <td className="px-3 py-2.5 text-center whitespace-nowrap">
          <ScoreBadge value={result.faithfulness} />
        </td>
        <td className="px-3 py-2.5 text-center whitespace-nowrap">
          <ScoreBadge value={result.answer_relevance} />
        </td>
        <td className="px-3 py-2.5 text-center whitespace-nowrap">
          <ScoreBadge value={result.context_precision} />
        </td>
        <td className="px-3 py-2.5 text-center whitespace-nowrap">
          <ScoreBadge value={result.answer_correctness} />
        </td>
        <td className="pl-3 pr-5 py-2.5 text-right whitespace-nowrap">
          {result.latency_ms != null ? (
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              {result.latency_ms < 1000
                ? `${result.latency_ms}ms`
                : `${(result.latency_ms / 1000).toFixed(1)}s`}
            </span>
          ) : (
            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-indigo-50/40 dark:bg-indigo-500/[0.04]">
          <td />
          <td colSpan={6} className="pr-5 pb-4 pt-1">
            <div className="space-y-3">
              {result.error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-md px-3 py-2">
                  {result.error}
                </p>
              )}
              {result.answer && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                    Respuesta del agente
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {result.answer}
                  </p>
                </div>
              )}
              {result.expected_answer && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
                    <MessageSquare size={10} /> Respuesta esperada
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {result.expected_answer}
                  </p>
                </div>
              )}
              {result.chunks_used != null && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Chunks usados:{' '}
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    {result.chunks_used}
                  </span>
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Run detail — flat table with averages strip
// ---------------------------------------------------------------------------

function RunDetail({
  evalSetId,
  runSummary,
}: {
  evalSetId: string;
  runSummary: EvalRunSummary;
}) {
  const { data: run, isLoading } = useEvalRun(evalSetId, runSummary.id);

  if (runSummary.status === 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-600 dark:text-blue-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm font-medium">Ejecutando evaluación…</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {runSummary.completed_items}/{runSummary.total_items} completados
        </p>
      </div>
    );
  }

  if (runSummary.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-gray-500">
        <Clock size={28} />
        <p className="text-sm">En cola…</p>
      </div>
    );
  }

  if (runSummary.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <XCircle size={28} className="text-red-400" />
        <p className="text-sm text-red-500">La ejecución falló</p>
        {run?.error && (
          <p className="text-xs text-gray-500 bg-red-50 dark:bg-red-500/10 rounded-md px-3 py-2 max-w-sm text-center">
            {run.error}
          </p>
        )}
      </div>
    );
  }

  if (isLoading || !run) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-gray-400 dark:text-gray-500 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Cargando resultados…
      </div>
    );
  }

  const results = run.results ?? [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Averages strip */}
      {runSummary.status === 'completed' && (
        <div className="flex items-center gap-6 px-5 py-2.5 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/60 dark:bg-white/[0.01] flex-shrink-0 flex-wrap">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex-shrink-0">
            Promedios
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Faithfulness', value: runSummary.avg_faithfulness },
              {
                label: 'Answer Rel.',
                value: runSummary.avg_answer_relevance,
              },
              {
                label: 'Context Prec.',
                value: runSummary.avg_context_precision,
              },
              ...(runSummary.avg_answer_correctness != null
                ? [
                    {
                      label: 'Correctness',
                      value: runSummary.avg_answer_correctness,
                    },
                  ]
                : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {label}
                </span>
                <ScoreBadge value={value} />
              </div>
            ))}
          </div>
          <p className="ml-auto text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
            {runSummary.completed_items}/{runSummary.total_items} items
          </p>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50/90 dark:bg-[#18181B]/90 backdrop-blur-sm border-b border-gray-100 dark:border-white/[0.05]">
              <th className="pl-5 pr-3 py-2 w-4" />
              <th className="pr-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-full">
                Pregunta
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center whitespace-nowrap">
                Faith.
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center whitespace-nowrap">
                Ans. Rel.
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center whitespace-nowrap">
                Ctx. Prec.
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center whitespace-nowrap">
                Correctness
              </th>
              <th className="pl-3 pr-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right whitespace-nowrap">
                Latencia
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {results.map((r) => (
              <ResultRow key={r.item_id} result={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EvalSetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: evalSet, isLoading } = useEvalSet(id);
  const { data: agents } = useAgents();
  const { data: runs, isLoading: runsLoading } = useEvalRuns(id);
  const triggerRun = useTriggerEvalRun(id);
  const deleteMutation = useDeleteEvalSet(evalSet?.agent_id ?? '');

  const agent = agents?.find((a) => a.id === evalSet?.agent_id);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const hasActiveRun = runs?.some(
    (r) => r.status === 'pending' || r.status === 'running',
  );
  const activeRunId = selectedRunId ?? runs?.[0]?.id ?? null;
  const activeRun = runs?.find((r) => r.id === activeRunId) ?? null;

  function handleTrigger() {
    triggerRun.mutate(undefined, {
      onSuccess: (run) => setSelectedRunId(run.id),
    });
  }

  async function handleDelete() {
    if (!evalSet) return;
    await deleteMutation.mutateAsync(evalSet.id);
    router.push('/eval-sets');
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Cargando…
      </div>
    );
  }

  if (!evalSet) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Eval set no encontrado.
        </p>
        <button
          onClick={() => router.push('/eval-sets')}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        <PageHeader
          crumbs={[
            { label: 'Eval Sets', href: '/eval-sets' },
            { label: agent?.name ?? '…', href: `/eval-sets?agentId=${evalSet.agent_id}` },
            { label: evalSet.name },
          ]}
          subtitle={evalSet.description ?? undefined}
          actions={
            <>
              <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">
                {formatDate(evalSet.created_at)}
              </span>
              <button
                onClick={() => router.push(`/eval-sets/${id}/edit`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Editar"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={handleTrigger}
                disabled={triggerRun.isPending || hasActiveRun}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors ml-1"
              >
                {triggerRun.isPending || hasActiveRun ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Play size={13} />
                )}
                Run
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                title="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </>
          }
        />

        {/* Questions section */}
        <div className="border-b border-gray-100 dark:border-white/[0.05] flex-shrink-0">
          <div className="px-5 py-2 bg-gray-50/60 dark:bg-white/[0.01] border-b border-gray-100 dark:border-white/[0.05] flex items-center gap-2">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Preguntas
            </p>
            <span className="text-[11px] text-gray-400 dark:text-gray-600">
              ({evalSet.items.length})
            </span>
          </div>
          <div className="px-5 py-2.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {evalSet.items.map((item, idx) => (
              <span
                key={item.id}
                title={item.question}
                className="inline-flex items-center gap-1 text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-md px-2 py-1 text-gray-600 dark:text-gray-400 max-w-xs"
              >
                <span className="text-gray-400 dark:text-gray-600 font-mono flex-shrink-0">
                  {idx + 1}.
                </span>
                <span className="truncate">{item.question}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Runs section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Run tabs */}
          <div className="border-b border-gray-100 dark:border-white/[0.05] flex-shrink-0">
            <div className="px-5 py-2 bg-gray-50/60 dark:bg-white/[0.01] border-b border-gray-100 dark:border-white/[0.05] flex items-center gap-2">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Ejecuciones
              </p>
              {runsLoading && (
                <Loader2 size={11} className="animate-spin text-gray-400" />
              )}
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto">
              {!runsLoading && (!runs || runs.length === 0) ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Sin ejecuciones. Presiona{' '}
                  <strong className="font-medium">Run</strong> para iniciar.
                </p>
              ) : (
                runs?.map((run) => {
                  const isActive = run.id === activeRunId;
                  return (
                    <button
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                      }`}
                    >
                      <StatusBadge status={run.status} />
                      <span>{formatDateShort(run.created_at)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-hidden">
            {!activeRun && !runsLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Presiona Run para ejecutar la primera evaluación
                </p>
              </div>
            ) : activeRun ? (
              <RunDetail evalSetId={id} runSummary={activeRun} />
            ) : null}
          </div>
        </div>
      </div>

      <ModalDelete
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSave={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
