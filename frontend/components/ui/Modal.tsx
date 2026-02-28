import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'auto' | 'full';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'auto',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div
        className={`bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden ${
          size === 'full'
            ? 'h-[90vh] w-[95vw] max-w-7xl'
            : 'max-h-[90vh] w-full max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.08]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0 ml-3"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;