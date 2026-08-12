"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";

// useLayoutEffect warns during SSR; this client component only needs it on the
// client, so fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Nearest scrollable ancestor (or window) — used to keep a grabbed calendar pill
// pinned under the cursor when the layout reflows.
function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  let el = node?.parentElement ?? null;
  while (el) {
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return window;
}
import { useRouter, useParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { WorkTypeBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { AssignModal } from "@/components/tasks/assign-modal";
import { formatDate, formatRole, cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";
import { authHeaders } from "@/lib/api-fetch";
import {
  ExternalLink, CheckSquare, Square, Plus, ArrowLeft,
  Users, X, UserPlus, AlertCircle, ChevronDown, Trash2,
  FileText, Palette, MessageSquare, Calendar, Link, Link2Off, Archive, Film,
  Pencil, GripVertical, Check,
} from "lucide-react";
import {
  format, differenceInDays, parseISO, isValid, addDays,
  startOfWeek, endOfWeek, eachDayOfInterval, getDay, isToday, isBefore, isAfter,
} from "date-fns";
import { addWorkingDays, nextWorkingDay } from "@/lib/utils";
import type { Task, TeamMember, CapacityCheck, TaskStatus, NextStep, NextStepChecklistItem, TempAssignment, DurationType, WorkType } from "@/types";
import { coversAllPhases } from "@/types";
import {
  PhaseType, TaskPhase, ROUND_TAGS,
} from "@/types";
import { usePhases } from "@/lib/phases-context";
import { useWorkTypes } from "@/lib/work-types-context";
import { buildPhaseRuns, ROW_GAP } from "@/lib/phase-day-slots";

// ── Inline member picker ──────────────────────────────────────────────────────
function MemberPicker({
  members,
  selectedId,
  onChange,
  placeholder = "Assign…",
}: {
  members: TeamMember[];
  selectedId?: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = members.find((m) => m.id === selectedId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 text-[11px] px-1.5 py-0.5 rounded border transition-colors",
          selected
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        )}
      >
        {selected ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
              {selected.name[0]}
            </span>
            {selected.name.split(" ")[0]}
          </>
        ) : (
          <>
            <UserPlus className="w-3 h-3" />
            {placeholder}
          </>
        )}
        <ChevronDown className="w-2.5 h-2.5 opacity-50" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto">
          {selectedId && (
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="w-3 h-3" /> Remove assignee
            </button>
          )}
          {members.filter((m) => m.isActive).map((m) => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 flex items-center gap-2",
                m.id === selectedId && "bg-indigo-50 text-indigo-700 font-medium"
              )}
            >
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {m.name[0]}
              </span>
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Editable date display (shows formatted, reveals date picker on click) ─────
function DateInput({
  value,
  onChange,
  placeholder = "Set date",
  className,
}: {
  value: string;         // "yyyy-MM-dd" or ""
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.showPicker?.();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={value}
        autoFocus
        onBlur={(e) => { onChange(e.target.value); setEditing(false); }}
        onChange={(e) => { onChange(e.target.value); }}
        className={cn(
          "border border-indigo-300 rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white w-[130px]",
          className
        )}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={cn(
        "text-xs px-1.5 py-0.5 rounded-md border transition-colors",
        value
          ? "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
          : "border-dashed border-gray-300 text-gray-400 hover:border-indigo-300 hover:text-indigo-500",
        className
      )}
    >
      {value ? format(parseISO(value), "MMM d, yyyy") : placeholder}
    </button>
  );
}

// ── Determine which phase is active ──────────────────────────────────────────
function resolveActivePhase(phases: TaskPhase[], currentPhaseType?: string | null): TaskPhase | null {
  if (!phases.length) return null;
  const sorted = [...phases].sort((a, b) => {
    if (a.startDate && b.startDate) return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    if (a.startDate) return -1;
    if (b.startDate) return 1;
    return a.sortOrder - b.sortOrder;
  });
  if (currentPhaseType) {
    const pinned = sorted.find((p) => p.type === currentPhaseType);
    if (pinned) return pinned;
  }
  const today = new Date();
  const inRange = sorted.find((p) => {
    if (!p.startDate || !p.endDate) return false;
    const s = parseISO(p.startDate);
    const e = parseISO(p.endDate);
    return (today >= s && today <= e);
  });
  if (inRange) return inRange;
  const upcoming = sorted.find((p) => p.startDate && parseISO(p.startDate) > today);
  if (upcoming) return upcoming;
  return sorted[sorted.length - 1];
}

// ── Phase Timeline section ────────────────────────────────────────────────────
function PhaseTimeline({
  taskId,
  phases,
  taskStartDate,
  workType,
  onReload,
  onDatesChange,
  readOnly = false,
}: {
  taskId: string;
  phases: TaskPhase[];
  taskStartDate?: string | null;
  workType: WorkType;
  onReload: () => void;
  onDatesChange?: (startDate: string | null, dueDate: string | null) => void;
  /** "USER" role accounts can view the timeline but not add/edit/drag phases. */
  readOnly?: boolean;
}) {
  const { phaseOrder, phaseMeta, roundTagPhases } = usePhases();

  const [phaseView, setPhaseView] = useState<"list" | "calendar">("calendar");
  // Calendar pill interaction. We drive both *move* (drag the whole pill to
  // reschedule) and *resize* (drag the right edge to extend the end date) with
  // plain pointer events rather than native HTML5 drag — that gives a smooth,
  // glitch-free live preview that follows the cursor across weeks, and lets the
  // resize handle live inside the pill without nested-draggable conflicts.
  // All live values are kept in `phaseDragRef` (read by the window listeners)
  // and mirrored to `phaseDrag` state to re-render the preview.
  type PhaseDrag = {
    kind: "move" | "resize";
    phaseId: string;
    startDate: string;  // original phase start, yyyy-MM-dd
    endDate: string;    // original phase end, yyyy-MM-dd
    grabDate: string;   // date under the cursor when the drag began
    curStart: string;   // live preview start
    curEnd: string;     // live preview end
  };
  const phaseDragRef = useRef<PhaseDrag | null>(null);
  const [phaseDrag, setPhaseDrag] = useState<PhaseDrag | null>(null);
  // Separate gesture: dragging a PM-stack pill's grip handle to swap its
  // order with another PM phase sharing the same day(s) — independent of
  // the reschedule/resize drag above.
  const [pmReorderDrag, setPmReorderDrag] = useState<string | null>(null);
  const [pmDropTarget, setPmDropTarget] = useState<string | null>(null);
  // When a drag begins, grabbing a pill reveals the previously-hidden padding/
  // gap weeks. Any week inserted *above* the grabbed pill pushes it down, out
  // from under the cursor. We record the pill's on-screen position at grab time
  // and, after the reveal reflow, scroll the container to pin it back in place.
  const dragAnchorRef = useRef<{ node: HTMLElement; topBefore: number } | null>(null);

  function setPhaseDragState(next: PhaseDrag | null) {
    phaseDragRef.current = next;
    setPhaseDrag(next);
  }

  // Begin a move/resize gesture, anchoring the grabbed pill's screen position.
  function beginPhaseDrag(pillEl: HTMLElement, drag: PhaseDrag) {
    if (readOnly) return;
    dragAnchorRef.current = { node: pillEl, topBefore: pillEl.getBoundingClientRect().top };
    setPhaseDragState(drag);
  }

  // After the drag-start reflow reveals the hidden weeks, restore the grabbed
  // pill to exactly where it was on screen so the cursor stays on it. Runs once
  // per gesture (the anchor is consumed). The week set is stable for the rest of
  // the drag, so no further correction is needed.
  useIsomorphicLayoutEffect(() => {
    const anchor = dragAnchorRef.current;
    if (!phaseDrag || !anchor) return;
    const delta = anchor.node.getBoundingClientRect().top - anchor.topBefore;
    if (delta !== 0) {
      const sc = getScrollParent(anchor.node);
      if (sc === window) window.scrollBy(0, delta);
      else (sc as HTMLElement).scrollTop += delta;
    }
    dragAnchorRef.current = null;
  }, [phaseDrag?.phaseId]);

  // Map a viewport point to the calendar day under it (yyyy-MM-dd). Each week
  // bar-area carries its Monday in `data-weekkey`; the five columns are the
  // consecutive Mon–Fri days, so the day is Monday + column index. Falls back to
  // the vertically-closest week so a drag straying just above/below still tracks.
  function dateUnderPointer(clientX: number, clientY: number): string | null {
    const areas = Array.from(document.querySelectorAll<HTMLElement>("[data-weekkey]"));
    if (areas.length === 0) return null;
    let target: HTMLElement | null = null;
    let bestDist = Infinity;
    for (const area of areas) {
      const rect = area.getBoundingClientRect();
      if (rect.width === 0) continue; // skip hidden weeks
      if (clientY >= rect.top && clientY <= rect.bottom) { target = area; break; }
      const dist = clientY < rect.top ? rect.top - clientY : clientY - rect.bottom;
      if (dist < bestDist) { bestDist = dist; target = area; }
    }
    if (!target) return null;
    const monday = parseISO(target.dataset.weekkey!);
    const rect = target.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    const col = Math.min(4, Math.max(0, Math.floor(rel * 5)));
    return format(addDays(monday, col), "yyyy-MM-dd");
  }
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [suggestedStart, setSuggestedStart] = useState("");
  const [suggestedEnd, setSuggestedEnd] = useState("");
  const [adding, setAdding] = useState(false);
  const [cascading, setCascading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // ── Edit mode state ───────────────────────────────────────────────────────
  const [editingPhases, setEditingPhases] = useState(false);
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, { startDate: string; endDate: string }>>({});
  const [editOrderIds, setEditOrderIds] = useState<string[]>([]);
  const [dragPhaseId, setDragPhaseId] = useState<string | null>(null);
  const [dragOverPhaseId, setDragOverPhaseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function enterEditMode() {
    if (readOnly) return;
    const byDate = [...phases].sort((a, b) => {
      if (a.startDate && b.startDate) return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (a.startDate) return -1; if (b.startDate) return 1;
      return a.sortOrder - b.sortOrder;
    });
    const drafts: Record<string, { startDate: string; endDate: string }> = {};
    for (const p of phases) {
      drafts[p.id] = { startDate: p.startDate?.split("T")[0] ?? "", endDate: p.endDate?.split("T")[0] ?? "" };
    }
    setPhaseDrafts(drafts);
    setEditOrderIds(byDate.map((p) => p.id));
    setEditingPhases(true);
  }

  function cancelEditMode() {
    setEditingPhases(false);
    setPhaseDrafts({});
    setEditOrderIds([]);
  }

  // Keep edit-mode bookkeeping in sync when phases change underneath us — e.g.
  // adding a phase via the "Add Phase" panel while editing, or deleting one.
  // New phases get appended to the order and seeded with drafts; removed phases
  // are pruned, all without leaving edit mode.
  useEffect(() => {
    if (!editingPhases) return;
    setEditOrderIds((prev) => {
      const known = new Set(phases.map((p) => p.id));
      const seen = new Set(prev);
      const kept = prev.filter((id) => known.has(id));
      const added = phases.filter((p) => !seen.has(p.id)).map((p) => p.id);
      return added.length === 0 && kept.length === prev.length ? prev : [...kept, ...added];
    });
    setPhaseDrafts((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const p of phases) {
        if (!next[p.id]) {
          next[p.id] = { startDate: p.startDate?.split("T")[0] ?? "", endDate: p.endDate?.split("T")[0] ?? "" };
          changed = true;
        }
      }
      for (const id of Object.keys(next)) {
        if (!phases.some((p) => p.id === id)) { delete next[id]; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [phases, editingPhases]);

  async function saveEditMode() {
    setSaving(true);
    // Save each phase's dates
    for (const p of phases) {
      const draft = phaseDrafts[p.id];
      if (!draft) continue;
      const origStart = p.startDate?.split("T")[0] ?? "";
      const origEnd = p.endDate?.split("T")[0] ?? "";
      if (draft.startDate !== origStart || draft.endDate !== origEnd) {
        await fetch(`/api/tasks/${taskId}/phases/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            startDate: draft.startDate || null,
            endDate: draft.endDate || null,
          }),
        });
      }
    }
    // Save new sort orders from editOrderIds
    for (let i = 0; i < editOrderIds.length; i++) {
      const phase = phases.find((p) => p.id === editOrderIds[i]);
      if (phase && phase.sortOrder !== i) {
        await fetch(`/api/tasks/${taskId}/phases/${editOrderIds[i]}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ sortOrder: i }),
        });
      }
    }
    // Re-derive task dates
    const allDrafted = phases.map((p) => ({
      ...p,
      startDate: phaseDrafts[p.id]?.startDate || p.startDate,
      endDate: phaseDrafts[p.id]?.endDate || p.endDate,
    }));
    const withDates = allDrafted.filter((p) => p.startDate && p.endDate);
    if (withDates.length) {
      const srt = [...withDates].sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ startDate: srt[0].startDate, dueDate: srt[srt.length - 1].endDate }),
      });
    }
    setSaving(false);
    setEditingPhases(false);
    setPhaseDrafts({});
    setEditOrderIds([]);
    onReload();
  }

  // Display order: during edit use editOrderIds, otherwise sort by date
  const sortedPhases = editingPhases
    ? editOrderIds.map((id) => phases.find((p) => p.id === id)).filter(Boolean) as typeof phases
    : [...phases].sort((a, b) => {
        if (a.startDate && b.startDate) return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        if (a.startDate) return -1; if (b.startDate) return 1;
        return a.sortOrder - b.sortOrder;
      });
  // All phase types are always available — the same phase (e.g. Creative Development)
  // can be added multiple times to represent pivots or restarts.
  const availableTypes = phaseOrder;

  // After any phase change, compute first/last phase dates and propagate to task
  function derivedTaskDates(updatedPhases: TaskPhase[]) {
    const withDates = updatedPhases.filter((p) => p.startDate && p.endDate);
    if (!withDates.length) return;
    const sorted = [...withDates].sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    const firstStart = sorted[0].startDate!.split("T")[0];
    const lastEnd = sorted[sorted.length - 1].endDate!.split("T")[0];
    onDatesChange?.(firstStart, lastEnd);
  }

  // Auto-suggest dates when type is selected
  useEffect(() => {
    if (!selectedType) { setSuggestedStart(""); setSuggestedEnd(""); return; }
    const lastWithEnd = [...sortedPhases].reverse().find((p) => p.endDate);
    let startStr: string;
    if (lastWithEnd?.endDate) {
      startStr = format(addDays(parseISO(lastWithEnd.endDate), 1), "yyyy-MM-dd");
    } else if (taskStartDate) {
      startStr = taskStartDate.split("T")[0];
    } else {
      startStr = format(new Date(), "yyyy-MM-dd");
    }
    const meta = phaseMeta[selectedType] ?? { estMin: null, estMax: null };
    const estDays = meta.estMax ?? meta.estMin ?? 1;
    const startDate = nextWorkingDay(parseISO(startStr));
    const endDate = estDays > 1 ? addWorkingDays(startDate, estDays - 1) : startDate;
    setSuggestedStart(format(startDate, "yyyy-MM-dd"));
    setSuggestedEnd(format(endDate, "yyyy-MM-dd"));
  }, [selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!selectedType) return;
    setAdding(true);
    await fetch(`/api/tasks/${taskId}/phases`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        type: selectedType,
        startDate: suggestedStart || null,
        endDate: suggestedEnd || null,
      }),
    });
    setAdding(false);
    setShowAddPanel(false);
    setSelectedType("");
    // After reload, derive task dates
    const updated = await fetch(`/api/tasks/${taskId}`).then((r) => r.json());
    const updatedPhases: TaskPhase[] = updated.phases ?? [];
    derivedTaskDates(updatedPhases);
    // Now patch task dates
    const withDates = updatedPhases.filter((p) => p.startDate && p.endDate);
    if (withDates.length) {
      const srt = [...withDates].sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          startDate: srt[0].startDate,
          dueDate: srt[srt.length - 1].endDate,
        }),
      });
    }
    onReload();
  }

  async function patchPhase(
    phaseId: string,
    data: Partial<Pick<TaskPhase, "startDate" | "endDate" | "notes" | "roundTag" | "amPm" | "sortOrder">>,
    currentPhase?: TaskPhase,
  ) {
    await fetch(`/api/tasks/${taskId}/phases/${phaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });

    // Cascade subsequent phases when endDate changes
    if (data.endDate !== undefined && currentPhase?.endDate && data.endDate) {
      const oldEnd = currentPhase.endDate.split("T")[0];
      const newEnd = data.endDate;
      if (oldEnd !== newEnd) {
        const delta = differenceInDays(parseISO(newEnd), parseISO(oldEnd));
        const subsequent = sortedPhases.filter(
          (p) => p.sortOrder > currentPhase.sortOrder && p.startDate && p.endDate,
        );
        if (subsequent.length > 0 && delta !== 0) {
          setCascading(true);
          for (const sp of subsequent) {
            const newSpStart = format(addDays(parseISO(sp.startDate!), delta), "yyyy-MM-dd");
            const newSpEnd = format(addDays(parseISO(sp.endDate!), delta), "yyyy-MM-dd");
            await fetch(`/api/tasks/${taskId}/phases/${sp.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify({ startDate: newSpStart, endDate: newSpEnd }),
            });
          }
          setCascading(false);
        }
      }
    }

    // Re-derive task dates after any phase date change
    if (data.startDate !== undefined || data.endDate !== undefined) {
      const updated = await fetch(`/api/tasks/${taskId}`).then((r) => r.json());
      const updatedPhases: TaskPhase[] = updated.phases ?? [];
      const withDates = updatedPhases.filter((p) => p.startDate && p.endDate);
      if (withDates.length) {
        const srt = [...withDates].sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            startDate: srt[0].startDate,
            dueDate: srt[srt.length - 1].endDate,
          }),
        });
      }
    }

    onReload();
  }

  async function deletePhase(phaseId: string) {
    if (!confirm("Remove this phase?")) return;
    await fetch(`/api/tasks/${taskId}/phases/${phaseId}`, { method: "DELETE", headers: authHeaders() });
    onReload();
  }

  // Persist new dates for a single phase (used by the calendar view's move +
  // resize gestures). Mirrors the /views behaviour: change just this phase,
  // then re-derive the task's overall start/due dates so the list view matches.
  async function persistPhaseDates(phase: TaskPhase, startStr: string, endStr: string) {
    if (!startStr || !endStr) return;
    await fetch(`/api/tasks/${taskId}/phases/${phase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ startDate: startStr, endDate: endStr }),
    });
    // Re-derive task dates from all phases
    const updated = await fetch(`/api/tasks/${taskId}`).then((r) => r.json());
    const updatedPhases: TaskPhase[] = updated.phases ?? [];
    const withDates = updatedPhases.filter((p) => p.startDate && p.endDate);
    if (withDates.length) {
      const srt = [...withDates].sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ startDate: srt[0].startDate, dueDate: srt[srt.length - 1].endDate }),
      });
    }
    onReload();
  }

  // Window-level pointer listeners that drive the calendar move/resize preview.
  // Bound only while a gesture is live; all live values flow through the ref so
  // the handlers never go stale.
  useEffect(() => {
    if (!phaseDrag) return;

    function onMove(e: MouseEvent) {
      const d = phaseDragRef.current;
      if (!d) return;
      const date = dateUnderPointer(e.clientX, e.clientY);
      if (!date) return;
      if (d.kind === "move") {
        const offset = differenceInDays(parseISO(date), parseISO(d.grabDate));
        if (offset === 0 && d.curStart === d.startDate) return;
        const ns = format(addDays(parseISO(d.startDate), offset), "yyyy-MM-dd");
        const ne = format(addDays(parseISO(d.endDate), offset), "yyyy-MM-dd");
        if (ns === d.curStart && ne === d.curEnd) return;
        setPhaseDragState({ ...d, curStart: ns, curEnd: ne });
      } else {
        // Resize: end follows the cursor, never before the start day.
        const ne = isBefore(parseISO(date), parseISO(d.startDate)) ? d.startDate : date;
        if (ne === d.curEnd) return;
        setPhaseDragState({ ...d, curEnd: ne });
      }
    }

    async function onUp() {
      const d = phaseDragRef.current;
      setPhaseDragState(null);
      if (!d) return;
      const phase = phases.find((p) => p.id === d.phaseId);
      if (!phase) return;
      if (d.curStart !== d.startDate || d.curEnd !== d.endDate) {
        await persistPhaseDates(phase, d.curStart, d.curEnd);
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = phaseDrag.kind === "resize" ? "ew-resize" : "grabbing";
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
    // Re-bind only when a new gesture starts (identity change), not on every
    // preview tick — the ref carries the live values.
  }, [phaseDrag?.phaseId, phaseDrag?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timeline bar ──────────────────────────────────────────────────────────
  function TimelineBar() {
    if (sortedPhases.length === 0) {
      return (
        <p className="text-xs text-gray-400 py-3 text-center">
          No phases added yet. Click Edit to add your first phase.
        </p>
      );
    }
    const phasesWithDates = sortedPhases.filter(
      (p) => p.startDate && p.endDate && isValid(parseISO(p.startDate)) && isValid(parseISO(p.endDate))
    );
    const hasDates = phasesWithDates.length === sortedPhases.length && sortedPhases.length > 0;
    let widths: number[];
    let totalDays = 0;
    let minDate: Date | null = null;
    if (hasDates) {
      const spans = sortedPhases.map((p) => {
        const start = parseISO(p.startDate!);
        const end = parseISO(p.endDate!);
        return Math.max(1, differenceInDays(end, start) + 1);
      });
      totalDays = spans.reduce((a, b) => a + b, 0);
      widths = spans.map((s) => (s / totalDays) * 100);
      minDate = parseISO(sortedPhases[0].startDate!);
    } else {
      widths = sortedPhases.map(() => 100 / sortedPhases.length);
    }
    let todayPct: number | null = null;
    if (hasDates && minDate) {
      const today = new Date();
      const daysFromStart = differenceInDays(today, minDate);
      todayPct = (daysFromStart / totalDays) * 100;
      if (todayPct < 0 || todayPct > 100) todayPct = null;
    }
    return (
      <div className="mt-3 mb-1">
        <div className="relative flex rounded-lg overflow-hidden h-8">
          {sortedPhases.map((phase, i) => {
            const meta = phaseMeta[phase.type] ?? { label: phase.type, color: "#4ade80", estMin: null, estMax: null };
            return (
              <div
                key={phase.id}
                style={{ width: `${widths[i]}%`, backgroundColor: meta.color }}
                className="relative flex items-center justify-center overflow-hidden"
                title={meta.label}
              >
                {widths[i] > 8 && (
                  <span className="text-[10px] font-medium text-white truncate px-1 drop-shadow">
                    {meta.label}
                  </span>
                )}
              </div>
            );
          })}
          {todayPct !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white opacity-80 z-10"
              style={{ left: `${todayPct}%` }}
              title="Today"
            />
          )}
        </div>
        <div className="flex mt-1">
          {sortedPhases.map((phase, i) => {
            const meta = phaseMeta[phase.type] ?? { label: phase.type, color: "#4ade80", estMin: null, estMax: null };
            return (
              <div key={phase.id} style={{ width: `${widths[i]}%` }} className="overflow-hidden">
                {widths[i] > 6 && (
                  <span className="text-[9px] font-medium truncate block" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Calendar view ─────────────────────────────────────────────────────────
  // Week-by-week grid (Mon–Fri) spanning the full brief timeline, with a colored
  // bar per phase. Weeks with no active phase are hidden. Bars are draggable to
  // reschedule the phase; changes propagate to the list view via onReload.
  function PhaseCalendar() {
    const phasesWithDates = phases.filter(
      (p) => p.startDate && p.endDate && isValid(parseISO(p.startDate)) && isValid(parseISO(p.endDate))
    );
    if (phasesWithDates.length === 0) {
      return (
        <p className="text-xs text-gray-400 py-3 text-center">
          No phases with dates to show on the calendar.
        </p>
      );
    }

    // Normalise to local midnight so UTC ISO strings don't shift day columns.
    const localDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    // Effective (preview-aware) dates for a phase: while it's being moved or
    // resized, use the live drag values so the pill follows the cursor — across
    // weeks too, since the whole week layout re-derives from these dates.
    function effDates(p: TaskPhase): { start: Date; end: Date } {
      if (phaseDrag && phaseDrag.phaseId === p.id) {
        return { start: parseISO(phaseDrag.curStart), end: parseISO(phaseDrag.curEnd) };
      }
      return { start: parseISO(p.startDate!), end: parseISO(p.endDate!) };
    }

    // Overall timeline bounds — based on effective dates so a phase dragged or
    // stretched past the current range still has weeks to land in.
    const eff = phasesWithDates.map(effDates);
    const starts = eff.map((d) => localDay(d.start));
    const ends = eff.map((d) => localDay(d.end));
    const minStart = starts.reduce((m, d) => (d < m ? d : m), starts[0]);
    const maxEnd = ends.reduce((m, d) => (d > m ? d : m), ends[0]);

    // Build Mon–Fri weeks spanning the timeline, padded before/after. Padding
    // and empty weeks are always rendered (hidden via CSS when idle) so their
    // DOM nodes exist up-front as drop targets during a gesture.
    const dragging = phaseDrag !== null;
    const allDays = eachDayOfInterval({
      start: startOfWeek(addDays(minStart, -7), { weekStartsOn: 1 }),
      end: endOfWeek(addDays(maxEnd, 28), { weekStartsOn: 1 }),
    });
    const weeks: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const wk = allDays.slice(i, i + 7).filter((d) => { const dow = getDay(d); return dow !== 0 && dow !== 6; });
      if (wk.length) weeks.push(wk);
    }

    const toWidth = (span: number) => `${span * 20}%`;
    const GAP = 4;

    const renderedWeeks = weeks.map((weekDays) => {
      const weekKey = format(weekDays[0], "yyyy-MM-dd");

      // AM/PM day slots for this week (using effective, drag-preview-aware dates)
      const { runs: phaseRuns, rowMaxN, bandH, rowH } = buildPhaseRuns(weekDays, phasesWithDates, effDates);
      const pmTop = rowH + ROW_GAP;
      // Show every week that falls within the timeline span (first → last
      // phase), even empty ones, so gaps read as real elapsed weeks rather than
      // collapsing non-adjacent phases together. Only the outer drag-headroom
      // padding stays hidden when idle; a gesture reveals it as a drop target.
      const weekStartDay = localDay(weekDays[0]);
      const weekEndDay = localDay(weekDays[weekDays.length - 1]);
      const weekInTimeline = !(isBefore(weekEndDay, minStart) || isAfter(weekStartDay, maxEnd));
      const weekHidden = !weekInTimeline && !dragging;
      const containerH = bandH;
      const GUTTER_W = rowMaxN >= 2 ? 14 : 0;

      // Month label — spans the week; show both months when the week straddles two.
      const firstDay = weekDays[0];
      const lastDay = weekDays[weekDays.length - 1];
      const monthLabel = firstDay.getMonth() === lastDay.getMonth()
        ? format(firstDay, "MMMM yyyy")
        : firstDay.getFullYear() === lastDay.getFullYear()
        ? `${format(firstDay, "MMM")} – ${format(lastDay, "MMM yyyy")}`
        : `${format(firstDay, "MMM yyyy")} – ${format(lastDay, "MMM yyyy")}`;

      return (
        <div key={weekKey} className={cn("border border-gray-200 rounded-xl overflow-hidden", weekHidden && "hidden")}>
          {/* Month label */}
          <div className="px-2 py-1 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{monthLabel}</span>
          </div>
          {/* Day header */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {GUTTER_W > 0 && <div className="shrink-0" style={{ width: GUTTER_W }} />}
            <div className="flex-1 grid grid-cols-5">
              {weekDays.map((day) => {
                const today = isToday(day);
                return (
                  <div key={format(day, "yyyy-MM-dd")} className="px-2 py-1 border-r border-gray-200 last:border-r-0 flex items-center gap-1">
                    <span className="text-[10px] font-medium text-gray-400">{format(day, "EEE")}</span>
                    <span className={cn(
                      "text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full shrink-0",
                      today ? "bg-indigo-600 text-white" : "text-gray-700"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase bars — `data-weekkey` lets the pointer listeners resolve the
              cursor back to a day in this week. */}
          <div className="flex">
            {GUTTER_W > 0 && (
              <div className="shrink-0 relative border-r border-gray-100" style={{ width: GUTTER_W, height: containerH + 12 }}>
                <span className="absolute text-[7px] font-bold text-gray-300 leading-none" style={{ left: 2, top: 6 + rowH / 2 - 3 }} title="AM">A</span>
                <span className="absolute text-[7px] font-bold text-gray-300 leading-none" style={{ left: 2, top: 6 + pmTop + (bandH - pmTop) / 2 - 3 }} title="PM">P</span>
              </div>
            )}
            <div
              data-weekkey={weekKey}
              className="relative py-1.5 flex-1"
              style={{ height: containerH + 12 }}
            >
              {/* Column guides + today highlight */}
              <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
                {weekDays.map((day, i) => (
                  <div key={i} className={cn(
                    "border-r border-gray-100 last:border-r-0",
                    isToday(day) && "bg-indigo-50/60"
                  )} />
                ))}
              </div>
              {rowMaxN >= 2 && (
                <div className="absolute inset-x-0 border-t border-dashed border-gray-200 pointer-events-none" style={{ top: 6 + pmTop - ROW_GAP / 2 }} />
              )}
              {phaseRuns.map(({ phase, col, span, top, height, slot, peers }) => {
              const meta = phaseMeta[phase.type] ?? { label: phase.type, color: "#4ade80", estMin: null, estMax: null };
              const isActiveDrag = phaseDrag?.phaseId === phase.id;
              const isResizing = isActiveDrag && phaseDrag?.kind === "resize";
              const isReviewPhase = roundTagPhases.includes(phase.type);
              const pmSiblings = slot && isReviewPhase
                ? phaseRuns.filter((r) => r.slot === slot && r.phase.id !== phase.id && r.peers.some((p) => p.id === phase.id))
                : [];
              const isPmDropTarget = pmDropTarget === phase.id;
              return (
                <div
                  key={phase.id}
                  onMouseDown={(e) => {
                    // Left button only; ignore clicks that originate on the
                    // resize handle (it stops propagation, but guard anyway).
                    if (e.button !== 0) return;
                    e.preventDefault();
                    const sd = phase.startDate!.split("T")[0];
                    const ed = phase.endDate!.split("T")[0];
                    const grab = dateUnderPointer(e.clientX, e.clientY) ?? sd;
                    beginPhaseDrag(e.currentTarget, { kind: "move", phaseId: phase.id, startDate: sd, endDate: ed, grabDate: grab, curStart: sd, curEnd: ed });
                  }}
                  onDragOver={(e) => {
                    if (readOnly || !pmReorderDrag || !pmSiblings.some((s) => s.phase.id === pmReorderDrag)) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setPmDropTarget(phase.id);
                  }}
                  onDragLeave={() => { if (isPmDropTarget) setPmDropTarget(null); }}
                  onDrop={(e) => {
                    if (readOnly || !pmReorderDrag || !pmSiblings.some((s) => s.phase.id === pmReorderDrag)) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const otherId = pmReorderDrag;
                    setPmReorderDrag(null);
                    setPmDropTarget(null);
                    const other = phases.find((p) => p.id === otherId);
                    if (!other) return;
                    patchPhase(phase.id, { sortOrder: other.sortOrder });
                    patchPhase(other.id, { sortOrder: phase.sortOrder });
                  }}
                  className={cn(
                    "group/pill absolute rounded-full flex items-center px-2.5 text-[10px] font-semibold text-white overflow-hidden select-none cursor-grab active:cursor-grabbing",
                    "transition-[left,width] duration-75",
                    isActiveDrag && "ring-2 ring-white shadow-lg z-10",
                    isResizing && "cursor-ew-resize",
                    isPmDropTarget && "ring-2 ring-white"
                  )}
                  style={{
                    top: 6 + top,
                    height,
                    left: `calc(${(col - 1) * 20}% + ${GAP}px)`,
                    width: `calc(${toWidth(span)} - ${GAP * 2}px)`,
                    backgroundColor: meta.color,
                  }}
                  title={`${meta.label}${slot ? ` (${slot})` : ""}${phase.roundTag ? ` ${phase.roundTag}` : ""} — drag to move, drag the right edge to extend`}
                >
                  {!readOnly && pmSiblings.length > 0 && (
                    <span
                      draggable
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.effectAllowed = "move";
                        setPmReorderDrag(phase.id);
                      }}
                      onDragEnd={() => { setPmReorderDrag(null); setPmDropTarget(null); }}
                      className="shrink-0 mr-1 cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100"
                      title={`Drag to reorder within ${slot}`}
                    >
                      ⠿
                    </span>
                  )}
                  <span className="truncate pr-1">{meta.label}</span>
                  {!readOnly && slot && isReviewPhase && height >= 12 && (
                    <div className="flex items-center gap-0.5 shrink-0 mr-1.5" onMouseDown={(e) => e.stopPropagation()}>
                      {(["AM", "PM"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (opt === slot) return;
                            patchPhase(phase.id, { amPm: opt });
                          }}
                          className={cn(
                            "text-[8px] font-bold px-1 rounded-full border leading-tight shrink-0",
                            opt === slot
                              ? "bg-white border-white text-gray-900"
                              : "border-white/50 text-white/70 hover:border-white hover:text-white"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {!readOnly && roundTagPhases.includes(phase.type) && (
                    <div className="flex items-center gap-0.5 shrink-0 mr-1.5" onMouseDown={(e) => e.stopPropagation()}>
                      {ROUND_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            patchPhase(phase.id, { roundTag: phase.roundTag === tag ? null : tag });
                          }}
                          className={cn(
                            "text-[9px] font-bold px-1 py-0.5 rounded-full border leading-none transition-colors shrink-0",
                            phase.roundTag === tag
                              ? "bg-white text-gray-900 border-white"
                              : "border-white/50 text-white/70 hover:border-white hover:text-white"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Resize handle — appears on hover at the pill's right edge. */}
                  {!readOnly && <div
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const sd = phase.startDate!.split("T")[0];
                      const ed = phase.endDate!.split("T")[0];
                      const pill = e.currentTarget.parentElement as HTMLElement;
                      beginPhaseDrag(pill, { kind: "resize", phaseId: phase.id, startDate: sd, endDate: ed, grabDate: ed, curStart: sd, curEnd: ed });
                    }}
                    className={cn(
                      "absolute right-0 top-0 bottom-0 w-2.5 flex items-center justify-center cursor-ew-resize",
                      "opacity-0 group-hover/pill:opacity-100 transition-opacity",
                      isResizing && "opacity-100"
                    )}
                    title="Drag to extend"
                  >
                    <span className="w-0.5 h-3 rounded-full bg-white/80" />
                  </div>}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);

    return <div className="mt-3 space-y-2">{renderedWeeks}</div>;
  }

  // ── Phase rows ────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Phases</h2>
          {cascading && (
            <span className="text-[10px] text-indigo-500 font-medium animate-pulse">Cascading dates…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* List / Calendar view toggle */}
          {!editingPhases && (
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {(["list", "calendar"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setPhaseView(v); setShowAddPanel(false); }}
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-md transition-colors capitalize",
                    phaseView === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          {readOnly ? null : editingPhases ? (
            <>
              <button
                onClick={() => setShowAddPanel((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Phase
              </button>
              <button
                onClick={cancelEditMode}
                className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditMode}
                disabled={saving}
                className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 rounded-lg px-2.5 py-1 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Check className="w-3 h-3" />
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : phaseView === "list" ? (
            // List view: adding phases lives inside Edit mode. Edit stays
            // enabled with no phases so the first one can be added there.
            <button
              onClick={enterEditMode}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          ) : (
            // Calendar view: add phases directly via the same panel.
            <button
              onClick={() => setShowAddPanel((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Phase
            </button>
          )}
        </div>
      </div>

      {showAddPanel && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            {workType === "BAU" ? (
              <input
                type="text"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                placeholder="Phase name…"
                className="flex-1 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              />
            ) : (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">Select phase…</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>{phaseMeta[t]?.label ?? t}</option>
                ))}
              </select>
            )}
            <button onClick={() => { setShowAddPanel(false); setSelectedType(""); }} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedType && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-indigo-500 font-medium uppercase tracking-wide">
                Suggested dates
              </span>
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-gray-500">Start</label>
                <DateInput
                  value={suggestedStart}
                  onChange={setSuggestedStart}
                  placeholder="Set start"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-gray-500">End</label>
                <DateInput
                  value={suggestedEnd}
                  onChange={setSuggestedEnd}
                  placeholder="Set end"
                />
              </div>
              <span className="text-[10px] text-gray-400 italic">
                {(phaseMeta[selectedType]?.estMin ?? null) !== null
                  ? `est. ${phaseMeta[selectedType].estMin}${phaseMeta[selectedType].estMax !== phaseMeta[selectedType].estMin ? `–${phaseMeta[selectedType].estMax ?? "+"}` : ""} day${(phaseMeta[selectedType].estMin ?? 1) !== 1 ? "s" : ""}`
                  : "no estimate"}
              </span>
              <button
                onClick={handleAdd}
                disabled={!selectedType || adding}
                className="ml-auto px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {adding ? "Adding…" : "Add Phase"}
              </button>
            </div>
          )}

          {!selectedType && (
            <p className="text-[11px] text-indigo-400">
              {workType === "BAU"
                ? "Type a name for this phase to set its dates."
                : "Select a phase to see date suggestions based on your existing timeline."}
            </p>
          )}
        </div>
      )}

      {/* Rendered as a function call (not <PhaseCalendar />) so it stays part of
          this component's tree — otherwise drag state updates would remount it
          and abort the in-progress drag. */}
      {phaseView === "calendar" && PhaseCalendar()}

      {phaseView === "list" && <TimelineBar />}

      {phaseView === "list" && sortedPhases.length > 0 && (
        <div className="mt-4 space-y-2">
          {sortedPhases.map((phase, idx) => {
            const meta = phaseMeta[phase.type] ?? { label: phase.type, color: "#4ade80", estMin: null, estMax: null };
            const hasNotes = expandedNotes.has(phase.id);
            const estLabel = meta.estMin === null && meta.estMax === null
              ? null
              : meta.estMin === meta.estMax
              ? `est. ${meta.estMin} day${meta.estMin === 1 ? "" : "s"}`
              : meta.estMax === null
              ? `est. ${meta.estMin}+ days`
              : `est. ${meta.estMin}–${meta.estMax} days`;

            const today = new Date();
            const start = phase.startDate ? parseISO(phase.startDate) : null;
            const end = phase.endDate ? parseISO(phase.endDate) : null;
            const isActive = start && end ? today >= start && today <= end : false;
            const prevPhase = idx > 0 ? sortedPhases[idx - 1] : null;
            const prevDone = prevPhase?.endDate ? parseISO(prevPhase.endDate) < today : !prevPhase;
            const isUpcoming = !isActive && start && start > today && prevDone;

            return (
              <div
                key={phase.id}
                draggable={editingPhases}
                onDragStart={() => editingPhases && setDragPhaseId(phase.id)}
                onDragOver={(e) => { if (editingPhases) { e.preventDefault(); setDragOverPhaseId(phase.id); } }}
                onDrop={() => {
                  if (!editingPhases || !dragPhaseId || dragPhaseId === phase.id) return;
                  setEditOrderIds((prev) => {
                    const next = [...prev];
                    const from = next.indexOf(dragPhaseId);
                    const to = next.indexOf(phase.id);
                    next.splice(from, 1);
                    next.splice(to, 0, dragPhaseId);
                    return next;
                  });
                  setDragPhaseId(null);
                  setDragOverPhaseId(null);
                }}
                onDragEnd={() => { setDragPhaseId(null); setDragOverPhaseId(null); }}
                className={cn(
                  "group border rounded-lg p-3 transition-colors",
                  editingPhases && dragOverPhaseId === phase.id && dragPhaseId !== phase.id
                    ? "border-indigo-400 bg-indigo-50"
                    : isActive ? "border-indigo-200 bg-indigo-50/40" : "border-gray-100 hover:border-gray-200",
                  editingPhases && "cursor-default"
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {editingPhases && (
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab active:cursor-grabbing" />
                  )}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                    <span className="text-sm font-semibold text-gray-800 truncate">{meta.label}</span>
                    {phase.roundTag && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white shrink-0">
                        {phase.roundTag}
                      </span>
                    )}
                    {estLabel && <span className="text-xs text-gray-400 shrink-0">{estLabel}</span>}
                    {isActive && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                        Current
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                        Up next
                      </span>
                    )}
                  </div>

                  {/* Dates — read-only unless in edit mode */}
                  {editingPhases ? (
                    <>
                      <div className="flex items-center gap-1 shrink-0">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide">Start</label>
                        <DateInput
                          value={phaseDrafts[phase.id]?.startDate ?? ""}
                          onChange={(v) => setPhaseDrafts((prev) => ({ ...prev, [phase.id]: { ...prev[phase.id], startDate: v } }))}
                          placeholder="Set start"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide">End</label>
                        <DateInput
                          value={phaseDrafts[phase.id]?.endDate ?? ""}
                          onChange={(v) => setPhaseDrafts((prev) => ({ ...prev, [phase.id]: { ...prev[phase.id], endDate: v } }))}
                          placeholder="Set end"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Start</span>
                        <span className="text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded-md min-w-[72px] text-center">
                          {phase.startDate ? format(parseISO(phase.startDate), "MMM d, yyyy") : <span className="text-gray-300">—</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">End</span>
                        <span className="text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded-md min-w-[72px] text-center">
                          {phase.endDate ? format(parseISO(phase.endDate), "MMM d, yyyy") : <span className="text-gray-300">—</span>}
                        </span>
                      </div>
                    </>
                  )}

                  {/* R1/R2/R3 round tags — only for review phases */}
                  {!readOnly && roundTagPhases.includes(phase.type) && (
                    <div className="flex items-center gap-1 shrink-0">
                      {ROUND_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => patchPhase(phase.id, { roundTag: phase.roundTag === tag ? null : tag })}
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-colors",
                            phase.roundTag === tag
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedNotes((prev) => {
                      const next = new Set(prev);
                      next.has(phase.id) ? next.delete(phase.id) : next.add(phase.id);
                      return next;
                    })}
                    className="text-[10px] text-gray-400 hover:text-indigo-600 shrink-0"
                  >
                    {hasNotes ? "Hide notes" : "Notes"}
                  </button>

                  {!readOnly && (
                    <button
                      onClick={() => deletePhase(phase.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {hasNotes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <textarea
                      defaultValue={phase.notes ?? ""}
                      onBlur={(e) => patchPhase(phase.id, { notes: e.target.value || null })}
                      placeholder="Add notes for this phase…"
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none text-gray-600"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {phaseView === "list" && sortedPhases.length === 0 && !showAddPanel && (
        <p className="text-xs text-gray-400 text-center py-2">No phases added yet.</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, role } = useCurrentUser();
  // "USER" role accounts may edit a brief's description/links/notes, but not
  // its name, timeline, phase, assignees, or other metadata.
  const restrictedFieldsLocked = role === "USER";
  const { phaseMeta } = usePhases();
  const { workTypeOrder, workTypeMeta } = useWorkTypes();
  // Remember where the user came from so Back and post-delete redirect go there
  const backUrl = useRef<string>("/intake");
  useEffect(() => {
    if (typeof document !== "undefined" && document.referrer) {
      const ref = new URL(document.referrer);
      // Only trust referrers from the same origin
      if (ref.origin === window.location.origin) {
        backUrl.current = ref.pathname + ref.search;
      }
    }
  }, []);

  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [capacityChecks, setCapacityChecks] = useState<CapacityCheck[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({});

  // Add step form state
  const [newStep, setNewStep] = useState("");
  const [newStepDate, setNewStepDate] = useState("");
  const [newStepAssignee, setNewStepAssignee] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Inline description editing
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepText, setEditingStepText] = useState("");

  // Checklist sub-item state
  const [addingChecklistStepId, setAddingChecklistStepId] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState("");

  // URL editing state (shared for both steps and checklist items)
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [editingUrlText, setEditingUrlText] = useState("");

  // Temp/external assignee form state
  const [showTempForm, setShowTempForm] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempStart, setTempStart] = useState("");
  const [tempEnd, setTempEnd] = useState("");
  const [tempDuration, setTempDuration] = useState<DurationType>("FULL_DAY");
  const [savingTemp, setSavingTemp] = useState(false);

  useEffect(() => {
    loadTask();
    fetch("/api/team").then((r) => r.json()).then((d) => setMembers(Array.isArray(d) ? d : []));
    fetch("/api/capacity").then((r) => r.json()).then(setCapacityChecks);
  }, [id]);

  async function loadTask() {
    const res = await fetch(`/api/tasks/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setTask(data);
    setEditData(data);
  }

  async function handleSave() {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        ...editData,
        ...(editData.customLinks && { customLinks: editData.customLinks.filter((l) => l.name.trim() && l.url.trim()) }),
      }),
    });
    setEditing(false);
    loadTask();
  }

  async function toggleNextStep(stepId: string, isComplete: boolean) {
    await fetch(`/api/tasks/${id}/next-steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ isComplete }),
    });
    loadTask();
  }

  async function patchStep(stepId: string, data: Record<string, unknown>) {
    await fetch(`/api/tasks/${id}/next-steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    loadTask();
  }

  async function deleteStep(stepId: string) {
    await fetch(`/api/tasks/${id}/next-steps/${stepId}`, { method: "DELETE" });
    loadTask();
  }

  async function archiveStep(stepId: string) {
    await fetch(`/api/tasks/${id}/next-steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ isComplete: true }),
    });
    setTask((prev) =>
      prev ? { ...prev, nextSteps: (prev.nextSteps || []).filter((s) => s.id !== stepId) } : prev
    );
  }

  async function archiveChecklistItem(stepId: string, itemId: string) {
    await fetch(`/api/tasks/${id}/next-steps/${stepId}/checklist/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ isComplete: true }),
    });
    setTask((prev) =>
      prev
        ? {
            ...prev,
            nextSteps: (prev.nextSteps || []).map((s) =>
              s.id === stepId
                ? { ...s, checklistItems: (s.checklistItems ?? []).filter((c) => c.id !== itemId) }
                : s
            ),
          }
        : prev
    );
  }

  async function addChecklistItem(stepId: string) {
    if (!newChecklistText.trim()) return;
    await fetch(`/api/tasks/${id}/next-steps/${stepId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ description: newChecklistText.trim() }),
    });
    setNewChecklistText("");
    setAddingChecklistStepId(null);
    loadTask();
  }

  async function patchChecklistItem(stepId: string, itemId: string, data: Record<string, unknown>) {
    await fetch(`/api/tasks/${id}/next-steps/${stepId}/checklist/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    loadTask();
  }

  async function deleteChecklistItem(stepId: string, itemId: string) {
    await fetch(`/api/tasks/${id}/next-steps/${stepId}/checklist/${itemId}`, { method: "DELETE" });
    loadTask();
  }

  async function addNextStep() {
    if (!newStep.trim()) return;
    setSaving(true);
    setStepError(null);
    try {
      const res = await fetch(`/api/tasks/${id}/next-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          description: newStep,
          durationType: "FULL_DAY",   // default, not exposed in UI
          ...(newStepDate && { dueDate: newStepDate }),
          ...(newStepAssignee && { assignedToId: newStepAssignee }),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStepError(err.error || "Failed to add step — try restarting the dev server");
        return;
      }
      setNewStep("");
      setNewStepDate("");
      setNewStepAssignee(null);
    } finally {
      setSaving(false);
      loadTask();
    }
  }

  async function handleAssign(assignments: any[], removedMemberIds: string[] = []) {
    if (!task) return;
    // Upsert the new/updated assignments
    if (assignments.length) {
      await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ taskId: task.id, assignments }),
      });
    }
    // Delete assignments for members who were removed
    for (const memberId of removedMemberIds) {
      const a = (task.assignments ?? []).find((a) => a.teamMemberId === memberId);
      if (a) await fetch(`/api/assignments/${a.id}`, { method: "DELETE", headers: authHeaders() });
    }
    loadTask();
  }

  async function removeAssignee(assignmentId: string) {
    await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE", headers: authHeaders() });
    loadTask();
  }

  async function addTempAssignee() {
    if (!tempName.trim() || !tempStart || !tempEnd) return;
    setSavingTemp(true);
    const capacityUnits = tempDuration === "FULL_DAY" ? 1.0 : tempDuration === "HALF_DAY" ? 0.5 : 0.25;
    await fetch("/api/assignments/temp", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ taskId: task!.id, guestName: tempName.trim(), startDate: tempStart, dueDate: tempEnd, durationType: tempDuration, capacityUnits }),
    });
    setSavingTemp(false);
    setShowTempForm(false);
    setTempName(""); setTempStart(""); setTempEnd("");
    loadTask();
  }

  async function removeTempAssignee(tempId: string) {
    await fetch(`/api/assignments/temp/${tempId}`, { method: "DELETE", headers: authHeaders() });
    loadTask();
  }

  async function deleteTask() {
    if (!confirm("Delete this brief permanently? This cannot be undone.")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    router.push(backUrl.current);
  }

  if (!task) return (
    <div className="flex flex-col flex-1">
      <Topbar title="Brief Detail" />
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
    </div>
  );

  const activePhase = resolveActivePhase(task.phases || [], task.currentPhaseType);

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title={task.name}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={deleteTask}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2 py-1"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        }
      />

      <div className="p-6 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-5">
              <div className="flex-1 mt-1">
                {editing && !restrictedFieldsLocked ? (
                  <input
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full text-lg font-semibold border-b border-indigo-300 focus:outline-none pb-1"
                  />
                ) : (
                  <h1 className="text-lg font-semibold text-gray-900">{task.name}</h1>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {editing && !restrictedFieldsLocked ? (
                    <select
                      value={(editData.workType ?? task.workType) as string}
                      onChange={(e) => setEditData({ ...editData, workType: e.target.value as any })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      {workTypeOrder.map((key) => (
                        <option key={key} value={key}>{workTypeMeta[key]?.label ?? key}</option>
                      ))}
                    </select>
                  ) : (
                    <WorkTypeBadge type={task.workType} />
                  )}
                  <StatusBadge status={task.status} />
                </div>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                {[
                  { href: task.briefLink, icon: <FileText className="w-3 h-3" />, label: "Brief" },
                  { href: task.figmaLink, icon: <Palette className="w-3 h-3" />, label: "Figma" },
                  { href: task.iconikLink, icon: <Film className="w-3 h-3" />, label: "Iconik" },
                  { href: task.slackThreadLink, icon: <MessageSquare className="w-3 h-3" />, label: "SH Slack" },
                  { href: task.internalSlackLink, icon: <MessageSquare className="w-3 h-3" />, label: "Slack" },
                  { href: task.mondayLink, icon: <ExternalLink className="w-3 h-3" />, label: "monday" },
                  ...(task.customLinks ?? []).map((l) => ({
                    href: l.url, icon: <ExternalLink className="w-3 h-3" />, label: l.name,
                  })),
                ].filter((l) => l.href).map((l) => (
                  <a key={l.label} href={l.href!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-2 py-1">
                    {l.icon} {l.label}
                  </a>
                ))}
                <button
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  className="text-xs font-medium px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editing ? "Save" : "Edit"}
                </button>
              </div>
            </div>

            {editing ? (
              <textarea
                value={editData.description || ""}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                placeholder="Description"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            ) : task.description ? (
              <p className="text-sm text-gray-600">{task.description}</p>
            ) : null}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {/* Phase */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  {task.workType === "BAU" ? "Status" : "Phase"}
                </p>
                {editing && !restrictedFieldsLocked ? (
                  <select
                    value={
                      editData.currentPhaseType
                        ? `phase:${editData.currentPhaseType}`
                        : editData.status === "ON_HOLD" ? "ON_HOLD"
                        : editData.status === "DONE" ? "DONE"
                        : editData.status === "CANCELLED" ? "CANCELLED"
                        : task.workType === "BAU" && editData.status === "INTAKE" ? "NOT_STARTED"
                        : task.workType === "BAU" && editData.status === "IN_PROGRESS" ? "IN_PROGRESS_STATUS"
                        : ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.startsWith("phase:")) {
                        setEditData({ ...editData, currentPhaseType: v.slice(6), status: "IN_PROGRESS" });
                      } else if (v === "NOT_STARTED") {
                        setEditData({ ...editData, currentPhaseType: null, status: "INTAKE" });
                      } else if (v === "IN_PROGRESS_STATUS") {
                        setEditData({ ...editData, currentPhaseType: null, status: "IN_PROGRESS" });
                      } else {
                        setEditData({ ...editData, currentPhaseType: null, status: v as TaskStatus });
                      }
                    }}
                    className="text-sm border-b border-gray-200 focus:outline-none bg-transparent"
                  >
                    <option value="" disabled>Select…</option>
                    {task.workType === "BAU" && (
                      <>
                        <option value="NOT_STARTED">Intake</option>
                        <option value="IN_PROGRESS_STATUS">In Progress</option>
                        <option disabled>──────────</option>
                      </>
                    )}
                    {(task.phases ?? [])
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((p) => (
                        <option key={p.type} value={`phase:${p.type}`}>
                          {phaseMeta[p.type]?.label ?? p.type}
                        </option>
                      ))}
                    <option disabled>──────────</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900">
                    {task.currentPhaseType
                      ? phaseMeta[task.currentPhaseType]?.label ?? task.currentPhaseType
                      : task.status === "ON_HOLD" ? "On Hold"
                      : task.status === "DONE" ? "Done"
                      : task.status === "CANCELLED" ? "Cancelled"
                      : task.workType === "BAU" && task.status === "INTAKE" ? "Intake"
                      : task.workType === "BAU" && task.status === "IN_PROGRESS" ? "In Progress"
                      : activePhase
                      ? (phaseMeta[activePhase.type]?.label ?? activePhase.type)
                      : "Intake"}
                  </p>
                )}
              </div>

              {/* Start (phase-derived, read-only) */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Start</p>
                <p className="text-sm text-gray-900">
                  {task.startDate ? format(parseISO(task.startDate), "MMM d, yyyy") : "—"}
                </p>
              </div>

              {/* Due (phase-derived, read-only) */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Delivery</p>
                <p className="text-sm text-gray-900">
                  {task.dueDate ? format(parseISO(task.dueDate), "MMM d, yyyy") : "—"}
                </p>
              </div>
            </div>

            {/* Deadline row (requester-given) */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requester Deadline</p>
              </div>
              {editing && !restrictedFieldsLocked ? (
                <input
                  type="date"
                  value={(editData as any).deadline?.slice(0, 10) ?? ""}
                  onChange={(e) => setEditData({ ...editData, deadline: e.target.value || null } as any)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              ) : (task as any).deadline ? (
                <p className="text-sm text-rose-600 font-medium">
                  {format(parseISO((task as any).deadline), "MMM d, yyyy")}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Not set</p>
              )}
            </div>

            {/* Project metadata (channel, owner, priority, cat number) */}
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ...(task.workType === "BAU" ? [] : [{ key: "channel", label: "Channel", placeholder: "e.g. Engagement" }]),
                {
                  key: "stakeholder", label: "Owner",
                  placeholder: task.workType === "BAU" ? "" : "External owner",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                  {editing && !restrictedFieldsLocked ? (
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={(editData as any)[key] ?? ""}
                      onChange={(e) => setEditData({ ...editData, [key]: e.target.value || null })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">{(task as any)[key] || <span className="text-gray-300">—</span>}</p>
                  )}
                </div>
              ))}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Priority</p>
                {editing && !restrictedFieldsLocked ? (
                  <select
                    value={(editData as any).priorityLevel ?? ""}
                    onChange={(e) => setEditData({ ...editData, priorityLevel: e.target.value || null } as any)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">— Select —</option>
                    <option value="P0 - Critical">P0 - Critical</option>
                    <option value="P1 - Important, Urgent">P1 - Important, Urgent</option>
                    <option value="P2 - Important, Flexible">P2 - Important, Flexible</option>
                    <option value="P3 - Nice to have">P3 - Nice to have</option>
                  </select>
                ) : (task as any).priorityLevel ? (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${(task as any).priorityLevel?.startsWith("P0") ? "bg-rose-600 text-white" : (task as any).priorityLevel?.startsWith("P1") ? "bg-red-100 text-red-700" : (task as any).priorityLevel?.startsWith("P2") ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                    {(task as any).priorityLevel}
                  </span>
                ) : <p className="text-sm text-gray-300">—</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">CAT Number</p>
                {editing && !restrictedFieldsLocked ? (
                  <input
                    type="text"
                    placeholder="e.g. CAT-1234"
                    value={(editData as any).catNumber ?? ""}
                    onChange={(e) => setEditData({ ...editData, catNumber: e.target.value || null } as any)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                ) : (
                  <p className="text-sm text-gray-800 font-mono">{(task as any).catNumber || <span className="text-gray-300">—</span>}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Urgency</p>
                {editing && !restrictedFieldsLocked ? (
                  <select
                    value={(editData as any).urgency ?? ""}
                    onChange={(e) => setEditData({ ...editData, urgency: e.target.value || null } as any)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">— Not set —</option>
                    <option value="CRITICAL">Critical — must ship, no flex</option>
                    <option value="FIXED">Fixed — date set, small buffer ok</option>
                    <option value="FLEXIBLE">Flexible — no hard date, can shift</option>
                  </select>
                ) : (task as any).urgency ? (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${(task as any).urgency === "CRITICAL" ? "bg-red-100 text-red-700" : (task as any).urgency === "FIXED" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {(task as any).urgency === "CRITICAL" ? "Critical" : (task as any).urgency === "FIXED" ? "Fixed" : "Flexible"}
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </div>
            </div>

            {/* Link fields (edit mode) */}
            {editing && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Links</p>
                {task.workType === "BAU" ? (
                  <div className="space-y-2">
                    {(editData.customLinks ?? []).map((link, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Link name (e.g. Design doc)"
                          value={link.name}
                          onChange={(e) => setEditData({
                            ...editData,
                            customLinks: (editData.customLinks ?? []).map((l, i) => i === idx ? { ...l, name: e.target.value } : l),
                          })}
                          className="w-48 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <input
                          type="url"
                          placeholder="URL"
                          value={link.url}
                          onChange={(e) => setEditData({
                            ...editData,
                            customLinks: (editData.customLinks ?? []).map((l, i) => i === idx ? { ...l, url: e.target.value } : l),
                          })}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <button
                          onClick={() => setEditData({
                            ...editData,
                            customLinks: (editData.customLinks ?? []).filter((_, i) => i !== idx),
                          })}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                          title="Remove link"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setEditData({ ...editData, customLinks: [...(editData.customLinks ?? []), { name: "", url: "" }] })}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-3 h-3" /> Add link
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { key: "mondayLink", label: "monday.com URL" },
                        { key: "briefLink", label: "Brief URL" },
                        { key: "figmaLink", label: "Figma URL" },
                        { key: "iconikLink", label: "Iconik URL" },
                        { key: "slackThreadLink", label: "SH Slack Thread" },
                        { key: "internalSlackLink", label: "Internal Slack Thread" },
                      ].map(({ key, label }) => (
                        <input
                          key={key}
                          type="url"
                          placeholder={label}
                          value={(editData as any)[key] ?? ""}
                          onChange={(e) => setEditData({ ...editData, [key]: e.target.value || null })}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      ))}
                    </div>

                    {/* Ad-hoc extra links, on top of the fixed fields above */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      {(editData.customLinks ?? []).map((link, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Link name (e.g. Design doc)"
                            value={link.name}
                            onChange={(e) => setEditData({
                              ...editData,
                              customLinks: (editData.customLinks ?? []).map((l, i) => i === idx ? { ...l, name: e.target.value } : l),
                            })}
                            className="w-48 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <input
                            type="url"
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => setEditData({
                              ...editData,
                              customLinks: (editData.customLinks ?? []).map((l, i) => i === idx ? { ...l, url: e.target.value } : l),
                            })}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                          <button
                            onClick={() => setEditData({
                              ...editData,
                              customLinks: (editData.customLinks ?? []).filter((_, i) => i !== idx),
                            })}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                            title="Remove link"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setEditData({ ...editData, customLinks: [...(editData.customLinks ?? []), { name: "", url: "" }] })}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <Plus className="w-3 h-3" /> Add link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Phase Timeline ── */}
          <PhaseTimeline
            taskId={id}
            phases={task.phases || []}
            taskStartDate={task.startDate}
            workType={task.workType}
            onReload={loadTask}
            readOnly={restrictedFieldsLocked}
          />

          {/* ── Next steps (admin only) ── */}
          {isAdmin && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Next Steps</h2>

            {(task.nextSteps || []).length === 0 && (
              <p className="text-xs text-gray-400 mb-3">No steps yet — add one below.</p>
            )}

            <div className="space-y-0 divide-y divide-gray-50">
              {(task.nextSteps || []).map((step) => (
                <div key={step.id} className="group flex items-start gap-2 py-2.5">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleNextStep(step.id, !step.isComplete)}
                    className="shrink-0 mt-0.5 text-gray-400 hover:text-indigo-600"
                  >
                    {step.isComplete
                      ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                      : <Square className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Description — click to edit */}
                    {editingStepId === step.id ? (
                      <input
                        autoFocus
                        value={editingStepText}
                        onChange={(e) => setEditingStepText(e.target.value)}
                        onBlur={() => {
                          if (editingStepText.trim() && editingStepText.trim() !== step.description) {
                            patchStep(step.id, { description: editingStepText.trim() });
                          }
                          setEditingStepId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (editingStepText.trim() && editingStepText.trim() !== step.description) {
                              patchStep(step.id, { description: editingStepText.trim() });
                            }
                            setEditingStepId(null);
                          } else if (e.key === "Escape") {
                            setEditingStepId(null);
                          }
                        }}
                        className="w-full text-sm border-b border-indigo-300 focus:outline-none bg-transparent pb-0.5"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={cn(
                            "text-sm cursor-text hover:text-indigo-700 transition-colors",
                            step.isComplete && "line-through text-gray-400"
                          )}
                          title="Click to edit"
                          onClick={() => {
                            setEditingStepId(step.id);
                            setEditingStepText(step.description);
                          }}
                        >
                          {step.description}
                        </span>
                        {step.url ? (
                          <a href={step.url} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 text-indigo-400 hover:text-indigo-600"
                            title={step.url}
                            onClick={(e) => e.stopPropagation()}>
                            <Link className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                        {editingUrlId === step.id ? (
                          <input
                            autoFocus
                            type="url"
                            placeholder="https://…"
                            value={editingUrlText}
                            onChange={(e) => setEditingUrlText(e.target.value)}
                            onBlur={() => {
                              patchStep(step.id, { url: editingUrlText.trim() || null });
                              setEditingUrlId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { patchStep(step.id, { url: editingUrlText.trim() || null }); setEditingUrlId(null); }
                              if (e.key === "Escape") setEditingUrlId(null);
                            }}
                            className="text-xs border-b border-indigo-300 focus:outline-none bg-transparent w-48"
                          />
                        ) : (
                          <button
                            onClick={() => { setEditingUrlId(step.id); setEditingUrlText(step.url ?? ""); }}
                            className={cn(
                              "shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                              step.url ? "text-indigo-400 hover:text-red-400" : "text-gray-300 hover:text-indigo-500"
                            )}
                            title={step.url ? "Change or remove link" : "Add link"}
                          >
                            {step.url ? <Link2Off className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Due date + assignee */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Due</span>
                        <DateInput
                          value={step.dueDate ? step.dueDate.split("T")[0] : ""}
                          onChange={(v) => patchStep(step.id, { dueDate: v || null })}
                          placeholder="Set due"
                        />
                      </div>
                      <MemberPicker
                        members={members}
                        selectedId={step.assignedToId}
                        onChange={(memberId) => patchStep(step.id, { assignedToId: memberId })}
                        placeholder="Assign"
                      />
                    </div>

                    {/* Checklist sub-items */}
                    {((step.checklistItems ?? []).length > 0 || addingChecklistStepId === step.id) && (
                      <div className="mt-2 pl-1 space-y-1">
                        {(step.checklistItems ?? []).map((item) => (
                          <div key={item.id} className="group/item flex items-center gap-1.5">
                            <button
                              onClick={() => patchChecklistItem(step.id, item.id, { isComplete: !item.isComplete })}
                              className="shrink-0 text-gray-300 hover:text-indigo-500"
                            >
                              {item.isComplete
                                ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                                : <Square className="w-3.5 h-3.5" />}
                            </button>
                            {editingItemId === item.id ? (
                              <input
                                autoFocus
                                value={editingItemText}
                                onChange={(e) => setEditingItemText(e.target.value)}
                                onBlur={() => {
                                  if (editingItemText.trim() && editingItemText.trim() !== item.description) {
                                    patchChecklistItem(step.id, item.id, { description: editingItemText.trim() });
                                  }
                                  setEditingItemId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    if (editingItemText.trim() && editingItemText.trim() !== item.description) {
                                      patchChecklistItem(step.id, item.id, { description: editingItemText.trim() });
                                    }
                                    setEditingItemId(null);
                                  } else if (e.key === "Escape") {
                                    setEditingItemId(null);
                                  }
                                }}
                                className="flex-1 text-xs border-b border-indigo-300 focus:outline-none bg-transparent"
                              />
                            ) : (
                              <div className="flex-1 flex items-center gap-1 min-w-0">
                                <span
                                  className={cn(
                                    "text-xs cursor-text hover:text-indigo-600 transition-colors",
                                    item.isComplete && "line-through text-gray-300"
                                  )}
                                  onClick={() => { setEditingItemId(item.id); setEditingItemText(item.description); }}
                                >
                                  {item.description}
                                </span>
                                {item.url ? (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                                    className="shrink-0 text-indigo-400 hover:text-indigo-600"
                                    title={item.url}
                                    onClick={(e) => e.stopPropagation()}>
                                    <Link className="w-3 h-3" />
                                  </a>
                                ) : null}
                                {editingUrlId === item.id ? (
                                  <input
                                    autoFocus
                                    type="url"
                                    placeholder="https://…"
                                    value={editingUrlText}
                                    onChange={(e) => setEditingUrlText(e.target.value)}
                                    onBlur={() => {
                                      patchChecklistItem(step.id, item.id, { url: editingUrlText.trim() || null });
                                      setEditingUrlId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") { patchChecklistItem(step.id, item.id, { url: editingUrlText.trim() || null }); setEditingUrlId(null); }
                                      if (e.key === "Escape") setEditingUrlId(null);
                                    }}
                                    className="text-xs border-b border-indigo-300 focus:outline-none bg-transparent w-40"
                                  />
                                ) : (
                                  <button
                                    onClick={() => { setEditingUrlId(item.id); setEditingUrlText(item.url ?? ""); }}
                                    className={cn(
                                      "shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity",
                                      item.url ? "text-indigo-400 hover:text-red-400" : "text-gray-300 hover:text-indigo-500"
                                    )}
                                    title={item.url ? "Change or remove link" : "Add link"}
                                  >
                                    {item.url ? <Link2Off className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={() => archiveChecklistItem(step.id, item.id)}
                                title="Archive (mark done & hide)"
                                className="text-gray-300 hover:text-indigo-400 transition-colors"
                              >
                                <Archive className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteChecklistItem(step.id, item.id)}
                                title="Delete"
                                className="text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {addingChecklistStepId === step.id && (
                          <div className="flex items-center gap-1.5 pl-5">
                            <input
                              autoFocus
                              placeholder="Sub-task…"
                              value={newChecklistText}
                              onChange={(e) => setNewChecklistText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addChecklistItem(step.id);
                                else if (e.key === "Escape") { setAddingChecklistStepId(null); setNewChecklistText(""); }
                              }}
                              onBlur={() => {
                                if (newChecklistText.trim()) addChecklistItem(step.id);
                                else { setAddingChecklistStepId(null); setNewChecklistText(""); }
                              }}
                              className="flex-1 text-xs border-b border-indigo-300 focus:outline-none bg-transparent"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {/* Add sub-task button */}
                    <button
                      onClick={() => { setAddingChecklistStepId(step.id); setNewChecklistText(""); }}
                      className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> sub-task
                    </button>
                  </div>

                  {/* Archive + Delete */}
                  <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    <button
                      onClick={() => archiveStep(step.id)}
                      title="Archive (mark done & hide)"
                      className="text-gray-300 hover:text-indigo-400 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteStep(step.id)}
                      title="Delete"
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Add step form (no duration picker) ── */}
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
              {stepError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {stepError}
                </div>
              )}
              <input
                placeholder="Add next step…"
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addNextStep()}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex gap-2 flex-wrap items-center">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-400">Due</label>
                  <input type="date" value={newStepDate} onChange={(e) => setNewStepDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600" />
                </div>
                <MemberPicker
                  members={members}
                  selectedId={newStepAssignee}
                  onChange={setNewStepAssignee}
                  placeholder="Assign"
                />
                <button
                  onClick={addNextStep}
                  disabled={saving || !newStep.trim()}
                  className="ml-auto px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {saving ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* monday.com updates */}
          {task.mondayUpdates && (task.mondayUpdates as any[]).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">monday.com Updates</h2>
              <div className="space-y-3">
                {(task.mondayUpdates as any[]).map((update: any) => (
                  <div key={update.id} className="border-l-2 border-indigo-200 pl-3">
                    <p className="text-xs font-medium text-gray-500">
                      {update.creator?.name} · {update.createdAt ? formatDate(update.createdAt, "MMM d, h:mm a") : ""}
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5" dangerouslySetInnerHTML={{ __html: update.body }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Assignees */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Assignees</h2>
              {!restrictedFieldsLocked && (
                <button
                  onClick={() => setShowAssign(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 border border-indigo-200 rounded-lg px-2 py-1 hover:bg-indigo-50 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  {(task.assignments || []).length === 0 && (task.tempAssignments || []).length === 0 ? "Add" : "Manage"}
                </button>
              )}
            </div>
            {(task.assignments || []).length === 0 && (task.tempAssignments || []).length === 0 && !showTempForm ? (
              <div
                className={cn(
                  "text-center py-4 rounded-lg transition-colors",
                  !restrictedFieldsLocked && "cursor-pointer hover:bg-gray-50"
                )}
                onClick={restrictedFieldsLocked ? undefined : () => setShowAssign(true)}
              >
                <Users className="w-6 h-6 text-gray-200 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No one assigned{!restrictedFieldsLocked && " · click to add"}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {(task.assignments || []).map((assignment) => {
                  const member = assignment.teamMember;
                  if (!member) return null;
                  const isPmOrAcd = coversAllPhases(member.role);
                  const durLabel = assignment.durationType === "FULL_DAY" ? "Full day"
                    : assignment.durationType === "HALF_DAY" ? "Half day" : "2 hrs";
                  // Parse phaseIds saved by the Manage Assignees modal
                  const assignedPhaseIds: string[] = (() => {
                    if (!assignment.phaseId) return [];
                    try { const v = JSON.parse(assignment.phaseId); return Array.isArray(v) ? v : [assignment.phaseId]; }
                    catch { return [assignment.phaseId]; }
                  })();
                  const assignedPhases = (task.phases || []).filter((p) => assignedPhaseIds.includes(p.id));
                  return (
                    <div
                      key={assignment.id}
                      className="group w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <Avatar name={member.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{member.name}</p>
                        {!isPmOrAcd && <p className="text-xs text-gray-400">{durLabel}</p>}
                        {/* Read-only phase tags — hidden for PM/ACD */}
                        {!isPmOrAcd && assignedPhases.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {assignedPhases.map((p) => {
                              const meta = phaseMeta[p.type] ?? { label: p.type, color: "#4ade80" };
                              return (
                                <span key={p.id} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: meta.color + "22", color: meta.color }}>
                                  {meta.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {!restrictedFieldsLocked && (
                        <button
                          onClick={() => removeAssignee(assignment.id)}
                          className="shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove assignee"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {(task.tempAssignments || []).map((t: TempAssignment) => {
                  const durLabel = t.durationType === "FULL_DAY" ? "Full day"
                    : t.durationType === "HALF_DAY" ? "Half day" : "2 hrs";
                  return (
                    <div
                      key={t.id}
                      className="group w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 shrink-0">EXT</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{t.guestName}</p>
                        <p className="text-xs text-gray-400">{durLabel}</p>
                        {t.startDate && t.dueDate && (
                          <p className="text-[10px] text-gray-300">
                            {format(parseISO(t.startDate), "MMM d")} – {format(parseISO(t.dueDate), "MMM d")}
                          </p>
                        )}
                      </div>
                      {!restrictedFieldsLocked && (
                        <button
                          onClick={() => removeTempAssignee(t.id)}
                          className="shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove external assignee"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {showTempForm && !restrictedFieldsLocked && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-lg space-y-2">
                    <input
                      autoFocus
                      placeholder="Name (e.g. Jane Smith, Freelancer)"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full border border-orange-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide">Start</label>
                        <input
                          type="date"
                          value={tempStart}
                          onChange={(e) => setTempStart(e.target.value)}
                          className="w-full border border-orange-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white mt-0.5"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wide">End</label>
                        <input
                          type="date"
                          value={tempEnd}
                          onChange={(e) => setTempEnd(e.target.value)}
                          className="w-full border border-orange-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white mt-0.5"
                        />
                      </div>
                    </div>
                    <select
                      value={tempDuration}
                      onChange={(e) => setTempDuration(e.target.value as DurationType)}
                      className="w-full border border-orange-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    >
                      <option value="FULL_DAY">Full day</option>
                      <option value="HALF_DAY">Half day</option>
                      <option value="TWO_HOURS">2 hrs</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={addTempAssignee}
                        disabled={savingTemp || !tempName.trim() || !tempStart || !tempEnd}
                        className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
                      >
                        {savingTemp ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setShowTempForm(false); setTempName(""); setTempStart(""); setTempEnd(""); }}
                        className="flex-1 px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {!restrictedFieldsLocked && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setShowAssign(true)}
                      className="flex-1 text-[11px] text-indigo-500 hover:text-indigo-700 py-1 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Manage team members
                    </button>
                    <button
                      onClick={() => setShowTempForm(true)}
                      className="flex-1 text-[11px] text-orange-500 hover:text-orange-700 py-1 border border-dashed border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      + Add external
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Notes</h2>
            {editing ? (
              <textarea
                value={editData.notes || ""}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={4}
                placeholder="Add notes…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
              />
            ) : (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.notes || "No notes"}</p>
            )}
          </div>

          {/* Production */}
          {task.workType !== "BAU" && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Production</h2>
              <div className="space-y-2.5">
                <label className={cn("flex items-center gap-2 select-none", editing ? "cursor-pointer" : "cursor-default")}>
                  <input
                    type="checkbox"
                    disabled={!editing}
                    checked={!!(editing ? editData.hasBuild : task.hasBuild)}
                    onChange={(e) => setEditData({ ...editData, hasBuild: e.target.checked })}
                    className="w-4 h-4 rounded accent-indigo-600 disabled:opacity-60"
                  />
                  <span className="text-sm text-gray-700">Build</span>
                </label>
                <label className={cn("flex items-center gap-2 select-none", editing ? "cursor-pointer" : "cursor-default")}>
                  <input
                    type="checkbox"
                    disabled={!editing}
                    checked={!!(editing ? editData.hasLocalization : task.hasLocalization)}
                    onChange={(e) => setEditData({ ...editData, hasLocalization: e.target.checked })}
                    className="w-4 h-4 rounded accent-indigo-600 disabled:opacity-60"
                  />
                  <span className="text-sm text-gray-700">Localisation</span>
                </label>
              </div>
            </div>
          )}

          {/* Capacity */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Capacity</h2>
            {(task.assignments || []).map((a) => (
              <div key={a.id} className="flex justify-between text-xs text-gray-600 py-1 border-b border-gray-50 last:border-0">
                <span>{a.teamMember?.name}</span>
                <span>{a.capacityUnits === 1 ? "Full day" : a.capacityUnits === 0.5 ? "Half day" : "2 hrs"} / day</span>
              </div>
            ))}
            {(task.assignments || []).length === 0 && (
              <p className="text-xs text-gray-400">No capacity allocated</p>
            )}
          </div>
        </div>
      </div>

      {showAssign && (
        <AssignModal
          task={task}
          members={members}
          capacityChecks={capacityChecks}
          existingAssignments={task.assignments || []}
          phases={task.phases || []}
          tempAssignments={task.tempAssignments || []}
          onRemoveTemp={removeTempAssignee}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}
