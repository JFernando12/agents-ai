import { Agent, RAGConfig } from '@/types';

const DEFAULT_RAG_CONFIG: RAGConfig = {
  enabled: true,
  embedding_model: 'amazon.titan-embed-text-v2:0',
  top_k: 5,
  score_threshold: null,
  chunk_size: 1500,
  chunk_overlap: 200,
  context_max_chars: 8000,
  search_type: 'semantic',
  query_rewriting_enabled: false,
  query_rewriting_model: 'amazon.nova-micro-v1:0',
  eval_enabled: false,
  eval_model: 'amazon.nova-micro-v1:0',
  hybrid_search_enabled: false,
  hybrid_alpha: 0.7,
  chunking_strategy: 'fixed',
  contextual_retrieval_model: 'amazon.nova-micro-v1:0',
};

const EMBEDDING_MODELS = [
  { value: 'amazon.titan-embed-text-v2:0', label: 'Amazon Titan Embed V2' },
  { value: 'amazon.titan-embed-text-v1', label: 'Amazon Titan Embed V1' },
  { value: 'cohere.embed-english-v3', label: 'Cohere Embed English V3' },
  {
    value: 'cohere.embed-multilingual-v3',
    label: 'Cohere Embed Multilingual V3',
  },
];

const REWRITING_MODELS = [
  { value: 'amazon.nova-micro-v1:0', label: 'Amazon Nova Micro (rápido)' },
  { value: 'amazon.nova-lite-v1:0', label: 'Amazon Nova Lite' },
  {
    value: 'anthropic.claude-haiku-3-5-20241022-v1:0',
    label: 'Claude Haiku 3.5',
  },
];

interface AgentFormRAGProps {
  agent: Omit<Agent, 'id'>;
  onRAGConfigChange: (config: RAGConfig) => void;
}

const label =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';
const input =
  'w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';

