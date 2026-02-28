import React, { useState } from "react";
import { Context } from "@/types";

interface ContextItemProps {
  context: Context;
  index: number;
}

export const ContextItem: React.FC<ContextItemProps> = ({ context, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatScore = (score: number) => {
    return score != null ? score.toFixed(4) : 'N/A';
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-3 bg-gray-50 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              #{index + 1}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {context.metadata.source}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Score: {formatScore(context.score)}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {isExpanded ? context.content : truncateContent(context.content)}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isExpanded ? "Menos" : "Más"}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>
              <span className="font-semibold">Documento ID:</span> {context.metadata.document_id}
            </div>
            <div>
              <span className="font-semibold">Chunk Index:</span> {context.metadata.chunk_index}
            </div>
            <div>
              <span className="font-semibold">Timestamp:</span>{" "}
              {new Date(context.metadata.timestamp).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Rank:</span> {context.rank}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
