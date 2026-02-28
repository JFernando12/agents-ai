"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const useThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return loading state during SSR/hydration
  if (!mounted) {
    return { 
      theme: undefined, 
      toggleTheme: () => {},
      isLoading: true 
    };
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return { 
    theme: resolvedTheme, 
    toggleTheme,
    isLoading: false
  };
}
