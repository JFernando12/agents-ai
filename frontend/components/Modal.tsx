import React from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div
        className={`bg-white rounded-xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden ${
          size === 'full'
            ? 'h-[90vh] w-[95vw] max-w-7xl'
            : 'max-h-[90vh] w-auto max-w-2xl'
        }`}
      >
        <div className="p-3 bg-[#232A37] flex justify-center items-center flex-shrink-0 relative min-h-fit">
          <h2 className="text-xl font-bold text-white font-oswald uppercase">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-1/2 right-4 sm:right-6 -translate-y-1/2 text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div className="px-4 py-2 flex-1 overflow-y-auto">{children}</div>
      </div>
      <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
    </div>
  );
};

export default Modal;