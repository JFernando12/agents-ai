"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";

/**
 * AutoAuth - Automatically generates a dev JWT if no user session exists.
 * Replace this with a real login redirect when authentication is implemented.
 */
export default function AutoAuth({ children }: { children: React.ReactNode }) {
  const { user, setUser, isLoading } = useUser();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for the context to finish loading from localStorage
    if (isLoading) return;

    // User already authenticated
    if (user) {
      setIsReady(true);
      return;
    }

    // Generate a dev token automatically
    generateDevToken();
  }, [isLoading, user]);

  const generateDevToken = async () => {
    try {
      const res = await fetch("/api/generate-token", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser({ ...data.user, token: data.token });
        setIsReady(true);
      } else {
        setError("No se pudo iniciar sesión automáticamente.");
      }
    } catch (err) {
      console.error("AutoAuth error:", err);
      setError("Error de conexión al iniciar sesión.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-md max-w-sm">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error de autenticación
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => { setError(null); generateDevToken(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Iniciando aplicación...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
