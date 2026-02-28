import { Agent, Chat } from "@/types";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from "./Icons";
import { useUser } from "@/contexts/UserContext";
import { useThemeToggle } from "@/lib/hooks/useThemeToggle";
import { AgentIcon } from "./AgentIcon";
import { useContextVisibility } from '@/contexts/ContextVisibilityContext';

const UserMenu: React.FC<{
  onLogout: () => void;
}> = ({ onLogout }) => {
  const { theme, toggleTheme, isLoading } = useThemeToggle();
  const { user } = useUser();
  const { showContexts, toggleContextVisibility } = useContextVisibility();

  return (
    <div className="absolute top-14 right-0 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-10">
      <div className="p-4 space-y-2 text-sm">
        <p className="text-gray-300">
          <span className="font-semibold text-gray-100">Nombre: </span>
          {user?.name || ''}
        </p>
        <p className="text-gray-300">
          <span className="font-semibold text-gray-100">Correo: </span>
          {user?.email || ''}
        </p>
        <p className="text-gray-300">
          <span className="font-semibold text-gray-100">Tipo: </span>
          {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
        </p>
      </div>
      <div className="border-t border-slate-600 p-2 space-y-1">
        <button
          onClick={toggleContextVisibility}
          className="w-full flex items-center text-left px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded-md transition-colors"
        >
          <svg
            className="w-5 h-5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {showContexts ? 'Ocultar Contextos' : 'Mostrar Contextos'}
        </button>
        <button
          onClick={toggleTheme}
          disabled={isLoading}
          className="w-full flex items-center text-left px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          ) : theme === 'light' ? (
            <MoonIcon className="w-5 h-5 mr-3" />
          ) : (
            <SunIcon className="w-5 h-5 mr-3" />
          )}
          {isLoading
            ? 'Cargando...'
            : theme === 'light'
            ? 'Modo Oscuro'
            : 'Modo Claro'}
        </button>
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded-md transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

const Header: React.FC<{
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  activeAgent: Agent | null;
  onDeselectProfile: () => void;
}> = ({
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  activeAgent,
  onDeselectProfile,
}) => {
  const { user } = useUser();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);


  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700/50 relative">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 mr-4 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <MenuIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        {activeAgent && (
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Perfil:
            </span>
            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-full px-3 py-1 text-sm">
              <AgentIcon name={activeAgent.icon} className="w-3 h-4 mr-2" />
              <span className="font-medium text-gray-800 dark:text-white">
                {activeAgent?.name}
              </span>
              <button
                onClick={onDeselectProfile}
                className="ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="w-48 px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="p-2 rounded-full">
          <SearchIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer
          bg-blue-600"
            aria-haspopup={true}
            aria-expanded={isUserMenuOpen}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </button>
          {isUserMenuOpen && <UserMenu onLogout={onLogout} />}
        </div>
      </div>
    </header>
  );
};

export default Header;