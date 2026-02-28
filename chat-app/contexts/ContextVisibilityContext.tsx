"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const CONTEXT_VISIBILITY_KEY = "showContexts";

interface ContextVisibilityContextType {
  showContexts: boolean;
  toggleContextVisibility: () => void;
}

const ContextVisibilityContext = createContext<ContextVisibilityContextType | undefined>(undefined);

export const ContextVisibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showContexts, setShowContexts] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(CONTEXT_VISIBILITY_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem(CONTEXT_VISIBILITY_KEY, JSON.stringify(showContexts));
  }, [showContexts]);

  const toggleContextVisibility = () => {
    setShowContexts((prev) => !prev);
  };

  return (
    <ContextVisibilityContext.Provider value={{ showContexts, toggleContextVisibility }}>
      {children}
    </ContextVisibilityContext.Provider>
  );
};

export const useContextVisibility = () => {
  const context = useContext(ContextVisibilityContext);
  if (context === undefined) {
    throw new Error("useContextVisibility must be used within a ContextVisibilityProvider");
  }
  return context;
};
