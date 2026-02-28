import { useState, useEffect } from "react";

const CONTEXT_VISIBILITY_KEY = "showContexts";

export const useContextVisibility = () => {
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

  return {
    showContexts,
    toggleContextVisibility,
  };
};
