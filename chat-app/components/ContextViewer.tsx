import React, { useState } from "react";
import { ContextData } from "@/types";
import { ContextItem } from "./ContextItem";

interface ContextViewerProps {
  contextData: ContextData;
}

export const ContextViewer: React.FC<ContextViewerProps> = ({ contextData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { contexts, search_info } = contextData;

  if (!contexts || contexts.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Contextos utilizados ({contexts.length})
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {search_info.total_documents_found} documentos encontrados
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 bg-white dark:bg-slate-700">
          <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Información de búsqueda
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                <span className="font-semibold">Queries usadas:</span>{" "}
                {search_info.queries_used.join(", ")}
              </div>
              <div>
                <span className="font-semibold">Contextos utilizados:</span>{" "}
                {search_info.contexts_used}
              </div>
              <div>
                <span className="font-semibold">Longitud del contexto:</span>{" "}
                {search_info.context_length.toLocaleString()} caracteres
              </div>
              <div>
                <span className="font-semibold">Agent ID:</span>{" "}
                {search_info.agent_id}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Contextos ({contexts.length})
            </h4>
            {contexts.map((context, index) => (
              <ContextItem key={index} context={context} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
