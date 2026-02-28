import type { Agent } from "@/types";
import AgentCard from "./AgentCard";
import { useAgents } from "@/lib/hooks/useAgents";
import { Bot } from 'lucide-react';

interface AgentListProps {
  onDelete: (agent: Agent) => void;
}

const AgentList = ({ onDelete }: AgentListProps) => {
  const { data: agents } = useAgents();

  if (!agents || agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
          <Bot className="w-7 h-7 text-indigo-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sin agentes aún
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Crea tu primer agente para empezar
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
      {agents.map((agent: Agent) => (
        <AgentCard key={agent.id} agent={agent} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default AgentList;
