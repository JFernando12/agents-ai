'use client';

import { Search, X, Check } from 'lucide-react';
import { Tool } from '@/types';
import { ToolGroup } from './utils';
import { MethodBadge } from './MethodBadge';

interface CatalogPickerProps {
  tools: Tool[];
  pickerGrouped: ToolGroup;
  assignedToolIds: string[];
  catalogSearch: string;
  onSearchChange: (value: string) => void;
  onToggle: (toolId: string) => void;
  onClose: () => void;
}

export function CatalogPicker({
  tools,
  pickerGrouped,
  assignedToolIds,
  catalogSearch,
  onSearchChange,
  onToggle,
  onClose,
}: CatalogPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Agregar capacidades
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Selecciona las capacidades del catálogo que quieres asignar a este
              agente.
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
              placeholder="Buscar por nombre, función o producto..."
              value={catalogSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tool list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {tools.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              El catálogo está vacío.
            </p>
          )}
          {pickerGrouped.length === 0 && catalogSearch && (
            <p className="text-sm text-gray-400 text-center py-6">
              Sin resultados para &quot;{catalogSearch}&quot;.
            </p>
          )}
          {pickerGrouped.map(({ section, tools: sectionTools }) => (
            <div key={section} className="space-y-1">
              {section && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    {section}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}
              {sectionTools.map((tool) => {
                const isAssigned = assignedToolIds.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onToggle(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      isAssigned
                        ? 'border-indigo-600 bg-indigo-600/5'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isAssigned
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {isAssigned && <Check className="w-3 h-3" />}
                    </span>
                    <MethodBadge method={tool.method} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {tool.display_name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono truncate">
                        {tool.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 rounded-b-xl">
          <span className="text-xs text-gray-500">
            {assignedToolIds.length} capacidad
            {assignedToolIds.length !== 1 ? 'es' : ''} asignada
            {assignedToolIds.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

