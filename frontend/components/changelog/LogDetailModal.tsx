import React from 'react';
import type { LogEntry, Agent } from '@/types';
import Modal from '../ui/Modal';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logEntry: LogEntry | null;
}

const fieldLabels: Record<keyof Agent, string> = {
  id: 'ID',
  name: 'Nombre',
  description: 'Descripción',
  icon: 'Icono',
  customPrompt: 'Master Prompt',
  model: 'Modelo',
  temperature: 'Temperatura',
  topK: 'Top K',
  maxTokens: 'Max Tokens',
  isPublic: 'Visibilidad',
  tools: 'Herramientas',
  sub_agents: 'Sub-agentes',
  questions: 'Preguntas Frecuentes',
};

const actionBadgeStyles: Record<string, string> = {
  creado: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  editado: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  eliminado: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

function renderValue(value: any) {
  if (typeof value === 'boolean') {
    return (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {value ? 'Público' : 'Privado'}
      </span>
    );
  }
  if (typeof value === 'string' && value.length > 100) {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {value}
      </pre>
    );
  }
  return (
    <span className="text-sm text-gray-700 dark:text-gray-300">
      {value?.toString() ?? 'N/A'}
    </span>
  );
}

const LogDetailModal: React.FC<LogDetailModalProps> = ({
  isOpen,
  onClose,
  logEntry,
}) => {
  if (!isOpen || !logEntry) return null;

  const { action, previousState, currentState, agentName, user, timestamp } = logEntry;

  const renderComparison = () => {
    if (!previousState || !currentState) return null;

    const allKeys = Array.from(
      new Set([...Object.keys(previousState), ...Object.keys(currentState)])
    ) as (keyof Agent)[];

    const changedKeys = allKeys.filter(
      (key) => JSON.stringify(previousState[key]) !== JSON.stringify(currentState[key])
    );

    if (changedKeys.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No se detectaron cambios en los campos.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {changedKeys.map((key) => (
          <div key={key} className="rounded-lg border border-gray-100 dark:border-white/[0.07] overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.07]">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {fieldLabels[key] || key}
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-white/[0.06]">
              <div className="p-3 bg-red-50/60 dark:bg-red-500/[0.04]">
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1.5">Antes</p>
                {renderValue(previousState[key])}
              </div>
              <div className="p-3 bg-green-50/60 dark:bg-green-500/[0.04]">
                <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1.5">Después</p>
                {renderValue(currentState[key])}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSingleState = (state: Partial<Agent> | null) => {
    if (!state) return <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles.</p>;

    return (
      <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {(Object.keys(state) as (keyof Agent)[]).map((key) => (
          <div key={key} className="flex items-start gap-3 py-2.5">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">
              {fieldLabels[key] || key}
            </span>
            <div className="flex-1 min-w-0">{renderValue(state[key])}</div>
          </div>
        ))}
      </div>
    );
  };

  let content;
  switch (action) {
    case 'editado':
      content = renderComparison();
      break;
    case 'creado':
      content = renderSingleState(currentState || null);
      break;
    case 'eliminado':
      content = renderSingleState(previousState || null);
      break;
    default:
      content = <p className="text-sm text-gray-500 dark:text-gray-400">No se puede mostrar el detalle para esta acción.</p>;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cambio: ${agentName}`}>
      {/* Meta row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 pb-4 mb-4 border-b border-gray-100 dark:border-white/[0.08]">
        <span>
          <span className="text-gray-400 dark:text-gray-500">Usuario </span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{user}</span>
        </span>
        <span>
          <span className="text-gray-400 dark:text-gray-500">Fecha </span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {timestamp.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
          </span>
        </span>
        <span>
          <span className="text-gray-400 dark:text-gray-500">Acción </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
            actionBadgeStyles[action] ?? 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400'
          }`}>
            {action}
          </span>
        </span>
      </div>

      <div className="overflow-y-auto max-h-[55vh] custom-scrollbar pr-1">
        {content}
      </div>
    </Modal>
  );
};

export default LogDetailModal;
