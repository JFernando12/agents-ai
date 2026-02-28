'use client';

import { Link2Off, Bot } from 'lucide-react';
import { Agent } from '@/types';

interface AssignedSubAgentCardProps {
  agent: Agent;
  isEnabled: boolean;
  onToggleActive: () => void;
  onUnassign: () => void;
}

export function AssignedSubAgentCard({
  agent,
  isEnabled,
  onToggleActive,
  onUnassign,
}: AssignedSubAgentCardProps) {
  return (
    <div
      className={`border rounded-lg overflow-hidden transition-opacity ${
        isEnabled ? 'border-gray-200' : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        {/* Info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Agent icon */}
          <div className="w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {/* Enable / disable toggle (per-agent) */}
          <button
            type="button"
            onClick={onToggleActive}
            title={
              isEnabled
                ? 'Deshabilitar para este agente'
                : 'Habilitar para este agente'
            }
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              isEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                isEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Unassign */}
          <button
            type="button"
            onClick={onUnassign}
            title="Quitar sub-agente"
            className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
          >
            <Link2Off className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
