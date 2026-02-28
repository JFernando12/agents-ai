"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

const PUBLIC_PATHS = ['/login', '/register'];

/**
 * AuthGuard - Redirects unauthenticated users to /login.
 * Replaces the old dev-token auto-generation flow.
 */
export default function AutoAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublic) {
      router.replace('/login');
    } else if (user && isPublic) {
      router.replace('/agents');
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#111111]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
