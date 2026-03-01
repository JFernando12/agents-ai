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
};

const EMBEDDING_MODELS = [
  { value: 'amazon.titan-embed-text-v2:0', label: 'Amazon Titan Embed V2' },
  { value: 'amazon.titan-embed-text-v1', label: 'Amazon Titan Embed V1' },
  { value: 'cohere.embed-english-v3', label: 'Cohere Embed English V3' },
  { value: 'cohere.embed-multilingual-v3', label: 'Cohere Embed Multilingual V3' },
];

interface AgentFormRAGProps {
  agent: Omit<Agent, 'id'>;
  onRAGConfigChange: (config: RAGConfig) => void;
}

const label =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';
const input =
  'w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';

export default function AgentFormRAG({ agent, onRAGConfigChange }: AgentFormRAGProps) {
  const cfg: RAGConfig = agent.ragConfig ?? DEFAULT_RAG_CONFIG;

  const update = (partial: Partial<RAGConfig>) => {
    onRAGConfigChange({ ...cfg, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* Enable / Disable */}
      <section className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">Base de conocimientos</p>
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
                <p className="text-xs text-gray-400 mt-1">Chunks a recuperar por consulta</p>
              </div>

              {/* Score threshold */}
              <div>
                <label className={label}>
                  Score mínimo{' '}
                  <span className="text-gray-400 normal-case font-normal">(opcional)</span>
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
                      score_threshold: e.target.value === '' ? null : Number(e.target.value),
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
              <label className={label}>Longitud máx. de contexto (caracteres)</label>
              <input
                type="number"
                min={500}
                max={32000}
                step={500}
                className={input}
                value={cfg.context_max_chars}
                onChange={(e) => update({ context_max_chars: Number(e.target.value) })}
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
              Estos valores se usan al procesar nuevos documentos. Cambiarlos no re-indexa los
              documentos existentes.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Tamaño de chunk (caracteres)</label>
                <input
                  type="number"
                  min={200}
                  max={8000}
                  step={100}
                  className={input}
                  value={cfg.chunk_size}
                  onChange={(e) => update({ chunk_size: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={label}>Overlap de chunk (caracteres)</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  step={50}
                  className={input}
                  value={cfg.chunk_overlap}
                  onChange={(e) => update({ chunk_overlap: Number(e.target.value) })}
                />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
