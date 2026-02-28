import React, { useState } from "react";
import type { Agent } from "@/types";
import { AgentIcon } from "./AgentIcon";
import { PlusIcon, PencilIcon, TrashIcon } from "../ui/icons";

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onEdit,
  onDelete,
}: AgentCardProps) => {
  return (
    <div
      key={agent.id}
      className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl p-4 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div>
        <div className="flex items-center mb-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mr-3 flex-shrink-0">
            <AgentIcon
              name={agent.icon}
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {agent.name}
          </h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {agent.description}
        </p>
      </div>
      <div className="flex justify-end space-x-1">
        <button
          onClick={() => onEdit(agent)}
          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(agent)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AgentCard;

