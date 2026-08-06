"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PHASE_META, PHASE_ORDER, ROUND_TAG_PHASES } from "@/types";

export interface PhaseConfigEntry {
  key: string;
  label: string;
  color: string;
  estMin: number | null;
  estMax: number | null;
  sortOrder: number;
  supportsRoundTag: boolean;
  capacityHoursPerDay: number;
}

interface PhasesContextValue {
  phaseOrder: string[];
  phaseMeta: Record<string, PhaseConfigEntry>;
  roundTagPhases: string[];
  loading: boolean;
  reload: () => void;
}

// Build static fallback from PHASE_META / PHASE_ORDER
function buildStaticPhaseMeta(): Record<string, PhaseConfigEntry> {
  const meta: Record<string, PhaseConfigEntry> = {};
  PHASE_ORDER.forEach((key, i) => {
    const m = PHASE_META[key];
    meta[key] = {
      key,
      label: m.label,
      color: m.color,
      estMin: m.estMin,
      estMax: m.estMax,
      sortOrder: i,
      supportsRoundTag: ROUND_TAG_PHASES.includes(key as any),
      capacityHoursPerDay: m.capacityHoursPerDay,
    };
  });
  return meta;
}

const staticMeta = buildStaticPhaseMeta();

const PhasesContext = createContext<PhasesContextValue>({
  phaseOrder: PHASE_ORDER,
  phaseMeta: staticMeta,
  roundTagPhases: ROUND_TAG_PHASES,
  loading: false,
  reload: () => {},
});

export function PhasesProvider({ children }: { children: React.ReactNode }) {
  const [phaseOrder, setPhaseOrder] = useState<string[]>(PHASE_ORDER);
  const [phaseMeta, setPhaseMeta] = useState<Record<string, PhaseConfigEntry>>(staticMeta);
  const [roundTagPhases, setRoundTagPhases] = useState<string[]>(ROUND_TAG_PHASES);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/phases");
      if (!res.ok) throw new Error("Failed to fetch phases");
      const data: PhaseConfigEntry[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("Empty phases");

      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
      const order = sorted.map((p) => p.key);
      const meta: Record<string, PhaseConfigEntry> = {};
      sorted.forEach((p) => { meta[p.key] = p; });
      const roundTags = sorted.filter((p) => p.supportsRoundTag).map((p) => p.key);

      setPhaseOrder(order);
      setPhaseMeta(meta);
      setRoundTagPhases(roundTags);
    } catch {
      // Fall back to static values — already set as defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <PhasesContext.Provider value={{ phaseOrder, phaseMeta, roundTagPhases, loading, reload: load }}>
      {children}
    </PhasesContext.Provider>
  );
}

export function usePhases() {
  return useContext(PhasesContext);
}
