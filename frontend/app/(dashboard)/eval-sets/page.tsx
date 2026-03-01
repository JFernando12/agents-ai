'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FlaskConical,
  Plus,
  Trash2,
  Loader2,
  HelpCircle,
  Eye,
  Edit3,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { useAgents } from '@/lib/hooks/useAgents';
import { useEvalSets, useDeleteEvalSet } from '@/lib/hooks/useEvalSets';
import type { EvalSet } from '@/types';
import ModalDelete from '@/components/ui/ModalDelete';
import { PageHeader } from '@/components/ui/PageHeader';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Agent list — pick an agent to see its eval sets
// ---------------------------------------------------------------------------

function AgentPicker() {
  const router = useRouter();
  const { data: agents, isLoading } = useAgents();

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        <PageHeader
          crumbs={[{ label: 'Eval Sets' }]}
          subtitle="Selecciona un agente para ver o crear sus eval sets."
        />

        {/* Column headers */}
        <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-100 dark:border-white/[0.05] flex-shrink-0 bg-gray-50/60 dark:bg-white/[0.01]">
          <div className="w-8 flex-shrink-0" />
          <span className="flex-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Agente
          </span>
          <div className="w-6 flex-shrink-0" />
        </div>

        {/* Body */}
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
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sin agentes
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Crea un agente primero desde el Centro de Agentes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() =>
                    router.push(`/eval-sets?agentId=${agent.id}`)
                  }
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] group transition-colors text-left"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  </div>

                  {/* Name + description */}
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

                  {/* Arrow */}
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

// ---------------------------------------------------------------------------
// Eval set list for a specific agent
// ---------------------------------------------------------------------------

function EvalSetList({ agentId }: { agentId: string }) {
  const router = useRouter();
  const { data: agents } = useAgents();
  const agent = agents?.find((a) => a.id === agentId);

  const { data: evalSets, isLoading: setsLoading } = useEvalSets(agentId);
  const deleteMutation = useDeleteEvalSet(agentId);
  const [toDelete, setToDelete] = useState<EvalSet | null>(null);

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    await deleteMutation.mutateAsync(toDelete.id);
    setToDelete(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] h-full flex flex-col overflow-hidden">
        <PageHeader
          crumbs={[
            { label: 'Eval Sets', href: '/eval-sets' },
            { label: agent?.name ?? '…' },
          ]}
          subtitle="Conjuntos de preguntas para evaluar este agente."
          actions={
            <button
              onClick={() => router.push(`/eval-sets/new?agentId=${agentId}`)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Eval Set
            </button>
          }
        />

        {/* Column headers */}
        <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-100 dark:border-white/[0.05] flex-shrink-0 bg-gray-50/60 dark:bg-white/[0.01]">
          <div className="w-8 flex-shrink-0" />
          <span className="flex-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Nombre
          </span>
          <span className="w-24 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center flex-shrink-0">
            Preguntas
          </span>
          <span className="hidden sm:block w-28 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex-shrink-0">
            Creado
          </span>
          <div className="w-[88px] flex-shrink-0" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-1">
          {setsLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando…
            </div>
          ) : !evalSets || evalSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sin eval sets aún
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Crea el primero para empezar a evaluar tu RAG
              </p>
              <button
                onClick={() =>
                  router.push(`/eval-sets/new?agentId=${agentId}`)
                }
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <Plus size={14} />
                Nuevo Eval Set
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {evalSets.map((es) => (
                <div
                  key={es.id}
                  onClick={() => router.push(`/eval-sets/${es.id}`)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] group transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {es.name}
                    </p>
                    {es.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {es.description}
                      </p>
                    )}
                  </div>
                  <div className="w-24 flex justify-center flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <HelpCircle className="w-3 h-3" />
                      {es.items.length}
                    </span>
                  </div>
                  <span className="hidden sm:block w-28 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {formatDate(es.created_at)}
                  </span>
                  <div
                    className="flex items-center gap-0.5 w-[88px] justify-end flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => router.push(`/eval-sets/${es.id}`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Ver detalle"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => router.push(`/eval-sets/${es.id}/edit`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setToDelete(es)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModalDelete
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onSave={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — router between agent picker and eval set list
// ---------------------------------------------------------------------------

function EvalSetsContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');

  if (agentId) {
    return <EvalSetList agentId={agentId} />;
  }
  return <AgentPicker />;
}

export default function EvalSetsPage() {
  return (
    <Suspense>
      <EvalSetsContent />
    </Suspense>
  );
}
