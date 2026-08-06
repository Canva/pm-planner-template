"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "lc-theme";

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Read initial value from the class already applied by the inline script
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(STORAGE_KEY, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_KEY, "light");
    }
  }

  function setDarkMode(value: boolean) {
    setDark(value);
    if (value) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(STORAGE_KEY, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_KEY, "light");
    }
  }

  return { dark, toggle, setDarkMode };
}
