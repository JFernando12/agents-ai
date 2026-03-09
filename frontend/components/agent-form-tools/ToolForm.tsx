'use client';

import { Loader2, Plus, X } from 'lucide-react';
import {
  HTTP_METHODS,
  PARAM_TYPES,
  labelClass,
  formControlClass,
} from './constants';
import { Param, HeaderRow, ToolFormState } from './types';
import { toSnakeCase } from './utils';

interface ToolFormProps {
  mode: 'create' | 'edit';
  form: ToolFormState;
  isMutating: boolean;
  jsonError: string | null;
  onFormChange: (updater: (prev: ToolFormState) => ToolFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onSwitchToBuilder: () => void;
  onSwitchToJson: () => void;
}

export function ToolForm({
  mode,
  form,
  isMutating,
  jsonError,
  onFormChange,
  onSubmit,
  onCancel,
  onSwitchToBuilder,
  onSwitchToJson,
}: ToolFormProps) {
  const handleParamChange = (
    index: number,
    field: keyof Param,
    value: string | boolean,
  ) => {
    onFormChange((prev) => {
      const params = [...prev.params];
      params[index] = { ...params[index], [field]: value };
      return { ...prev, params };
    });
  };

  const handleHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    onFormChange((prev) => {
      const headerRows = [...prev.headerRows];
      headerRows[index] = { ...headerRows[index], [field]: value };
      return { ...prev, headerRows };
    });
  };

  const addParam = () =>
    onFormChange((prev) => ({
      ...prev,
      params: [
        ...prev.params,
        { name: '', type: 'string', description: '', required: false },
      ],
    }));

  const removeParam = (i: number) =>
    onFormChange((prev) => ({
      ...prev,
      params: prev.params.filter((_, j) => j !== i),
    }));

  const addHeader = () =>
    onFormChange((prev) => ({
      ...prev,
      headerRows: [...prev.headerRows, { key: '', value: '' }],
    }));

  const removeHeader = (i: number) =>
    onFormChange((prev) => ({
      ...prev,
      headerRows: prev.headerRows.filter((_, j) => j !== i),
    }));

  return (
    <div className="space-y-4 p-2 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-800">
          {mode === 'create' ? 'Nueva Capacidad' : 'Editar Capacidad'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Section */}
      <div>
        <label className={labelClass}>
          Sección{' '}
          <span className="text-xs text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          className={formControlClass}
          value={form.section}
          onChange={(e) =>
            onFormChange((p) => ({ ...p, section: e.target.value }))
          }
          placeholder="ej. Gestión de Tickets"
        />
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Nombre visible *</label>
          <input
            type="text"
            className={formControlClass}
            value={form.display_name}
            onChange={(e) => {
              const value = e.target.value;
              onFormChange((prev) => ({
                ...prev,
                display_name: value,
                ...(mode === 'create' ? { name: toSnakeCase(value) } : {}),
              }));
            }}
            placeholder="ej. Crear Ticket de Jira"
          />
        </div>
        <div>
          <label className={labelClass}>
            Nombre de función *
            <span className="ml-1 text-xs text-gray-400">
              (snake_case, sin espacios)
            </span>
          </label>
          <input
            type="text"
            className={formControlClass}
            value={form.name}
            onChange={(e) =>
              onFormChange((p) => ({ ...p, name: toSnakeCase(e.target.value) }))
            }
            placeholder="ej. crear_ticket_jira"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Descripción para el LLM *</label>
        <textarea
          rows={2}
          className={formControlClass}
          value={form.description}
          onChange={(e) =>
            onFormChange((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Describe qué hace esta capacidad y cuándo usarla..."
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1">
          <label className={labelClass}>Método</label>
          <select
            className={`${formControlClass} bg-white`}
            value={form.method}
            onChange={(e) =>
              onFormChange((p) => ({
                ...p,
                method: e.target.value as ToolFormState['method'],
              }))
            }
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3">
          <label className={labelClass}>URL *</label>
          <input
            type="text"
            className={formControlClass}
            value={form.url}
            onChange={(e) =>
              onFormChange((p) => ({ ...p, url: e.target.value }))
            }
            placeholder="https://api.ejemplo.com/endpoint"
          />
        </div>
      </div>

      {/* Headers */}
      <div className="border-t pt-3">
        <label className={labelClass}>Headers (opcional)</label>
        <div className="space-y-2">
          {form.headerRows.map((row: HeaderRow, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                className={`${formControlClass} flex-1`}
                placeholder="Clave"
                value={row.key}
                onChange={(e) => handleHeaderChange(i, 'key', e.target.value)}
              />
              <input
                type="text"
                className={`${formControlClass} flex-1`}
                placeholder="Valor"
                value={row.value}
                onChange={(e) => handleHeaderChange(i, 'value', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeHeader(i)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addHeader}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Agregar header
          </button>
        </div>
      </div>

      {/* Input schema */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className={`${labelClass} mb-0`}>Parámetros de entrada</label>
          <div className="flex bg-gray-100 rounded-md p-0.5 text-xs">
            <button
              type="button"
              onClick={onSwitchToBuilder}
              className={`px-3 py-1 rounded-md transition-colors ${
                form.schemaMode === 'builder'
                  ? 'bg-white shadow text-gray-800 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Builder
            </button>
            <button
              type="button"
              onClick={onSwitchToJson}
              className={`px-3 py-1 rounded-md transition-colors ${
                form.schemaMode === 'json'
                  ? 'bg-white shadow text-gray-800 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        {form.schemaMode === 'builder' ? (
          <div className="space-y-2">
            {form.params.map((param: Param, i: number) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg"
              >
                <input
                  type="text"
                  className={`${formControlClass} col-span-3`}
                  placeholder="nombre"
                  value={param.name}
                  onChange={(e) => handleParamChange(i, 'name', e.target.value)}
                />
                <select
                  className={`${formControlClass} bg-white col-span-2`}
                  value={param.type}
                  onChange={(e) => handleParamChange(i, 'type', e.target.value)}
                >
                  {PARAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className={`${formControlClass} col-span-5`}
                  placeholder="descripción para el LLM"
                  value={param.description}
                  onChange={(e) =>
                    handleParamChange(i, 'description', e.target.value)
                  }
                />
                <div className="col-span-1 flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    title="Requerido"
                    checked={param.required}
                    onChange={(e) =>
                      handleParamChange(i, 'required', e.target.checked)
                    }
                    className="w-4 h-4 text-gray-900"
                  />
                  <span className="text-xs text-gray-400">req</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeParam(i)}
                  className="col-span-1 text-gray-400 hover:text-red-500 flex justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addParam}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Agregar parámetro
            </button>
          </div>
        ) : (
          <div>
            <textarea
              rows={8}
              className={`${formControlClass} font-mono`}
              value={form.jsonSchema}
              onChange={(e) =>
                onFormChange((p) => ({ ...p, jsonSchema: e.target.value }))
              }
            />
            {jsonError && (
              <p className="text-xs text-red-500 mt-1">{jsonError}</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isMutating || !form.display_name || !form.name || !form.url}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
          {isMutating ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

