"use client";

import { useState, useEffect } from 'react';
import type { LogEntry, LastKey } from '@/types';
import { useLogs } from '@/lib/hooks/useLogs';
import LogDetailModal from '@/components/changelog/LogDetailModal';

function getActionStyles(action: LogEntry['action']) {
  switch (action) {
    case 'creado':
      return 'bg-green-100 text-green-800';
    case 'editado':
      return 'bg-yellow-100 text-yellow-800';
    case 'eliminado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function ChangelogPage() {
  const [limit, setLimit] = useState(5);
  const [lastKey, setLastKey] = useState<LastKey | null>(null);
  const [nextKey, setNextKey] = useState<LastKey | null>(null);
  const [history, setHistory] = useState<(LastKey | null)[]>([]);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const { data } = useLogs(limit, lastKey);

  const logs = data?.items ?? [];
  const hasMore = data?.hasMore ?? false;

  useEffect(() => {
    setNextKey(data?.lastKey ?? null);
  }, [data]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(parseInt(e.target.value, 10));
    setLastKey(null);
    setHistory([]);
    setPage(1);
  };

  const goNext = () => {
    if (!hasMore || !nextKey) return;
    setHistory((prev) => (prev.length < page ? [...prev, lastKey] : prev));
    setLastKey(nextKey);
    setPage((p) => p + 1);
  };

  const goPrev = () => {
    if (page === 1) return;
    const newPage = page - 1;
    setLastKey(newPage === 1 ? null : history[newPage - 2]);
    setPage(newPage);
  };

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const totalKnownPages = page + (hasMore ? 1 : 0);
  const maxPages = totalKnownPages + (hasMore ? 1 : 0);
  let start = Math.max(1, page - 1);
  let end = Math.min(maxPages, start + 2);
  start = Math.max(1, end - 2);

  return (
    <>
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-sm p-6 h-full flex flex-col">
        <div className="flex justify-between items-center flex-shrink-0 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Log de Cambios
          </h1>
          <div>
            <label className="text-gray-600 dark:text-gray-400 mr-2 text-sm">
              Registros por página:
            </label>
            <select
              className="text-gray-700 dark:text-gray-300 dark:bg-[#27272A] p-[5px] border border-gray-300 dark:border-white/[0.08] rounded-md text-sm"
              value={limit}
              onChange={handleLimitChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="text-gray-500">No hay cambios registrados todavía.</p>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 table-fixed">
              <thead className="text-xs text-gray-600 dark:text-gray-500 uppercase bg-gray-50 dark:bg-white/[0.04]">
                <tr>
                  <th className="px-6 py-3 w-[20%]">Agente</th>
                  <th className="px-6 py-3 w-[10%]">Acción</th>
                  <th className="px-6 py-3 w-[25%]">Detalles</th>
                  <th className="px-6 py-3 w-[20%]">Usuario</th>
                  <th className="px-6 py-3 w-[25%]">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                    >
                      {log.agentName}
                    </th>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getActionStyles(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="text-blue-600 hover:underline hover:text-blue-800 transition-colors text-left"
                      >
                        {log.details}
                      </button>
                    </td>
                    <td className="px-6 py-4">{log.user}</td>
                    <td className="px-6 py-4">
                      {log.timestamp.toLocaleString('es-MX', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end items-center gap-2">
              <button
                onClick={goPrev}
                disabled={page === 1}
                className="px-2 py-1 text-sm rounded bg-[#00a63e] text-white disabled:opacity-40"
              >
                ◀
              </button>
              <div className="flex gap-1">
                {Array.from({ length: end - start + 1 }).map((_, i) => {
                  const pageNumber = start + i;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => {
                        if (pageNumber === page) return;
                        setLastKey(
                          pageNumber === 1
                            ? null
                            : (history[pageNumber - 3] ?? null),
                        );
                        setPage(pageNumber);
                      }}
                      className={`px-2 py-1 text-sm rounded ${
                        page === pageNumber
                          ? 'bg-[#00a63e] text-white'
                          : 'bg-gray-200 text-black'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={goNext}
                disabled={!hasMore}
                className="px-2 py-1 text-sm rounded bg-[#00a63e] text-white disabled:opacity-40"
              >
                ▶
              </button>
            </div>
          </div>
        )}
      </div>

      <LogDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
        logEntry={selectedLog}
      />
    </>
  );
}
