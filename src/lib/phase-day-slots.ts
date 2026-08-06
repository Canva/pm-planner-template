import { isSameDay, isWithinInterval, parseISO } from "date-fns";
import { TaskPhase } from "@/types";

/**
 * AM/PM lane layout for phase pills.
 *
 * Each row (one task's phase lane, across the visible days) is exactly as
 * tall as it needs to be: `rowMaxN` is the most rows needed on any single
 * day in that lane, so a lane that never overlaps stays a single thin row.
 * Rows get slightly thicker once there are 3+ of them so the AM/PM toggle
 * buttons stay comfortably clickable.
 *
 * A phase renders as exactly ONE pill across its whole contiguous run of
 * active days within the visible range — never split into disconnected
 * segments — even if it's alone on some of those days and sharing a day
 * with another phase on others. A phase that never shares any day with
 * another phase gets the full lane height.
 *
 * A phase that shares at least one day with another phase gets a fixed AM
 * or PM slot for its entire pill, driven by its own `amPm` tag: explicitly
 * tagged phases go to that side; untagged phases default to PM, except when
 * NO phase in the group is tagged "AM" at all, in which case the earliest
 * (by sortOrder) phase not tagged "PM" becomes the default AM — so it works
 * out of the box before anyone picks anything. Both AM and PM independently
 * support 2+ simultaneous phases, stacked via the same greedy row-packing
 * used for non-overlapping bars.
 */
export const ROW_H = 20;
export const ROW_H_THICK = 24;
export const ROW_GAP = 2;

// Row height scales up slightly once there are 3+ rows in the lane, so the
// toggle buttons in each row stay usable.
export function rowHeightFor(rowMaxN: number): number {
  return rowMaxN >= 3 ? ROW_H_THICK : ROW_H;
}

export function bandHeight(rowMaxN: number): number {
  const rowH = rowHeightFor(rowMaxN);
  return rowMaxN * rowH + Math.max(0, rowMaxN - 1) * ROW_GAP;
}

export type PhaseRange = { start: Date; end: Date };

function defaultRange(phase: TaskPhase): PhaseRange {
  return { start: parseISO(phase.startDate!), end: parseISO(phase.endDate!) };
}

// `getRange` lets callers substitute live drag-preview dates for a phase
// instead of its persisted startDate/endDate (see the brief page's calendar).
export function isPhaseActiveOnDay(
  day: Date,
  phase: TaskPhase,
  getRange: (p: TaskPhase) => PhaseRange = defaultRange,
): boolean {
  if (!phase.startDate || !phase.endDate) return false;
  const { start: s, end: e } = getRange(phase);
  return isWithinInterval(day, { start: s, end: e }) || isSameDay(s, day) || isSameDay(e, day);
}

function activePhasesOnDay(
  day: Date,
  phasesWithDates: TaskPhase[],
  getRange: (p: TaskPhase) => PhaseRange,
): TaskPhase[] {
  return phasesWithDates.filter((p) => isPhaseActiveOnDay(day, p, getRange));
}

// Most phases active on any single visible day — a floor under the lane's
// row count; the real driver is each group's own structural row need below,
// which can exceed this when a day's AM phase isn't itself active there.
export function computeRowMaxN(
  days: Date[],
  phasesWithDates: TaskPhase[],
  getRange: (p: TaskPhase) => PhaseRange = defaultRange,
): number {
  let max = 1;
  for (const day of days) {
    const n = activePhasesOnDay(day, phasesWithDates, getRange).length;
    if (n > max) max = n;
  }
  return max;
}

// The 1-based [col, span] this phase occupies within `days`, i.e. its first
// through last active day in the visible range (contiguous, since a phase's
// own date range is contiguous and `days` is a contiguous Mon–Fri week).
function activeColRange(
  phase: TaskPhase,
  days: Date[],
  getRange: (p: TaskPhase) => PhaseRange,
): { col: number; span: number } | null {
  const activeIdx: number[] = [];
  days.forEach((d, i) => { if (isPhaseActiveOnDay(d, phase, getRange)) activeIdx.push(i); });
  if (activeIdx.length === 0) return null;
  const first = activeIdx[0];
  const last = activeIdx[activeIdx.length - 1];
  return { col: first + 1, span: last - first + 1 };
}

type Ranged = { phase: TaskPhase; col: number; span: number };

// Greedy row-packing, same technique used to stack non-overlapping bars:
// each item gets the first row whose previous occupant ends before this
// one starts. Minimizes rows while never double-booking a row.
function packRows<T extends Ranged>(items: T[]): (T & { row: number })[] {
  const rowEnds: number[] = [];
  return [...items].sort((a, b) => a.col - b.col).map((r) => {
    const colEnd = r.col + r.span;
    let row = rowEnds.findIndex((end) => end <= r.col);
    if (row === -1) row = rowEnds.length;
    rowEnds[row] = colEnd;
    return { ...r, row };
  });
}

export type PhaseRun = {
  phase: TaskPhase;
  col: number;
  span: number;
  top: number;
  height: number;
  slot: "AM" | "PM" | null;
  peers: TaskPhase[];
};
export type PhaseLane = { runs: PhaseRun[]; rowMaxN: number; bandH: number; rowH: number };

