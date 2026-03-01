'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Loader2, X } from 'lucide-react';
import { useCreateEvalSet } from '@/lib/hooks/useEvalSets';
import { useAgents } from '@/lib/hooks/useAgents';
import { PageHeader } from '@/components/ui/PageHeader';
import type { EvalSetCreate, EvalSetItem } from '@/types';

const inputCls =
  'w-full rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';

function NewEvalSetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId') ?? '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<EvalSetItem[]>([
    { id: crypto.randomUUID(), question: '', expected_answer: '', notes: '' },
  ]);

  const createMutation = useCreateEvalSet();
  const { data: agents } = useAgents();
  const agent = agents?.find((a) => a.id === agentId);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), question: '', expected_answer: '', notes: '' },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof EvalSetItem, value: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !agentId) return;
    const payload: EvalSetCreate = {
      agent_id: agentId,
      name: name.trim(),
      description: description.trim() || null,
      items: items.filter((i) => i.question.trim()),
    };
    const created = await createMutation.mutateAsync(payload);
    router.push(`/eval-sets/${created.id}`);
  }

  if (!agentId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-red-500">
          No se especificó un agente. Vuelve a la lista.
        </p>
        <button
          onClick={() => router.push('/eval-sets')}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Volver
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
            { label: agent?.name ?? '…', href: `/eval-sets?agentId=${agentId}` },
            { label: 'Nuevo Eval Set' },
          ]}
        />

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Name + description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                  Nombre *
                </label>
                <input
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Preguntas de producto Q2"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                  Descripción
                </label>
                <input
                  className={inputCls}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción opcional"
                />
              </div>
            </div>

            {/* Questions table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Preguntas ({items.length})
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors font-medium"
                >
                  <Plus size={12} />
                  Agregar pregunta
                </button>
              </div>

              {/* Column labels */}
              <div className="grid grid-cols-[28px_1fr_1fr_32px] gap-3 mb-1.5 px-1">
                <div />
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  Pregunta *
                </p>
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  Respuesta esperada
                </p>
                <div />
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="group grid grid-cols-[28px_1fr_1fr_32px] gap-3 items-center"
                  >
                    <span className="text-xs text-gray-400 dark:text-gray-600 font-mono text-right">
                      {idx + 1}.
                    </span>
                    <input
                      className={inputCls}
                      value={item.question}
                      onChange={(e) =>
                        updateItem(item.id, 'question', e.target.value)
                      }
                      placeholder="¿Cuál es el precio del plan pro?"
                    />
                    <input
                      className={inputCls}
                      value={item.expected_answer ?? ''}
                      onChange={(e) =>
                        updateItem(item.id, 'expected_answer', e.target.value)
                      }
                      placeholder="El plan pro cuesta $49/mes…"
                    />
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] flex-shrink-0">
            <button
              type="button"
              onClick={() => router.push('/eval-sets')}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center gap-1.5 transition-colors"
            >
              {createMutation.isPending && (
                <Loader2 size={13} className="animate-spin" />
              )}
              Crear Eval Set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewEvalSetPage() {
  return (
    <Suspense>
      <NewEvalSetForm />
    </Suspense>
  );
}
