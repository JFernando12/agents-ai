"use client";

import { useState } from "react";
import Changelog from "./Changelog";
import LogDetailModal from "./LogDetailModal";
import type { LogEntry } from "@/types";
import AgentDashboard from "./AgentDashboard";
import UnansweredQuestions from './Unanswered';
import ToolsCatalog from './ToolsCatalog';

export default function TabsLayout() {
  const [activeTab, setActiveTab] = useState<
    'agents' | 'changelog' | 'unanswered' | 'tools'
  >('agents');
  const [isLogDetailModalOpen, setIsLogDetailModalOpen] = useState(false);
  const [selectedLogEntry, setSelectedLogEntry] = useState<LogEntry | null>(
    null,
  );

  const handleViewLogDetails = (log: LogEntry) => {
    setSelectedLogEntry(log);
    setIsLogDetailModalOpen(true);
  };

  const handleCloseLogDetailModal = () => {
    setIsLogDetailModalOpen(false);
    setSelectedLogEntry(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 border-b flex-shrink-0">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-2 text-lg font-medium transition-colors ${
              activeTab === 'agents'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Centro de Agentes
          </button>
          <button
            onClick={() => setActiveTab('unanswered')}
            className={`px-2 text-lg font-medium transition-colors ${
              activeTab === 'unanswered'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sin Respuesta
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-2 text-lg font-medium transition-colors ${
              activeTab === 'tools'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Herramientas
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`px-2 text-lg font-medium transition-colors ${
              activeTab === 'changelog'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Log de Cambios
          </button>
        </nav>
      </div>

      {/* ✅ Conditional rendering controlado */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'agents' ? (
          <AgentDashboard />
        ) : activeTab === 'unanswered' ? (
          <UnansweredQuestions />
        ) : activeTab === 'tools' ? (
          <ToolsCatalog />
        ) : (
          <Changelog onViewDetails={handleViewLogDetails} />
        )}
      </div>

      <LogDetailModal
        isOpen={isLogDetailModalOpen}
        onClose={handleCloseLogDetailModal}
        logEntry={selectedLogEntry}
      />
    </div>
  );
}
