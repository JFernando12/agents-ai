import { Loader2 } from "lucide-react";
import Modal from "./Modal";

interface ModalDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isLoading?: boolean;
  message?: string;
}

const ModalDelete = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  message = '¿Estás seguro de que quieres eliminar al agente? Esta acción no se puede deshacer.',
}: ModalDeleteProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Eliminación">
      <div className="w-full max-w-md">
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 justify-center"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDelete;
