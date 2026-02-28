import React from "react";
import type { LogsResponse,LogEntry, LastKey } from "@/types";
import { useLogs } from "@/lib/hooks/useLogs";

interface ChangelogProps {
  onViewDetails: (log: LogEntry) => void;
}

const Changelog: React.FC<ChangelogProps> = ({ onViewDetails }) => {

  const [limit, setLimit] = React.useState(5);
  const [lastKey, setLastKey] = React.useState<LastKey | null>(null);
  const [nextKey, setNextKey] = React.useState<LastKey | null>(null);
  const [history, setHistory] = React.useState<(LastKey | null)[]>([]);
  const [page, setPage] = React.useState(1);

  const { data } = useLogs(limit, lastKey);

  const logs = data?.items ?? [];
  const hasMore = data?.hasMore ?? false;
  const totalKnownPages = history.length + 1;
  const canShowNext = hasMore ? 1 : 0;
  const maxPages = totalKnownPages + canShowNext;

  let start = Math.max(1, page - 1);
  let end = Math.min(maxPages, start + 3);
  start = Math.max(1, end - 3);


  React.useEffect(() => {
    if (data?.lastKey) {
      setNextKey(data.lastKey);
    } else {
      setNextKey(null);
    }
  }, [data]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setLastKey(null);
    setHistory([]);
    setPage(1);
  };

  const goNext = () => {
    if (!hasMore || !nextKey) return;

    setHistory(prev => {
      if (prev.length < page) {
        return [...prev, lastKey];
      }
      return prev;
    });

    setLastKey(nextKey);
    setPage(p => p + 1);
  };
  
 const goPrev = () => {
    if (page === 1) return;

    const newPage = page - 1;
    const prevKey = newPage === 1 ? null : history[newPage - 2];

    setLastKey(prevKey);
    setPage(newPage);
  };

  const getActionStyles = (action: LogEntry["action"]) => {
    switch (action) {
      case "creado":
        return "bg-green-100 text-green-800";
      case "editado":
        return "bg-yellow-100 text-yellow-800";
      case "eliminado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-4xl text-[#232A37] uppercase font-oswald mb-6">
            Log de Cambios
          </h1>
        </div>
        <div className="">
          <label className="text-[#232A37] mr-2">Registros por página:</label>

          <select
            className="text-[#232A37] p-[5px] border rounded-md text-sm"
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
          <table className="w-full text-sm text-left text-gray-500 table-fixed">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 w-[20%]">
                  Agente
                </th>
                <th scope="col" className="px-6 py-3 w-[10%]">
                  Acción
                </th>
                <th scope="col" className="px-6 py-3 w-[25%]">
                  Detalles
                </th>
                <th scope="col" className="px-6 py-3 w-[20%]">
                  Usuario
                </th>
                <th scope="col" className="px-6 py-3 w-[25%]">
                  Fecha y Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                  >
                    {log.agentName}
                  </th>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getActionStyles(
                        log.action,
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <button
                      onClick={() => onViewDetails(log)}
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
              {(() => {
                const totalKnownPages = page + (hasMore ? 1 : 0);
                const maxPages = totalKnownPages + (hasMore ? 1 : 0);

                let start = Math.max(1, page - 1);
                let end = Math.min(maxPages, start + 2);
                start = Math.max(1, end - 2);

                return Array.from({ length: end - start + 1 }).map((_, i) => {
                  const pageNumber = start + i;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => {
                        if (pageNumber === page) return;

                        const key =
                          pageNumber === 1 ? null : history[pageNumber - 3];

                        setLastKey(key || null);
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
                });
              })()}
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
  );
};

export default Changelog;