/**
 * Builds one pill per phase covering its whole contiguous run of active
 * days within `days` — a phase is never split into separate segments, even
 * when it's alone on some days and sharing a day with another phase on
 * others. `days` are 1-indexed columns left-to-right (e.g. weekDays[0] = col 1).
 */
export function buildPhaseRuns(
  days: Date[],
  phasesWithDates: TaskPhase[],
  getRange: (p: TaskPhase) => PhaseRange = defaultRange,
): PhaseLane {
  const ranges = phasesWithDates
    .map((phase) => {
      const r = activeColRange(phase, days, getRange);
      return r ? { phase, ...r } : null;
    })
    .filter((x): x is Ranged => x !== null);

  const overlaps = (phase: TaskPhase) =>
    days.some((d) => {
      const active = activePhasesOnDay(d, phasesWithDates, getRange);
      return active.length > 1 && active.some((p) => p.id === phase.id);
    });

  const solo = ranges.filter((r) => !overlaps(r.phase));
  const shared = ranges.filter((r) => overlaps(r.phase));

  // Group `shared` into connected components (phases linked transitively by
  // sharing at least one day) so two unrelated transitions in the same week
  // — e.g. an early-week handoff and a separate later one — each get their
  // own AM/PM picks and row-packing instead of being lumped together.
  const parent = new Map(shared.map((r) => [r.phase.id, r.phase.id]));
  function find(id: string): string {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    return root;
  }
  function union(a: string, b: string) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  for (let i = 0; i < shared.length; i++) {
    for (let j = i + 1; j < shared.length; j++) {
      const linked = days.some((d) =>
        isPhaseActiveOnDay(d, shared[i].phase, getRange) && isPhaseActiveOnDay(d, shared[j].phase, getRange)
      );
      if (linked) union(shared[i].phase.id, shared[j].phase.id);
    }
  }
  const groupMap = new Map<string, typeof shared>();
  for (const r of shared) {
    const root = find(r.phase.id);
    if (!groupMap.has(root)) groupMap.set(root, []);
    groupMap.get(root)!.push(r);
  }

  // First pass: resolve each group's AM/PM split and row-packing. This is
  // independent of the lane's overall row height — it's the structural row
  // count a group needs (AM rows + PM rows), which can exceed the raw
  // same-day active-phase count when a day's AM phase(s) aren't themselves
  // active there (rows are structurally reserved for the whole lane).
  const resolvedGroups = shared.length === 0 ? [] : [...groupMap.values()].map((group) => {
    const bySort = [...group].sort((a, b) => a.phase.sortOrder - b.phase.sortOrder);
    const explicitAm = bySort.filter((r) => r.phase.amPm === "AM");
    const amCandidates = explicitAm.length > 0
      ? explicitAm
      : [bySort.find((r) => r.phase.amPm !== "PM") ?? bySort[0]];
    const amIds = new Set(amCandidates.map((r) => r.phase.id));
    const pmCandidates = bySort.filter((r) => !amIds.has(r.phase.id));

    const amRows = packRows(amCandidates);
    const pmRows = packRows(pmCandidates);
    const numAmRows = Math.max(1, amRows.length);
    const numPmRows = Math.max(1, pmRows.length);
    return { group, amRows, pmRows, numAmRows, numPmRows };
  });

  const dayLevelMaxN = computeRowMaxN(days, phasesWithDates, getRange);
  const groupMaxN = resolvedGroups.reduce((mx, g) => Math.max(mx, g.numAmRows + g.numPmRows), 1);
  const rowMaxN = Math.max(dayLevelMaxN, groupMaxN);
  const rowH = rowHeightFor(rowMaxN);
  const bandH = bandHeight(rowMaxN);
  // A solo phase spans the full band when that's just one row (AM+PM
  // combined, the common case) — but once the lane needs 3+ rows because of
  // an unrelated overlap elsewhere in the week, stretching a lone phase to
  // match that inflated band looks like an oversized blob next to its
  // slim, single-row siblings. Cap it at one row's height in that case.
  const soloHeight = rowMaxN >= 3 ? rowH : bandH;

  const runs: PhaseRun[] = solo.map((r) => ({ ...r, top: 0, height: soloHeight, slot: null, peers: [] }));

  for (const { group, amRows, pmRows, numAmRows } of resolvedGroups) {
    const peers = group.map((r) => r.phase);
    const pmTop = numAmRows * (rowH + ROW_GAP);

    for (const r of amRows) {
      runs.push({
        ...r,
        top: r.row * (rowH + ROW_GAP),
        height: rowH,
        slot: "AM",
        peers: peers.filter((p) => p.id !== r.phase.id),
      });
    }
    for (const r of pmRows) {
      runs.push({
        ...r,
        top: pmTop + r.row * (rowH + ROW_GAP),
        height: rowH,
        slot: "PM",
        peers: peers.filter((p) => p.id !== r.phase.id),
      });
    }
  }

  return { runs, rowMaxN, bandH, rowH };
}
