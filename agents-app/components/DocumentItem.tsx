import { apiDocuments } from "@/lib/api/documents";
import { useDeleteDocument } from "@/lib/hooks/useDocuments";
import { Fuente } from "@/types";
import { EyeIcon, Loader2, TrashIcon } from "lucide-react";

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
  }

  return (
    <div
      key={fuente.id.toString()}
      onClick={() => handleSelectFuente(fuente.id)}
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        selectedFuenteId === fuente.id
          ? 'bg-[#374151] text-white'
          : 'hover:bg-[#2d3748]'
      }`}
    >
      <span className="truncate text-sm">{fuente.name}</span>
      <div className="flex items-center space-x-2 flex-shrink-0">
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