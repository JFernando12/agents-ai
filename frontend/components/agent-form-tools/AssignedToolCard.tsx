'use client';

import {
  Loader2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link2Off,
} from 'lucide-react';
import { Tool } from '@/types';
import { MethodBadge } from './MethodBadge';

interface AssignedToolCardProps {
  tool: Tool;
  isEnabled: boolean;
  isExpanded: boolean;
  isDeleting: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onUnassign: () => void;
  onDelete: () => void;
}

export function AssignedToolCard({
  tool,
  isEnabled,
  isExpanded,
  isDeleting,
  onToggleExpand,
  onToggleActive,
  onEdit,
  onUnassign,
  onDelete,
}: AssignedToolCardProps) {
  return (
    <div
      className={`border rounded-lg overflow-hidden transition-opacity ${
        isEnabled ? 'border-gray-200' : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        {/* Info */}
        <div className="flex items-center gap-3 min-w-0">
          <MethodBadge method={tool.method} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {tool.display_name}
            </p>
            <p className="text-xs text-gray-400 font-mono truncate">
              {tool.name}
            </p>
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

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
            title="Ver detalles"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onUnassign}
            className="p-1.5 rounded hover:bg-orange-50 text-gray-400 hover:text-orange-600"
            title="Desasignar de este agente"
          >
            <Link2Off className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
            title="Eliminar del catálogo"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2 text-xs">
          <p className="text-gray-600">{tool.description}</p>
          <div className="flex gap-1 items-center">
            <span className="text-gray-400 font-medium">URL:</span>
            <span className="font-mono text-gray-700 truncate">{tool.url}</span>
          </div>
          {tool.headers && Object.keys(tool.headers).length > 0 && (
            <div>
              <span className="text-gray-400 font-medium">Headers:</span>
              <div className="mt-1 space-y-0.5">
                {Object.entries(tool.headers).map(([k, v]) => (
                  <div key={k} className="font-mono text-gray-600">
                    <span className="text-blue-600">{k}</span>:{' '}
                    <span className="text-gray-500">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tool.input_schema?.properties &&
            Object.keys(tool.input_schema.properties).length > 0 && (
              <div>
                <span className="text-gray-400 font-medium">Parámetros:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(tool.input_schema.properties).map(
                    ([name, prop]) => (
                      <span
                        key={name}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono ${
                          tool.input_schema.required?.includes(name)
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {name}
                        <span className="text-gray-400">:{prop.type}</span>
                        {tool.input_schema.required?.includes(name) && (
                          <span className="text-blue-400 text-[10px]">req</span>
                        )}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
