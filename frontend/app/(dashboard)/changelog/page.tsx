"use client";

import { useState } from "react";
import Changelog from "@/components/Changelog";
import LogDetailModal from "@/components/LogDetailModal";
import type { LogEntry } from "@/types";

export default function ChangelogPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  return (
    <>
      <Changelog onViewDetails={handleViewDetails} />
      <LogDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        logEntry={selectedLog}
      />
    </>
  );
}
