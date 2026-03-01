import { apiDocuments } from "@/lib/api/documents";
import { useDeleteDocument } from "@/lib/hooks/useDocuments";
import { DocumentStatus, Fuente } from '@/types';
import { EyeIcon, Loader2, TrashIcon } from 'lucide-react';

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendiente',
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  },
  processing: {
    label: 'Procesando',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  },
  processed: {
    label: 'Listo',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  failed: {
    label: 'Error',
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
};

interface DocumentItemProps {
  fuente: Fuente;
  selectedFuenteId: string | null;
  handleSelectFuente: (fuenteId: string) => void;
}

const DocumentItem = ({
  fuente,
  selectedFuenteId,
  handleSelectFuente,
}: DocumentItemProps) => {
  const deleteDocument = useDeleteDocument();

  const handleOpenDocument = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const presignedUrl = await apiDocuments.getDocumentPresignedUrl({
      documentId: fuente.id,
    });
    window.open(presignedUrl, '_blank');
  };

  const handleDeleteDocument = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteDocument.mutateAsync({ documentId: fuente.id });
  };

  return (
    <div
      key={fuente.id.toString()}
      onClick={() => handleSelectFuente(fuente.id)}
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        selectedFuenteId === fuente.id
          ? 'bg-indigo-50 dark:bg-indigo-500/10'
          : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      }`}
    >
      <span className="truncate text-sm text-gray-800 dark:text-gray-200">
        {fuente.name}
      </span>
      <div className="flex items-center space-x-2 flex-shrink-0">
        {fuente.status &&
          (() => {
            const cfg = STATUS_CONFIG[fuente.status] ?? {
              label: fuente.status,
              className: 'bg-gray-100 text-gray-600',
            };
            return (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${cfg.className}`}
              >
                {cfg.label}
              </span>
            );
          })()}
        <button
          type="button"
          className="p-1 hover:text-blue-400 transition-colors"
          onClick={handleOpenDocument}
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-1 hover:text-red-500 transition-colors"
          onClick={handleDeleteDocument}
          disabled={deleteDocument.isPending}
        >
          {deleteDocument.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TrashIcon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentItem;