import React from "react";

interface ContextToggleButtonProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export const ContextToggleButton: React.FC<ContextToggleButtonProps> = ({
  isEnabled,
  onToggle,
}) => {
  return (
    <div className="relative group">
      <button
        onClick={onToggle}
        className={`p-1 rounded-full transition-colors ${
          isEnabled
            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-400"
        }`}
        aria-label={isEnabled ? "Ocultar contextos" : "Mostrar contextos"}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isEnabled ? (
            // Icono de ocultar (ojo tachado)
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </>
          ) : (
            // Icono de documento/lista
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          )}
        </svg>
      </button>
      <span
        className="absolute -top-8 left-1/2 -translate-x-1/2 
        px-2 py-1 text-xs rounded bg-gray-800 text-white opacity-0 
        group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
      >
        {isEnabled ? "Ocultar contextos" : "Mostrar contextos"}
      </span>
    </div>
  );
};
