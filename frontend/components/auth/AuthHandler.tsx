"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

export default function AuthHandler({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user, setUser } = useUser();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      verifyJWT(token);
      return;
    }

    if (user) {
      setIsAuthenticated(true);
      setIsVerifying(false);
      return;
    }

    setError('No authentication token provided.');
    setIsVerifying(false);
  }, [searchParams, user]);

  const verifyJWT = async (token: string) => {
    try {
      setIsVerifying(true);
      const response = await fetch('/api/verify-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = {
          ...data.user,
          token: token,
        };

        setUser(userData);

        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());

        setIsAuthenticated(true);
      } else {
        setError('Invalid token provided.');
      }
    } catch (err) {
      console.error('JWT verification error:', err);
      setError('Failed to verify token. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Authentication
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your credentials...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p>{error}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
            <p className="text-sm">
              <strong>Note:</strong> This application can only be accessed
              through the authorized external application with a valid
              authentication token.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