export default function AgentFormRAG({
  agent,
  onRAGConfigChange,
}: AgentFormRAGProps) {
  const cfg: RAGConfig = agent.ragConfig ?? DEFAULT_RAG_CONFIG;

  const update = (partial: Partial<RAGConfig>) => {
    onRAGConfigChange({ ...cfg, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* Enable / Disable */}
      <section className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            Base de conocimientos
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Activa o desactiva el RAG para este agente
          </p>
        </div>
        <button
          type="button"
          onClick={() => update({ enabled: !cfg.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            cfg.enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
              cfg.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </section>

      {cfg.enabled && (
        <>
          {/* Retrieval */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Retrieval
            </h3>

            {/* Embedding model */}
            <div>
              <label className={label}>Modelo de embeddings</label>
              <select
                className={input}
                value={cfg.embedding_model}
                onChange={(e) => update({ embedding_model: e.target.value })}
              >
                {EMBEDDING_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Modelo con el que se generan los embeddings de consulta
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Top K */}
              <div>
                <label className={label}>Top K</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className={input}
                  value={cfg.top_k}
                  onChange={(e) => update({ top_k: Number(e.target.value) })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Chunks a recuperar por consulta
                </p>
              </div>

              {/* Score threshold */}
              <div>
                <label className={label}>
                  Score mínimo{' '}
                  <span className="text-gray-400 normal-case font-normal">
                    (opcional)
                  </span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  placeholder="0.00 — desactivado"
                  className={input}
                  value={cfg.score_threshold ?? ''}
                  onChange={(e) =>
                    update({
                      score_threshold:
                        e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-400 mt-1">
                  Descartar chunks con similitud menor a este valor (0–1)
                </p>
              </div>
            </div>

            {/* Context max chars */}
            <div>
              <label className={label}>
                Longitud máx. de contexto (caracteres)
              </label>
              <input
                type="number"
                min={500}
                max={32000}
                step={500}
                className={input}
                value={cfg.context_max_chars}
                onChange={(e) =>
                  update({ context_max_chars: Number(e.target.value) })
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Límite de caracteres del contexto combinado enviado al LLM
              </p>
            </div>
          </section>

          {/* Chunking */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Chunking de documentos
            </h3>
            <p className="text-xs text-gray-400 -mt-2">
              Estos valores se usan al procesar nuevos documentos. Cambiarlos no
              re-indexa los documentos existentes.
            </p>

            {/* Strategy selector */}
            <div>
              <label className={label}>Estrategia de chunking</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      value: 'fixed',
                      label: 'Fijo',
                      desc: 'Tamaño fijo con overlap',
                    },
                    {
                      value: 'semantic',
                      label: 'Semántico',
                      desc: 'Divide por secciones y párrafos',
                    },
                    {
                      value: 'contextual',
                      label: 'Contextual',
                      desc: 'Semántico + resumen de contexto',
                    },
                  ] as const
                ).map(({ value, label: lbl, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ chunking_strategy: value })}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      cfg.chunking_strategy === value
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        cfg.chunking_strategy === value
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {lbl}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                      {desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Chunk size — always visible */}
            <div
              className={
                cfg.chunking_strategy === 'fixed'
                  ? 'grid grid-cols-2 gap-4'
                  : ''
              }
            >
              <div>
                <label className={label}>
                  {cfg.chunking_strategy === 'fixed'
                    ? 'Tamaño de chunk'
                    : 'Tamaño máx. de chunk'}{' '}
                  <span className="text-gray-400 normal-case font-normal">
                    (caracteres)
                  </span>
                </label>
                <input
                  type="number"
                  min={200}
                  max={8000}
                  step={100}
                  className={input}
                  value={cfg.chunk_size}
                  onChange={(e) =>
                    update({ chunk_size: Number(e.target.value) })
                  }
                />
              </div>
              {/* Overlap only for fixed strategy */}
              {cfg.chunking_strategy === 'fixed' && (
                <div>
                  <label className={label}>Overlap de chunk (caracteres)</label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    step={50}
                    className={input}
                    value={cfg.chunk_overlap}
                    onChange={(e) =>
                      update({ chunk_overlap: Number(e.target.value) })
                    }
                  />
                </div>
              )}
            </div>

            {/* Contextual model — only for contextual strategy */}
            {cfg.chunking_strategy === 'contextual' && (
              <div>
                <label className={label}>Modelo de contextualización</label>
                <select
                  className={input}
                  value={cfg.contextual_retrieval_model}
                  onChange={(e) =>
                    update({ contextual_retrieval_model: e.target.value })
                  }
                >
                  {REWRITING_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Modelo que genera el resumen de contexto por chunk al indexar.
                  Aumenta el tiempo de procesado de documentos.
                </p>
              </div>
            )}
          </section>

          {/* Query Rewriting */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Query Rewriting
            </h3>

            {/* Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  Reescritura de consultas
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Reformula la pregunta del usuario con un LLM antes de buscar
                  en la KB para mejorar el recall
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  update({
                    query_rewriting_enabled: !cfg.query_rewriting_enabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                  cfg.query_rewriting_enabled
                    ? 'bg-indigo-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                    cfg.query_rewriting_enabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Model selector — only shown when enabled */}
            {cfg.query_rewriting_enabled && (
              <div>
                <label className={label}>Modelo de reescritura</label>
                <select
                  className={input}
                  value={cfg.query_rewriting_model}
                  onChange={(e) =>
                    update({ query_rewriting_model: e.target.value })
                  }
                >
                  {REWRITING_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Modelo ligero usado exclusivamente para reformular la
                  consulta. Se recomienda el más rápido disponible.
                </p>
              </div>
            )}
          </section>

          {/* Answer Evaluation */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Evaluación automática
            </h3>

            {/* Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  Evaluar calidad de respuestas
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Calcula faithfulness, relevancia y precisión de contexto
                  automáticamente tras cada respuesta
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  update({
                    eval_enabled: !cfg.eval_enabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                  cfg.eval_enabled
                    ? 'bg-indigo-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                    cfg.eval_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Model selector — only shown when enabled */}
            {cfg.eval_enabled && (
              <div>
                <label className={label}>Modelo de evaluación</label>
                <select
                  className={input}
                  value={cfg.eval_model}
                  onChange={(e) => update({ eval_model: e.target.value })}
                >
                  {REWRITING_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Modelo ligero usado en segundo plano para puntuar las
                  respuestas. No impacta la latencia del chat.
                </p>
              </div>
            )}
          </section>

          {/* Hybrid Search */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Búsqueda híbrida
            </h3>

            {/* Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  Hybrid Search (semántico + BM25)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Combina búsqueda vectorial y keyword para mejorar el recall en
                  consultas con términos específicos
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  update({ hybrid_search_enabled: !cfg.hybrid_search_enabled })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                  cfg.hybrid_search_enabled
                    ? 'bg-indigo-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                    cfg.hybrid_search_enabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Alpha slider — only shown when enabled */}
            {cfg.hybrid_search_enabled && (
              <div>
                <label className={label}>
                  Peso semántico (alpha){' '}
                  <span className="text-gray-400 normal-case font-normal">
                    {Math.round(cfg.hybrid_alpha * 100)}% semántico /{' '}
                    {Math.round((1 - cfg.hybrid_alpha) * 100)}% keyword
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full accent-indigo-500"
                  value={cfg.hybrid_alpha}
                  onChange={(e) =>
                    update({ hybrid_alpha: Number(e.target.value) })
                  }
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>100% keyword</span>
                  <span>Equilibrado</span>
                  <span>100% semántico</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Valores altos priorizan similitud semántica; valores bajos
                  priorizan coincidencia exacta de palabras.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
