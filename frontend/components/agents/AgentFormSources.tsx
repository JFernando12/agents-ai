import { useMemo, useRef, useState } from 'react';
import { Agent } from '@/types';
import { useDocuments, useUploadDocument } from '@/lib/hooks/useDocuments';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import DocumentItem from '../ui/DocumentItem';

interface AgentFormSourcesProps {
  agent: Agent | null;
}

const label =
  'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';
const input =
  'w-full px-3 py-2 text-sm bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors';

const AgentFormSources = ({ agent }: AgentFormSourcesProps) => {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFuenteId, setSelectedFuenteId] = useState<string | null>(null);
  const [newFileData, setNewFileData] = useState<{
    file: File;
    name: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading } = useDocuments({ serviceId: agent?.id });
  const uploadDocument = useUploadDocument();

  const selectedFuente = useMemo(
    () => documents?.find((f) => f.id === selectedFuenteId) || null,
    [selectedFuenteId, documents],
  );

  const filteredDocuments = documents || [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!agent?.id || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setNewFileData({
      file,
      name: file.name,
    });
    setShowUpload(true);
  };

  const handleSaveNewFuente = async () => {
    if (!agent?.id || !newFileData) return;
    await uploadDocument.mutateAsync({
      serviceId: agent.id,
      data: {
        file: newFileData.file,
        name: newFileData.name,
      },
    });
    setNewFileData(null);
    setShowUpload(false);
  };

  const handleSelectFuente = (fuenteId: string) => {
    setSelectedFuenteId(fuenteId);
  };

  const handleCancelUpload = () => {
    setNewFileData(null);
    setShowUpload(false);
  };

  return (
    <div className="space-y-4">
      {/* ── Header row: upload button ── */}
      <div className="flex items-center justify-end border-b border-gray-100 dark:border-white/[0.06] pb-0">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 mb-1 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Subir documento
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* ── Inline upload form ── */}
      {showUpload && newFileData && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-500/[0.04] p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Nuevo documento
            </p>
            <button
              type="button"
              onClick={handleCancelUpload}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className={label}>Nombre del archivo</label>
            <input
              type="text"
              value={newFileData.name}
              className={input}
              onChange={(e) =>
                setNewFileData((d) =>
                  d ? { ...d, name: e.target.value } : null,
                )
              }
            />
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={handleSaveNewFuente}
              disabled={uploadDocument.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {uploadDocument.isPending && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {uploadDocument.isPending ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </div>
      )}

      {/* ── Document list ── */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center py-8 gap-2 text-gray-400 dark:text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
            {filteredDocuments.map((fuente) => (
              <DocumentItem
                key={fuente.id}
                fuente={fuente}
                selectedFuenteId={selectedFuenteId}
                handleSelectFuente={handleSelectFuente}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
              <FileText className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sin documentos
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Usa «Subir documento» para agregar uno.
            </p>
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      {selectedFuente && (
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            Detalles del documento
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              { key: 'Nombre', val: selectedFuente.name },
              { key: 'Última actualización', val: selectedFuente.lastUpdated },
            ].map(({ key, val }) => (
              <div key={key}>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                  {key}
                </p>
                <p className="text-gray-800 dark:text-gray-200 text-sm">
                  {val || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentFormSources;
