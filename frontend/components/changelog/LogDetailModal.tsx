import React from 'react';
import type { LogEntry, Agent } from '@/types';
import Modal from '../ui/Modal';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logEntry: LogEntry | null;
}

const LogDetailModal: React.FC<LogDetailModalProps> = ({
  isOpen,
  onClose,
  logEntry,
}) => {
  if (!isOpen || !logEntry) return null;

  const { action, previousState, currentState, agentName, user, timestamp } =
    logEntry;

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

  const renderValue = (value: any) => {
    if (typeof value === 'boolean') {
      return <span className="text-sm">{value ? 'Público' : 'Privado'}</span>;
    }
    if (typeof value === 'string' && value.length > 100) {
      return (
        <pre className="whitespace-pre-wrap font-sans text-sm">{value}</pre>
      );
    }
    return <span className="text-sm text-gray-700">{value?.toString() ?? 'N/A'}</span>;
  };

  const renderComparison = () => {
    if (!previousState || !currentState) return null;

    const allKeys = Array.from(
      new Set([...Object.keys(previousState), ...Object.keys(currentState)])
    ) as (keyof Agent)[];

    return (
      <div className="space-y-4">
        {allKeys.map((key) => {
          const before = previousState[key];
          const after = currentState[key];

          if (JSON.stringify(before) !== JSON.stringify(after)) {
            return (
              <div key={key}>
                <h4 className="font-semibold text-gray-700 capitalize mb-2">
                  {fieldLabels[key] || key}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-xs font-bold text-red-700 mb-1">Antes</p>
                    {renderValue(before)}
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs font-bold text-green-700 mb-1">
                      Después
                    </p>
                    {renderValue(after)}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const renderSingleState = (state: Partial<Agent> | null, title: string) => {
    if (!state) return <p>No hay datos disponibles.</p>;

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-lg text-gray-800 mb-2">{title}</h4>
        {(Object.keys(state) as (keyof Agent)[]).map((key) => (
          <div key={key} className="border-b pb-2">
            <p className="font-semibold text-gray-600 capitalize">
              {fieldLabels[key] || key}
            </p>
            {renderValue(state[key])}
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
      content = renderSingleState(
        currentState || null,
        'Valores del nuevo agente'
      );
      break;
    case 'eliminado':
      content = renderSingleState(
        previousState || null,
        'Valores del agente eliminado'
      );
      break;
    default:
      content = <p>No se puede mostrar el detalle para esta acción.</p>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle del Cambio: ${agentName}`}
    >
      <div className="text-sm text-gray-600 mb-4 border-b pb-4">
        <p>
          <strong>Usuario:</strong> {user}
        </p>
        <p>
          <strong>Fecha:</strong>{' '}
          {timestamp.toLocaleString('es-MX', {
            dateStyle: 'full',
            timeStyle: 'long',
          })}
        </p>
        <p>
          <strong>Acción:</strong>{' '}
          <span className="font-semibold capitalize">{action}</span>
        </p>
      </div>
      <div className="overflow-y-auto pr-2 max-h-[60vh] w-3xl">{content}</div>
    </Modal>
  );
};

export default LogDetailModal;
