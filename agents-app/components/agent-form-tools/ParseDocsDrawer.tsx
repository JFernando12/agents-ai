'use client';

import { Loader2, Sparkles, X } from 'lucide-react';

interface ParseDocsDrawerProps {
  parseDocs: string;
  isParsing: boolean;
  parseError: string | null;
  onDocsChange: (value: string) => void;
  onParse: () => void;
  onClose: () => void;
}

export function ParseDocsDrawer({
  parseDocs,
  isParsing,
  parseError,
  onDocsChange,
  onParse,
  onClose,
}: ParseDocsDrawerProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[#232A37] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Auto-completar con IA
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Pega la documentación de la API (texto libre, cURL, Swagger, Postman…) y
            la IA rellenará el formulario automáticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        rows={6}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#232A37] text-gray-700 text-sm bg-white placeholder-gray-400"
        placeholder={`Ejemplo:\ncurl -X POST https://api.ejemplo.com/tickets \\\n  -H "Authorization: Bearer TOKEN" \\\n  -d '{"titulo": "...", "descripcion": "..."}'`}
        value={parseDocs}
        onChange={(e) => onDocsChange(e.target.value)}
      />

      {parseError && <p className="text-xs text-red-600">{parseError}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onParse}
          disabled={isParsing || !parseDocs.trim()}
          className="px-3 py-1.5 text-sm bg-[#232A37] text-white rounded-lg hover:bg-[#1a2030] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analizando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Completar formulario
            </>
          )}
        </button>
      </div>
    </div>
  );
}
