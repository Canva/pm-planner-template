"use client";

import { useEffect } from "react";

/**
 * Reads the saved theme from localStorage on mount and applies
 * the .dark class to <html>. Runs client-side only.
 * The inline script in layout.tsx handles the first paint to avoid flash.
 */
export function ThemeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem("lc-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return null;
}
