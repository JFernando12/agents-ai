import React, { useState } from "react";
import type { Agent } from "@/types";
import { AgentIcon } from "./AgentIcon";
import { PlusIcon, PencilIcon, TrashIcon } from "./icons";

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
      className="bg-[#232A37] rounded-lg p-4 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div>
        <div className="flex items-center mb-3">
          <AgentIcon name={agent.icon} className="w-8 h-8 mr-3" />
          <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4 truncate">
          {agent.description}
        </p>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => onEdit(agent)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
        >
          <PencilIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(agent)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AgentCard;
