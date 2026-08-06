"use client";

import { useEffect, useState } from "react";

const DEFAULT_APP_TITLE = "Lifecycle Planner";

/** Reads the instance's custom tool name (Admin → Settings → Branding), falling back to the default. */
export function useAppTitle(): string {
  const [title, setTitle] = useState(DEFAULT_APP_TITLE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.appTitle) setTitle(data.appTitle);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return title;
}
