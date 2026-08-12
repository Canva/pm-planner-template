"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { WORK_TYPE_ORDER, WORK_TYPE_LABELS, WORK_TYPE_COLORS } from "@/types";

export interface WorkTypeConfigEntry {
  key: string;
  label: string;
  color: string;
  sortOrder: number;
}

interface WorkTypesContextValue {
  workTypeOrder: string[];
  workTypeMeta: Record<string, WorkTypeConfigEntry>;
  loading: boolean;
  reload: () => void;
}

// Build static fallback from WORK_TYPE_LABELS / WORK_TYPE_ORDER
function buildStaticWorkTypeMeta(): Record<string, WorkTypeConfigEntry> {
  const meta: Record<string, WorkTypeConfigEntry> = {};
  WORK_TYPE_ORDER.forEach((key, i) => {
    meta[key] = {
      key,
      label: WORK_TYPE_LABELS[key] ?? key,
      color: WORK_TYPE_COLORS[key] ?? "#6b7280",
      sortOrder: i,
    };
  });
  return meta;
}

const staticMeta = buildStaticWorkTypeMeta();

const WorkTypesContext = createContext<WorkTypesContextValue>({
  workTypeOrder: WORK_TYPE_ORDER,
  workTypeMeta: staticMeta,
  loading: false,
  reload: () => {},
});

export function WorkTypesProvider({ children }: { children: React.ReactNode }) {
  const [workTypeOrder, setWorkTypeOrder] = useState<string[]>(WORK_TYPE_ORDER);
  const [workTypeMeta, setWorkTypeMeta] = useState<Record<string, WorkTypeConfigEntry>>(staticMeta);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/work-types");
      if (!res.ok) throw new Error("Failed to fetch work types");
      const data: WorkTypeConfigEntry[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("Empty work types");

      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
      const order = sorted.map((w) => w.key);
      const meta: Record<string, WorkTypeConfigEntry> = {};
      sorted.forEach((w) => { meta[w.key] = w; });

      setWorkTypeOrder(order);
      setWorkTypeMeta(meta);
    } catch {
      // Fall back to static values — already set as defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <WorkTypesContext.Provider value={{ workTypeOrder, workTypeMeta, loading, reload: load }}>
      {children}
    </WorkTypesContext.Provider>
  );
}

export function useWorkTypes() {
  return useContext(WorkTypesContext);
}
