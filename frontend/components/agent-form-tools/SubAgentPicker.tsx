'use client';

import { Search, X, Check } from 'lucide-react';
import { Agent } from '@/types';
import { AgentIcon } from '@/components/agents/AgentIcon';

interface SubAgentPickerProps {
  agents: Agent[];
  assignedSubAgentIds: string[];
  currentAgentId: string | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  onToggle: (agentId: string) => void;
  onClose: () => void;
}

export function SubAgentPicker({
  agents,
  assignedSubAgentIds,
  currentAgentId,
  search,
  onSearchChange,
  onToggle,
  onClose,
}: SubAgentPickerProps) {
  const searchLower = search.toLowerCase();

  // Exclude the current agent (self-reference) and filter by search
  const filtered = agents.filter(
    (a) =>
      a.id !== currentAgentId &&
      (!searchLower ||
        a.name.toLowerCase().includes(searchLower) ||
        (a.description ?? '').toLowerCase().includes(searchLower)),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Agregar sub-agentes
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Selecciona los agentes que quieres asignar como sub-agentes de
              este agente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              {search
                ? `Sin resultados para "${search}".`
                : 'No hay otros agentes disponibles.'}
            </p>
          )}
          {filtered.map((agent) => {
            const isAssigned = assignedSubAgentIds.includes(agent.id);
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onToggle(agent.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  isAssigned
                    ? 'border-indigo-600 bg-indigo-600/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* Checkbox */}
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isAssigned
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {isAssigned && <Check className="w-3 h-3" />}
                </span>

                {/* Agent icon */}
                <span className="flex-shrink-0">
                  <AgentIcon name={agent.icon} className="w-6 h-6" />
                </span>

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {agent.name}
                  </p>
                  {agent.description && (
                    <p className="text-xs text-gray-400 truncate">
                      {agent.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {assignedSubAgentIds.length} sub-agente
            {assignedSubAgentIds.length !== 1 ? 's' : ''} seleccionado
            {assignedSubAgentIds.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

