import { Agent, IconName } from '@/types';
import { AgentIcon } from './AgentIcon';
import Tooltip from '../ui/Tooltip';
import { apiAgents } from '@/lib/api/agents';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useModels } from '@/lib/hooks/useAgents';

const iconNames: IconName[] = [
  'CustomTrade',
  'Bank',
  'Convertion',
  'FacReview',
  'NomReview',
  'Inbox',
  'Respond',
  'Risk',
  'CPATax',
  'Travel',
  'Process',
  'Default',
  'CPAMember',
  'Repse',
];

const configPresets = [
  {
    id: 'precise',
    name: 'Preciso y Confiable',
    description:
      'Ideal para consultas de datos, normativa y respuestas exactas',
    config: { temperature: 0.3, topK: 20, maxTokens: 2000 },
  },
  {
    id: 'balanced',
    name: 'Equilibrado',
    description: 'Uso general, balance entre precisión y creatividad',
    config: { temperature: 0.7, topK: 40, maxTokens: 2000 },
  },
  {
    id: 'creative',
    name: 'Creativo y Flexible',
    description: 'Para redacción, lluvia de ideas y respuestas imaginativas',
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
  handleIconSelect: (icon: IconName) => void;
  handlePresetChange: (preset: {
    temperature: number;
    topK: number;
    maxTokens: number;
  }) => void;
}

const AgentFormGeneral = ({
  agent,
  handleChange,
  handleIconSelect,
  handlePresetChange,
}: AgentFormGeneralProps) => {
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const { data: modelOptions = [] } = useModels();

  const handleImprovePrompt = async () => {
    if (!agent.customPrompt.trim()) return;

    setIsImprovingPrompt(true);
    try {
      const improvedPrompt = await apiAgents.improvePrompt(agent.customPrompt);

      // Create a synthetic event to update the customPrompt
      const syntheticEvent = {
        target: {
          name: 'customPrompt',
          value: improvedPrompt,
        },
      } as React.ChangeEvent<HTMLTextAreaElement>;

      handleChange(syntheticEvent);
    } catch (error) {
      console.error('Error improving prompt:', error);
      alert('Error al mejorar el prompt. Por favor, inténtalo de nuevo.');
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const labelFlexClass =
    'flex items-center text-sm font-medium text-gray-700 mb-1';
  const formControlClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700';

  return (
    <div className="space-y-4 mb-4 p-2">
      <div>
        <label htmlFor="name" className={labelClass}>
          Nombre del Agente
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={agent.name}
          onChange={handleChange}
          className={formControlClass}
          required
        />
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={agent.description}
          onChange={handleChange}
          rows={2}
          className={formControlClass}
        ></textarea>
      </div>
      <div>
        <label className={labelClass}>Icono</label>
        <div className="grid grid-cols-6 gap-2 p-2 border border-gray-300 rounded-lg">
          {iconNames.map((icon) => (
            <button
              type="button"
              key={icon}
              onClick={() => handleIconSelect(icon)}
              className={`p-2 rounded-md flex justify-center items-center transition-colors ${
                agent.icon === icon
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <AgentIcon name={icon} className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor="customPrompt"
            className="flex items-center text-sm font-medium text-gray-700"
          >
            Master Prompt (System Instruction)
            <Tooltip text="Son las instrucciones base del agente: define su nombre, personalidad, en qué tema se especializa y cómo debe responder al usuario." />
          </label>
          <button
            type="button"
            disabled={!agent.customPrompt.trim() || isImprovingPrompt}
            onClick={handleImprovePrompt}
            className="flex items-center space-x-1 text-gray-600 hover:text-black disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Mejorar con IA"
          >
            {isImprovingPrompt ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-500" />
            )}
            <span className="text-xs font-semibold">
              {isImprovingPrompt ? 'Mejorando...' : 'Mejorar'}
            </span>
          </button>
        </div>
        <textarea
          id="customPrompt"
          name="customPrompt"
          value={agent.customPrompt}
          onChange={handleChange}
          rows={5}
          className={formControlClass}
        ></textarea>
      </div>
      <div>
        <label htmlFor="model" className={labelFlexClass}>
          Modelo
          <Tooltip text='El "motor" que impulsa al agente. Los modelos más avanzados entienden mejor el contexto y generan respuestas de mayor calidad, aunque pueden ser algo más lentos.' />
        </label>
        <select
          id="model"
          name="model"
          value={agent.model}
          onChange={handleChange}
          className={`${formControlClass} bg-white`}
        >
          {modelOptions.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Configuraciones Preestablecidas */}
      <div className="border-t pt-4">
        <div className="mb-3">
          <label className={labelFlexClass}>
            Perfil de Configuración
            <Tooltip text="Selecciona un perfil recomendado según el tipo de tarea de tu agente. Esto ajustará automáticamente los parámetros técnicos de forma óptima." />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {configPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetChange(preset.config)}
              className="p-3 border border-gray-300 rounded-lg hover:border-indigo-400 hover:shadow-sm transition-all text-left bg-white"
            >
              <div className="font-medium text-gray-900 mb-1">
                {preset.name}
              </div>
              <p className="text-xs text-gray-600">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label htmlFor="temperature" className={labelFlexClass}>
            Temperatura: {agent.temperature}
            <Tooltip text="Controla qué tan creativo es el agente. Valores bajos (0) lo hacen más preciso y repetible; valores altos (1) lo hacen más variado e imaginativo. Para tareas de datos o normativa, usa valores bajos; para redacción creativa, valores más altos." />
          </label>
          <input
            type="range"
            id="temperature"
            name="temperature"
            min="0"
            max="1"
            step="0.1"
            value={agent.temperature}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="topK" className={labelFlexClass}>
            Top K
            <Tooltip text="Define cuántas opciones de palabras evalúa el agente en cada paso. Valores bajos producen respuestas más enfocadas; valores altos permiten mayor variedad. Se recomienda dejarlo en su valor predeterminado." />
          </label>
          <input
            type="number"
            id="topK"
            name="topK"
            value={agent.topK}
            onChange={handleChange}
            className={formControlClass}
          />
        </div>
        <div>
          <label htmlFor="maxTokens" className={labelFlexClass}>
            Longitud máxima de respuesta
            <Tooltip text="Limita qué tan larga puede ser cada respuesta del agente. Un valor bajo genera respuestas más cortas y directas; uno más alto permite respuestas más extensas y detalladas. (1000 = respuesta media; 4000 = respuesta muy detallada)" />
          </label>
          <input
            type="number"
            id="maxTokens"
            name="maxTokens"
            value={agent.maxTokens}
            onChange={handleChange}
            className={formControlClass}
          />
        </div>
      </div>

      {/* Configuración adicional */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Configuración adicional
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="isPublic" className={labelFlexClass}>
              Visibilidad del Agente
              <Tooltip text='Define dónde aparecerá este agente. "Público" lo muestra en el chat principal para todos los usuarios; "Privado" solo será visible para ti en esta plataforma de administración.' />
            </label>
            <select
              id="isPublic"
              name="isPublic"
              value={agent.isPublic ? 'true' : 'false'}
              onChange={handleChange}
              className={`${formControlClass} bg-white`}
            >
              <option value="true">Público</option>
              <option value="false">Privado</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Los agentes públicos son visibles para todos los usuarios,
              mientras que los privados solo son visibles para ti.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentFormGeneral;
