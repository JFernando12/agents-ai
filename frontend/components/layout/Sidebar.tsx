'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useUser } from '@/contexts/UserContext';
import { can, getRoleLabel } from '@/lib/permissions';
import {
  Bot,
  HelpCircle,
  MessageCircle,
  MessagesSquare,
  Wrench,
  ScrollText,
  Sun,
  Moon,
  Sparkles,
  Users,
  LogOut,
  Building2,
  Activity,
  DatabaseZap,
  FlaskConical,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/agents', label: 'Centro de Agentes', icon: Bot },
  { href: '/conversations', label: 'Conversaciones', icon: MessagesSquare },
  { href: '/unanswered', label: 'Escalaciones', icon: HelpCircle },
  { href: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/tools', label: 'Herramientas', icon: Wrench },
  { href: '/execution-logs', label: 'Ejecuciones', icon: Activity },
  { href: '/rag-traces', label: 'RAG Analytics', icon: DatabaseZap },
  { href: '/eval-sets', label: 'Eval Sets', icon: FlaskConical },
  { href: '/changelog', label: 'Log de Cambios', icon: ScrollText },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const showSettings = can(user?.role, 'view_users');
  const showAccount = can(user?.role, 'manage_account');

  return (
    <aside className="w-58 flex-shrink-0 h-screen flex flex-col bg-white dark:bg-[#111111] shadow-[1px_0_0_0_rgb(0,0,0,0.06)] dark:shadow-[1px_0_0_0_rgb(255,255,255,0.06)] transition-colors duration-300">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 shadow-[0_1px_0_0_rgb(0,0,0,0.06)] dark:shadow-[0_1px_0_0_rgb(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-[15px] text-gray-900 dark:text-white tracking-tight select-none">
            Agents AI
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider select-none">
          Principal
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {label}
            </Link>
          );
        })}

        {/* Settings section */}
        {(showSettings || showAccount) && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider select-none">
                Configuración
              </p>
            </div>
            {[
              ...(showAccount
                ? [
                    {
                      href: '/settings/account',
                      label: 'Cuenta',
                      icon: Building2,
                    },
                  ]
                : []),
              ...(showSettings
                ? [{ href: '/settings/users', label: 'Usuarios', icon: Users }]
                : []),
            ].map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 shadow-[0_-1px_0_0_rgb(0,0,0,0.06)] dark:shadow-[0_-1px_0_0_rgb(255,255,255,0.06)] space-y-0.5">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100 w-full transition-all duration-150"
          >
            {isDark ? (
              <Sun
                className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0"
                strokeWidth={2}
              />
            ) : (
              <Moon
                className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0"
                strokeWidth={2}
              />
            )}
            <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 w-full transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          <span>Cerrar sesión</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {user?.name ?? 'Usuario'}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
              {user?.role ? getRoleLabel(user.role) : ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

