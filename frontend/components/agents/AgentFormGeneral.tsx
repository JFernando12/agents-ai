import { Agent } from '@/types';
import Tooltip from '../ui/Tooltip';
import { apiAgents } from '@/lib/api/agents';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useModels } from '@/lib/hooks/useAgents';

const configPresets = [
  {
    id: 'precise',
    name: 'Preciso',
    description: 'Datos y normativa',
    config: { temperature: 0.3, topK: 20, maxTokens: 2000 },
  },
  {
    id: 'balanced',
    name: 'Equilibrado',
    description: 'Uso general',
    config: { temperature: 0.7, topK: 40, maxTokens: 2000 },
  },
  {
    id: 'creative',
    name: 'Creativo',
    description: 'Redacción e ideas',
    config: { temperature: 1.0, topK: 50, maxTokens: 3000 },
  },
];

interface AgentFormGeneralProps {
  agent: Omit<Agent, 'id'>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handlePresetChange: (preset: {
    temperature: number;
    topK: number;
    maxTokens: number;
  }) => void;
}

const label =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';
const input =
  'w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';

const AgentFormGeneral = ({
  agent,
  handleChange,
  handlePresetChange,
}: AgentFormGeneralProps) => {
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const { data: modelOptions = [] } = useModels();

  const handleImprovePrompt = async () => {
    if (!agent.customPrompt.trim()) return;
    setIsImprovingPrompt(true);
    try {
      const improvedPrompt = await apiAgents.improvePrompt(agent.customPrompt);
      handleChange({
        target: { name: 'customPrompt', value: improvedPrompt },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    } catch {
      alert('Error al mejorar el prompt.');
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Identidad */}
      <section className="space-y-4">
        <div>
          <label htmlFor="name" className={label}>
            Nombre del agente
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={agent.name}
            onChange={handleChange}
            className={input}
            required
          />
        </div>
        <div>
          <label htmlFor="description" className={label}>
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={agent.description}
            onChange={handleChange}
            rows={2}
            className={`${input} resize-none`}
          />
        </div>
      </section>

      {/* Modelo */}
      <section>
        <label htmlFor="model" className={label}>
          <span className="flex items-center gap-1">
            Modelo{' '}
            <Tooltip text='El "motor" del agente. Modelos más avanzados generan mejores respuestas pero pueden ser más lentos.' />
          </span>
        </label>
        <select
          id="model"
          name="model"
          value={agent.model}
          onChange={handleChange}
          className={`${input} bg-white dark:bg-white/[0.04]`}
        >
          {modelOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </section>

      {/* Prompt */}
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="customPrompt"
            className={`${label} mb-0 flex items-center gap-1`}
          >
            Master Prompt
            <Tooltip text="Instrucciones base del agente: define su personalidad, especialidad y cómo responder." />
          </label>
          <button
            type="button"
            disabled={!agent.customPrompt.trim() || isImprovingPrompt}
            onClick={handleImprovePrompt}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isImprovingPrompt ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isImprovingPrompt ? 'Mejorando...' : 'Mejorar'}
          </button>
        </div>
        <textarea
          id="customPrompt"
          name="customPrompt"
          value={agent.customPrompt}
          onChange={handleChange}
          rows={6}
          className={`${input} resize-none leading-relaxed`}
          placeholder="Eres un asistente especializado que..."
        />
      </section>

      {/* Perfil de configuración */}
      <section>
        <label className={label}>
          <span className="flex items-center gap-1">
            Perfil de configuración{' '}
            <Tooltip text="Ajusta automáticamente temperatura, topK y maxTokens según el tipo de tarea." />
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {configPresets.map((preset) => {
            const isActive =
              agent.temperature === preset.config.temperature &&
              agent.topK === preset.config.topK &&
              agent.maxTokens === preset.config.maxTokens;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset.config)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-400/30'
                    : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:border-indigo-300 dark:hover:border-indigo-500/40'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}
                >
                  {preset.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Parámetros avanzados */}
      <section className="border-t border-gray-100 dark:border-white/[0.06] pt-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          Parámetros avanzados
        </p>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="temperature"
              className={`${label} mb-0 flex items-center gap-1`}
            >
              Temperatura
              <Tooltip text="Creatividad del agente. Bajo = preciso; alto = creativo." />
            </label>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {agent.temperature}
            </span>
          </div>
          <input
            type="range"
            id="temperature"
            name="temperature"
            min="0"
            max="1"
            step="0.1"
            value={agent.temperature}
            onChange={handleChange}
            className="w-full h-1.5 appearance-none rounded-full bg-gray-200 dark:bg-white/[0.1] accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Preciso</span>
            <span>Creativo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="topK"
              className={`${label} flex items-center gap-1`}
            >
              Top K{' '}
              <Tooltip text="Opciones de palabras a evaluar. Menor = más enfocado." />
            </label>
            <input
              type="number"
              id="topK"
              name="topK"
              value={agent.topK}
              onChange={handleChange}
              className={input}
            />
          </div>
          <div>
            <label
              htmlFor="maxTokens"
              className={`${label} flex items-center gap-1`}
            >
              Máx. tokens <Tooltip text="Longitud máxima de respuesta." />
            </label>
            <input
              type="number"
              id="maxTokens"
              name="maxTokens"
              value={agent.maxTokens}
              onChange={handleChange}
              className={input}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="isPublic"
            className={`${label} flex items-center gap-1`}
          >
            Visibilidad{' '}
            <Tooltip text='"Público": visible en el chat principal. "Privado": solo visible aquí.' />
          </label>
          <select
            id="isPublic"
            name="isPublic"
            value={agent.isPublic ? 'true' : 'false'}
            onChange={handleChange}
            className={`${input} bg-white dark:bg-white/[0.04]`}
          >
            <option value="true">
              Público — visible para todos los usuarios
            </option>
            <option value="false">
              Privado — solo visible en administración
            </option>
          </select>
        </div>
      </section>
    </div>
  );
};

export default AgentFormGeneral;
