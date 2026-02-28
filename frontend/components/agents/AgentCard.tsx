import React from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/types';
import { TrashIcon } from '../ui/icons';
import { Pencil, ChevronRight, Globe, Lock, Wrench, Bot } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onDelete: (agent: Agent) => void;
}

const MODEL_LABELS: Record<string, string> = {
  'claude-haiku-3.5': 'Haiku 3.5',
  'claude-sonnet-3.5': 'Sonnet 3.5',
  'claude-sonnet-4-6': 'Sonnet 4.6',
  'claude-sonnet-4': 'Sonnet 4',
  'claude-opus-4': 'Opus 4',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o mini',
};

const AgentCard: React.FC<AgentCardProps> = ({ agent, onDelete }) => {
  const router = useRouter();
  const modelLabel = MODEL_LABELS[agent.model] ?? agent.model;
  const toolCount = (agent.tools ?? []).filter((t) => t.enabled).length;

  return (
    <div
      className="group flex items-center gap-3 px-5 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
      onClick={() => router.push(`/agents/${agent.id}/edit`)}
    >
      {/* Agent icon */}
      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {agent.name}
          </p>
          {agent.isPublic ? (
            <Globe className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
          ) : (
            <Lock className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
          )}
        </div>
        {agent.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
            {agent.description}
          </p>
        )}
      </div>

      {/* Tools count */}
      {toolCount > 0 && (
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500 flex-shrink-0">
          <Wrench className="w-3 h-3" />
          {toolCount}
        </span>
      )}

      {/* Model badge */}
      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 w-24 justify-center flex-shrink-0 whitespace-nowrap">
        {modelLabel}
      </span>

      {/* Actions + chevron — fixed width so column header can align */}
      <div
        className="flex items-center justify-end gap-0.5 w-[82px] flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => router.push(`/agents/${agent.id}/edit`)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(agent)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
            title="Eliminar"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      </div>
    </div>
  );
};

export default AgentCard;
