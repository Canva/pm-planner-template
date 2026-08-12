"use client";

import { useState, useEffect, useRef } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { todayPH } from "@/lib/tz";
import { buildPhaseRuns, ROW_GAP } from "@/lib/phase-day-slots";
import { usePhases } from "@/lib/phases-context";
import { useWorkTypes } from "@/lib/work-types-context";
import { WORK_TYPE_ORDER, PHASE_META, PHASE_ORDER, TaskPhase, lockedPhaseForRole, coversAllPhases } from "@/types";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay,
  addMonths, subMonths, addWeeks as dfAddWeeks, subWeeks,
  isWithinInterval, parseISO, differenceInDays, addDays, getDay,
  isBefore, isAfter,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, ChevronDown, CalendarOff, X, AlertCircle, Plus,
} from "lucide-react";
import type { Task, TeamMember, WorkType, Assignment, NextStep, Squad, PhaseType, Holiday, TempAssignment } from "@/types";

type ViewMode = "month" | "squads" | "external";

// ── Work-type multi-select filter ────────────────────────────────────────────
function TypeFilterDropdown({
  selected, onChange,
}: {
  selected: WorkType[];
  onChange: (types: WorkType[]) => void;
}) {
  const { workTypeOrder, workTypeMeta } = useWorkTypes();
  const [open, setOpen] = useState(false);
  const label =
    selected.length === workTypeOrder.length ? "All types" :
    selected.length === 0 ? "No types" :
    selected.length === 1 ? (workTypeMeta[selected[0]]?.label ?? selected[0]) :
    `${selected.length} types`;

  function toggle(type: WorkType) {
    onChange(
      selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none hover:bg-gray-50 transition-colors"
      >
        {label}
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            <button
              onClick={() => onChange(selected.length === workTypeOrder.length ? [] : workTypeOrder)}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-gray-50 transition-colors"
            >
              {selected.length === workTypeOrder.length ? "Deselect all" : "Select all"}
            </button>
            <div className="border-t border-gray-100 my-1" />
            {workTypeOrder.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(type)}
                  onChange={() => toggle(type)}
                  className="w-3.5 h-3.5 rounded accent-indigo-600"
                />
                {workTypeMeta[type]?.label ?? type}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Add Event modal (Leave / OOO + Holiday) ──────────────────────────────────
type AddEventTab = "leave" | "holiday";

function AddEventModal({
  members,
  defaultMember,
  defaultDate,
  defaultTab,
  onSaveLeave,
  onSaveHoliday,
  onClose,
}: {
  members: TeamMember[];
  defaultMember: TeamMember | null;
  defaultDate: Date;
  defaultTab: AddEventTab;
  onSaveLeave: (memberId: string, startDate: string, endDate: string, reason: string, isHalfDay: boolean) => Promise<string | null>;
  onSaveHoliday: (name: string, startDate: string, endDate: string, type: "PUBLIC" | "COMPANY") => Promise<string | null>;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<AddEventTab>(defaultTab);

  // Leave fields
  const [leaveMemberId, setLeaveMemberId] = useState(defaultMember?.id ?? (members[0]?.id ?? ""));
  const [leaveStart, setLeaveStart] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [leaveEnd, setLeaveEnd] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveIsHalfDay, setLeaveIsHalfDay] = useState(false);

  // Holiday fields
  const [holidayName, setHolidayName] = useState("");
  const [holidayStart, setHolidayStart] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [holidayEnd, setHolidayEnd] = useState("");
  const [holidayType, setHolidayType] = useState<"PUBLIC" | "COMPANY">("PUBLIC");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaving(true);
    let err: string | null = null;
    if (activeTab === "leave") {
      if (!leaveStart || !leaveEnd) { setSaving(false); setError("Both dates are required."); return; }
      if (leaveEnd < leaveStart) { setSaving(false); setError("End must be on or after start."); return; }
      if (!leaveMemberId) { setSaving(false); setError("Select a member."); return; }
      err = await onSaveLeave(leaveMemberId, leaveStart, leaveEnd, leaveReason, leaveIsHalfDay);
    } else {
      if (!holidayName.trim()) { setSaving(false); setError("Holiday name is required."); return; }
      if (!holidayStart) { setSaving(false); setError("Start date is required."); return; }
      if (holidayEnd && holidayEnd < holidayStart) { setSaving(false); setError("End must be on or after start."); return; }
      err = await onSaveHoliday(holidayName.trim(), holidayStart, holidayEnd, holidayType);
    }
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
  }

  const tabCls = (t: AddEventTab) => cn(
    "flex-1 py-2 text-xs font-medium rounded-lg transition-colors",
    activeTab === t ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Add Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-1 p-3 border-b border-gray-100">
          <button className={tabCls("leave")} onClick={() => { setActiveTab("leave"); setError(null); }}>
            Leave / OOO
          </button>
          <button className={tabCls("holiday")} onClick={() => { setActiveTab("holiday"); setError(null); }}>
            Holiday
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertCircle className="w-3 h-3 shrink-0" />{error}
            </div>
          )}

          {activeTab === "leave" ? (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Member</label>
                <select value={leaveMemberId} onChange={(e) => setLeaveMemberId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start date</label>
                  <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End date</label>
                  <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              {leaveStart && leaveStart === leaveEnd && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={leaveIsHalfDay}
                    onChange={(e) => setLeaveIsHalfDay(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Half day</span>
                </label>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Holiday name</label>
                <input value={holidayName} onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Christmas Day"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start date</label>
                  <input type="date" value={holidayStart} onChange={(e) => setHolidayStart(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End date (opt.)</label>
                  <input type="date" value={holidayEnd} onChange={(e) => setHolidayEnd(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select value={holidayType} onChange={(e) => setHolidayType(e.target.value as "PUBLIC" | "COMPANY")}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="PUBLIC">Public Holiday</option>
                  <option value="COMPANY">Company Holiday</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? "Saving…" : activeTab === "leave" ? "Add Leave" : "Add Holiday"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Strip time so UTC ISO strings don't shift the date in non-UTC timezones. */
function localDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Compare leave dates as YYYY-MM-DD strings to avoid UTC-vs-local timezone shifts.
function dayInLeave(dayStr: string, lv: { startDate: string; endDate: string }): boolean {
  return lv.startDate.slice(0, 10) <= dayStr && dayStr <= lv.endDate.slice(0, 10);
}

function isDayOnLeave(day: Date, member: TeamMember): boolean {
  const dayStr = format(day, "yyyy-MM-dd");
  return (member.leaves ?? []).some((lv) => dayInLeave(dayStr, lv));
}

function getLeaveForDay(day: Date, member: TeamMember): { isHalfDay: boolean } | null {
  const dayStr = format(day, "yyyy-MM-dd");
  const lv = (member.leaves ?? []).find((l) => dayInLeave(dayStr, l));
  return lv ? { isHalfDay: lv.isHalfDay } : null;
}

function getHolidaysForDay(day: Date, holidays: Holiday[]): Holiday[] {
  return holidays.filter((h) => {
    const start = parseISO(h.date);
    const end = h.endDate ? parseISO(h.endDate) : start;
    return isWithinInterval(day, { start, end }) || isSameDay(start, day);
  });
}

/**
 * Resolve a filter value into an array of member IDs or "all".
 *   "all"          → show everything
 *   "squad:<id>"   → expand to that squad's member IDs
 *   "<memberId>"   → single-member array
 */
function resolveMemberIds(filterValue: string, squads: Squad[]): string[] | "all" {
  if (filterValue === "all") return "all";
  if (filterValue.startsWith("squad:")) {
    const squadId = filterValue.slice(6);
    const squad = squads.find((s) => s.id === squadId);
    return squad ? squad.members.map((m) => m.teamMemberId) : "all";
  }
  return [filterValue];
}

function memberMatches(memberId: string, memberIds: string[] | "all"): boolean {
  if (memberIds === "all") return true;
  return (memberIds as string[]).includes(memberId);
}

function getTasksForDay(
  day: Date,
  tasks: Task[],
  memberIds: string[] | "all",
  filterTypes: WorkType[]
): Task[] {
  return tasks.filter((task) => {
    if (!filterTypes.includes(task.workType)) return false;
    const asgns = (task.assignments ?? []).filter((a) => {
      if (!memberMatches(a.teamMemberId, memberIds)) return false;
      const s = parseISO(a.startDate);
      const e = parseISO(a.dueDate);
      return isWithinInterval(day, { start: s, end: e }) || isSameDay(s, day) || isSameDay(e, day);
    });
    return asgns.length > 0;
  });
}

function getNextStepsForDay(
  day: Date,
  tasks: Task[],
  memberIds: string[] | "all",
): Array<{ step: NextStep; task: Task }> {
  const results: Array<{ step: NextStep; task: Task }> = [];
  for (const task of tasks) {
    const hasMatchingAssignment =
      memberIds === "all" ||
      (task.assignments ?? []).some((a) => (memberIds as string[]).includes(a.teamMemberId));
    if (!hasMatchingAssignment) continue;

    for (const step of task.nextSteps ?? []) {
      if (!step.startDate && !step.dueDate) continue;
      const stepStart = step.startDate ? parseISO(step.startDate) : null;
      const stepEnd = step.dueDate ? parseISO(step.dueDate) : null;

      let active = false;
      if (stepStart && stepEnd) {
        active = isWithinInterval(day, { start: stepStart, end: stepEnd }) ||
          isSameDay(stepStart, day) || isSameDay(stepEnd, day);
      } else if (stepStart) {
        active = isSameDay(stepStart, day);
      } else if (stepEnd) {
        active = isSameDay(stepEnd, day);
      }
      if (active) results.push({ step, task });
    }
  }
  return results;
}

/** Find the active phase for a task on a given day (date-range based) */
function getPhaseForDay(day: Date, task: Task): TaskPhase | null {
  if (!task.phases?.length) return null;
  const sorted = [...task.phases].sort((a, b) => a.sortOrder - b.sortOrder);
  // Phase whose date range includes this day
  const inRange = sorted.find((p) => {
    if (!p.startDate || !p.endDate) return false;
    const s = parseISO(p.startDate);
    const e = parseISO(p.endDate);
    return isWithinInterval(day, { start: s, end: e }) || isSameDay(s, day) || isSameDay(e, day);
  });
  if (inRange) return inRange;
  // Fallback: first phase in order
  return sorted[0] ?? null;
}

// ── Shared filter dropdown ────────────────────────────────────────────────────
function FilterSelect({
  value,
  onChange,
  members,
  squads,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  members: TeamMember[];
  squads: Squad[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none", className)}
    >
      <option value="all">All members</option>
      {squads.length > 0 && (
        <optgroup label="── Squads ──">
          {squads.map((s) => (
            <option key={`squad:${s.id}`} value={`squad:${s.id}`}>
              {s.name}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label={squads.length > 0 ? "── Members ──" : ""}>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </optgroup>
    </select>
  );
}

// ── Editable note entry for a single brief ───────────────────────────────────
function NoteEntry({ task, onSave }: { task: Task; onSave: (notes: string) => void }) {
  const { workTypeMeta } = useWorkTypes();
  const [value, setValue] = useState(task.notes ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => { autoResize(); }, [value]);
  useEffect(() => { setValue(task.notes ?? ""); }, [task.notes]);

  return (
    <div className="px-3 py-2 space-y-1">
      <a href={`/tasks/${task.id}`} className="flex items-center gap-1.5 group">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: workTypeMeta[task.workType]?.color ?? "#9ca3af" }} />
        <span className="text-[11px] font-semibold text-gray-700 truncate group-hover:text-indigo-600 leading-tight">
          {task.name}
        </span>
      </a>
      <textarea
        ref={textareaRef}
        className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none overflow-hidden bg-gray-50 rounded px-2 py-1 border border-transparent hover:border-gray-200 focus:border-indigo-200 focus:outline-none focus:bg-white transition-colors leading-relaxed"
        value={value}
        placeholder="Add notes…"
        rows={1}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value !== (task.notes ?? "")) {
            onSave(value);
          }
        }}
      />
    </div>
  );
}

// ── Squad Section (used inside Squad View) ───────────────────────────────────
function SquadSection({
  squad,
  tasks,
  members,
  holidays,
  weekDays,
  filterTypes,
  onTaskDrop,
  onPhaseUpdate,
  onPhaseAmPmUpdate,
  onPhaseReorder,
  onDeleteHoliday,
  onDeleteLeave,
  onUpdateNotes,
  notesWidthClass,
}: {
  squad: Squad;
  tasks: Task[];
  members: TeamMember[];
  holidays: Holiday[];
  weekDays: Date[];
  filterTypes: WorkType[];
  onTaskDrop: (task: Task, offsetDays: number) => Promise<void>;
  onPhaseUpdate: (taskId: string, phase: TaskPhase, offsetDays: number) => Promise<void>;
  onPhaseAmPmUpdate: (taskId: string, updates: Array<{ phaseId: string; amPm: "AM" | "PM" | null }>) => Promise<void>;
  onPhaseReorder: (taskId: string, phaseAId: string, phaseBId: string) => Promise<void>;
  onDeleteHoliday: (id: string) => void;
  onDeleteLeave: (memberId: string, leaveId: string) => void;
  onUpdateNotes: (taskId: string, notes: string) => void;
  notesWidthClass: string;
}) {
  const { roundTagPhases } = usePhases();
  const { workTypeMeta } = useWorkTypes();
  const squadMemberIds = squad.members.map((m) => m.teamMemberId);
  const squadMembers = members.filter((m) => squadMemberIds.includes(m.id));

  // PM/ACD members cover ALL phases on any brief they're assigned to —
  // their stored assignment phaseIds are ignored.
  const pmAcdMemberIds = new Set(
    squadMembers
      .filter((m) => coversAllPhases(m.role))
      .map((m) => m.id)
  );

  // Roles permanently locked to a phase (Localisation → Localization,
  // Content Admin → Build): memberId → locked phase type.
  const lockedPhaseByMember = new Map<string, PhaseType>();
  for (const m of squadMembers) {
    const lp = lockedPhaseForRole(m.role);
    if (lp) lockedPhaseByMember.set(m.id, lp);
  }

  // Parse an assignment's stored phaseIds (a JSON array string).
  function getPhaseIds(a: { phaseId?: string | null }): string[] {
    if (!a.phaseId) return [];
    try { const v = JSON.parse(a.phaseId); return Array.isArray(v) ? v : [a.phaseId]; }
    catch { return [a.phaseId]; }
  }

  // The phases (ids) a squad assignment covers on a brief, honoring role rules:
  //   PM/ACD        → every non-INTAKE phase
  //   locked role   → the role's locked phase (always) PLUS any manually-added phases
  //   otherwise     → the assignment's stored phaseIds (or all, if none stored)
  function coveredPhaseIds(a: { teamMemberId: string; phaseId?: string | null }, taskPhases: TaskPhase[]): Set<string> {
    const nonIntake = taskPhases.filter((p) => p.type !== "INTAKE");
    if (pmAcdMemberIds.has(a.teamMemberId)) return new Set(nonIntake.map((p) => p.id));
    const locked = lockedPhaseByMember.get(a.teamMemberId);
    if (locked) {
      // The mapped phase is automatic; manual selections add to it.
      const mappedIds = nonIntake.filter((p) => p.type === locked).map((p) => p.id);
      return new Set([...getPhaseIds(a), ...mappedIds]);
    }
    const ids = getPhaseIds(a);
    if (ids.length === 0) return new Set(nonIntake.map((p) => p.id));
    return new Set(ids);
  }

  // Drag-to-reschedule state
  const ganttGridRef = useRef<HTMLDivElement>(null);
  const [draggingTask, setDraggingTask] = useState<{ task: Task; startCol: number } | null>(null);
  const [phaseDragging, setPhaseDragging] = useState<{ task: Task; phase: TaskPhase; startCol: number } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  // Separate gesture: dragging a PM-stack pill's grip handle to swap its
  // order with another PM phase sharing the same day(s) — independent of
  // the horizontal reschedule drag above.
  const [pmReorderDrag, setPmReorderDrag] = useState<string | null>(null);
  const [pmDropTarget, setPmDropTarget] = useState<string | null>(null);

  function getCol(e: React.DragEvent): number {
    if (!ganttGridRef.current) return 0;
    const rect = ganttGridRef.current.getBoundingClientRect();
    return Math.min(4, Math.max(0, Math.floor((e.clientX - rect.left) / (rect.width / 5))));
  }

  function handleGanttDragStart(e: React.DragEvent, task: Task) {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    const col = getCol(e);
    setDraggingTask({ task, startCol: col });
  }

  function handleGanttDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(getCol(e));
  }

  async function handleGanttDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropCol = getCol(e);

    if (phaseDragging) {
      const offsetDays = dropCol - phaseDragging.startCol;
      const { task, phase } = phaseDragging;
      setPhaseDragging(null);
      setDragOverCol(null);
      if (offsetDays !== 0) await onPhaseUpdate(task.id, phase, offsetDays);
      return;
    }

    if (!draggingTask) return;
    const offsetDays = dropCol - draggingTask.startCol;
    setDraggingTask(null);
    setDragOverCol(null);
    if (offsetDays === 0) return;
    await onTaskDrop(draggingTask.task, offsetDays);
  }

  // Gantt helpers — normalise to local midnight so UTC ISO strings don't shift day columns
  function weekColRange(start: Date, end: Date, wDays: Date[]): { col: number; span: number } | null {
    const nStart = localDay(start);
    const nEnd = localDay(end);
    const nWDays = wDays.map(localDay);
    const wStart = nWDays[0];
    const wEnd = nWDays[nWDays.length - 1];
    if (isAfter(nStart, wEnd) || isBefore(nEnd, wStart)) return null;
    const cStart = isBefore(nStart, wStart) ? wStart : nStart;
    const cEnd = isAfter(nEnd, wEnd) ? wEnd : nEnd;
    let col = 1;
    for (let i = 0; i < nWDays.length; i++) {
      if (!isBefore(nWDays[i], cStart)) { col = i + 1; break; }
    }
    let colEnd = nWDays.length;
    for (let i = nWDays.length - 1; i >= 0; i--) {
      if (!isAfter(nWDays[i], cEnd)) { colEnd = i + 1; break; }
    }
    return { col, span: colEnd - col + 1 };
  }
  const toLeft = (col: number) => `${(col - 1) * 20}%`;
  const toWidth = (span: number) => `${span * 20}%`;
  const GAP = 4;

  // All tasks this squad has active during the week (for Gantt).
  // A task is visible in a given week only if:
  //   - it has at least one squad member assigned, AND
  //   - at least one non-INTAKE phase with dates overlaps this week.
  // If the task has no non-INTAKE phases with dates set, fall back to
  // assignment-overlap (so tasks with no phases yet still appear).
  const weekStart = weekDays[0];
  const weekEnd   = weekDays[weekDays.length - 1];
  const weekSquadTasks = tasks.filter((task) => {
    if (!filterTypes.includes(task.workType)) return false;
    const squadAssignments = (task.assignments ?? []).filter((a) => squadMemberIds.includes(a.teamMemberId));
    if (squadAssignments.length === 0) return false;

    // Determine which non-INTAKE phases fall in this week.
    // Normalise to local midnight so a phase stored at UTC midnight doesn't
    // shift past the week boundary in non-UTC timezones (mirrors weekColRange).
    const nWeekStart = localDay(weekStart);
    const nWeekEnd   = localDay(weekEnd);
    const nonIntakePhasesInWeek = (task.phases ?? []).filter((p) => {
      if (p.type === "INTAKE" || !p.startDate || !p.endDate) return false;
      const pStart = localDay(parseISO(p.startDate));
      const pEnd   = localDay(parseISO(p.endDate));
      return !isBefore(nWeekEnd, pStart) && !isAfter(nWeekStart, pEnd);
    });
    if (nonIntakePhasesInWeek.length === 0) return false;

    // Show the brief this week if any squad assignment covers a non-INTAKE
    // phase that falls in the week (coverage honors PM/ACD + locked roles).
    return squadAssignments.some((a) => {
      const covered = coveredPhaseIds(a, task.phases ?? []);
      return nonIntakePhasesInWeek.some((p) => covered.has(p.id));
    });
  });

  // Next steps across the week — only steps explicitly assigned to a squad member
  const weekNextSteps: Array<{ step: NextStep; task: Task }> = (() => {
    const seen = new Set<string>();
    const results: Array<{ step: NextStep; task: Task }> = [];
    for (const day of weekDays) {
      for (const task of tasks) {
        for (const step of task.nextSteps ?? []) {
          if (seen.has(step.id)) continue;
          if (!step.assignedToId || !squadMemberIds.includes(step.assignedToId)) continue;
          if (!step.startDate && !step.dueDate) continue;
          const stepStart = step.startDate ? parseISO(step.startDate) : null;
          const stepEnd = step.dueDate ? parseISO(step.dueDate) : null;
          let active = false;
          if (stepStart && stepEnd) {
            active = isWithinInterval(day, { start: stepStart, end: stepEnd }) || isSameDay(stepStart, day) || isSameDay(stepEnd, day);
          } else if (stepStart) active = isSameDay(stepStart, day);
          else if (stepEnd) active = isSameDay(stepEnd, day);
          if (active) { seen.add(step.id); results.push({ step, task }); }
        }
      }
    }
    return results;
  })();

  return (
    <div className="mb-3">
      {/* Squad header */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: squad.color }} />
        <h3 className="text-sm font-bold text-gray-900">{squad.name}</h3>
        <span className="text-xs text-gray-400">{squadMembers.length} member{squadMembers.length !== 1 ? "s" : ""}</span>
        {/* Member avatars */}
        <div className="flex -space-x-1 ml-1">
          {squadMembers.slice(0, 5).map((m) => (
            <div key={m.id} title={m.name}
              className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: squad.color }}>
              {m.name[0]}
            </div>
          ))}
          {squadMembers.length > 5 && (
            <div className="w-5 h-5 rounded-full border border-white bg-gray-200 flex items-center justify-center text-[9px] text-gray-600 font-bold">
              +{squadMembers.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Gantt card + Notes row */}
      <div className="flex gap-3 mb-3 items-start">
      {/* Gantt card */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden"
        style={{ borderTopColor: squad.color, borderTopWidth: 3 }}>

        {/* Combined header: day name + date circle + holidays + OOO all inline */}
        <div className="grid grid-cols-5 border-b border-gray-200">
          {weekDays.map((day) => {
            const dayHolidays = holidays.filter((h) => {
              const hStart = parseISO(h.date);
              const hEnd = h.endDate ? parseISO(h.endDate) : hStart;
              return isWithinInterval(day, { start: hStart, end: hEnd }) || isSameDay(hStart, day);
            });
            const dayStr = format(day, "yyyy-MM-dd");
            const leavingMembers = squadMembers.filter((m) =>
              (m.leaves ?? []).some((lv) => dayInLeave(dayStr, lv))
            );
            const today = isSameDay(day, todayPH());
            return (
              <div
                key={format(day, "yyyy-MM-dd")}
                className={cn(
                  "px-2 py-1 border-r border-gray-200 last:border-r-0",
                  dayHolidays.length > 0 ? "bg-rose-50/30" : ""
                )}
              >
                {/* Row 1: day name + date + holidays */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-medium text-gray-400">{format(day, "EEE")}</span>
                  <span className={cn(
                    "text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full shrink-0",
                    today ? "bg-indigo-600 text-white" : "text-gray-700"
                  )}>
                    {format(day, "d")}
                  </span>
                  {dayHolidays.map((h) => (
                    <span key={h.id} className="group/holiday flex items-center gap-0.5 shrink-0">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", h.type === "PUBLIC" ? "bg-rose-400" : "bg-violet-400")} />
                      <span className={cn("text-[9px] truncate max-w-[52px]", h.type === "PUBLIC" ? "text-rose-500" : "text-violet-500")}>{h.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteHoliday(h.id); }}
                        className="opacity-0 group-hover/holiday:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-[9px] leading-none"
                        title="Delete holiday"
                      >×</button>
                    </span>
                  ))}
                </div>
                {/* Row 2: OOO labels (only when someone is on leave) */}
                {leavingMembers.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-0.5">
                    {leavingMembers.map((m) => {
                      const todayLeave = (m.leaves ?? []).find((lv) => dayInLeave(dayStr, lv));
                      const firstName = m.name.split(" ")[0];
                      return (
                        <span key={m.id} className="group/ooo flex items-center gap-0.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                          <span className="text-[9px] text-amber-600 whitespace-nowrap">
                            OOO - {firstName}{todayLeave?.isHalfDay ? " ½" : ""}
                          </span>
                          {todayLeave && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteLeave(m.id, todayLeave.id); }}
                              className="opacity-0 group-hover/ooo:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-[9px] leading-none"
                              title={`Delete ${m.name}'s leave`}
                            >×</button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Gantt rows — one bar per brief spanning its full date range */}
        {weekSquadTasks.length > 0 ? (
          <div
            ref={ganttGridRef}
            className="py-1.5 space-y-1.5 relative"
            onDragOver={handleGanttDragOver}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={handleGanttDrop}
          >
            {/* Column guides + holiday highlighting */}
            <div className="absolute inset-0 grid grid-cols-5 pointer-events-none" style={{ zIndex: 0 }}>
              {weekDays.map((day, i) => {
                const hasHoliday = holidays.some((h) => {
                  const hStart = parseISO(h.date);
                  const hEnd = h.endDate ? parseISO(h.endDate) : hStart;
                  return isWithinInterval(day, { start: hStart, end: hEnd }) || isSameDay(hStart, day);
                });
                return (
                  <div key={i} className={cn(
                    "border-r border-gray-100 last:border-r-0",
                    hasHoliday && "bg-rose-50/60"
                  )} />
                );
              })}
            </div>

            {/* Column hover highlight during drag */}
            {dragOverCol !== null && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 0 }}
              >
                <div
                  className="absolute inset-y-0 bg-indigo-50 transition-all"
                  style={{ left: `${dragOverCol * 20}%`, width: "20%" }}
                />
              </div>
            )}
            {weekSquadTasks.map((task) => {
              const asgns = (task.assignments ?? []).filter((a) => squadMemberIds.includes(a.teamMemberId));
              if (!asgns.length) return null;

              // Phases this squad covers on the brief, honoring PM/ACD (all) and
              // locked roles (Localisation → Localization, Content Admin → Build).
              const squadCovered = new Set(asgns.flatMap((a) => [...coveredPhaseIds(a, task.phases ?? [])]));
              const squadPhasesWithDates = (task.phases ?? []).filter(
                (p) => p.startDate && p.endDate && p.type !== "INTAKE" && squadCovered.has(p.id)
              );

              // Compute ganttPhases first — only phases that intersect THIS week
              const ganttPhases = squadPhasesWithDates
                .map((p) => {
                  const r = weekColRange(parseISO(p.startDate!), parseISO(p.endDate!), weekDays);
                  return r ? { phase: p, r } : null;
                })
                .filter((x): x is { phase: TaskPhase; r: { col: number; span: number } } => x !== null);

              // Brief bar spans only the phases visible this week; fallback to assignment dates
              let briefRange: { col: number; span: number } | null;
              if (ganttPhases.length > 0) {
                const minCol = ganttPhases.reduce((mn, { r }) => Math.min(mn, r.col), ganttPhases[0].r.col);
                const maxColEnd = ganttPhases.reduce((mx, { r }) => Math.max(mx, r.col + r.span - 1), 0);
                briefRange = { col: minCol, span: maxColEnd - minCol + 1 };
              } else {
                const bStart = asgns.reduce((mn, a) => { const d = parseISO(a.startDate); return d < mn ? d : mn; }, parseISO(asgns[0].startDate));
                const bEnd   = asgns.reduce((mx, a) => { const d = parseISO(a.dueDate);   return d > mx ? d : mx; }, parseISO(asgns[0].dueDate));
                briefRange = weekColRange(bStart, bEnd, weekDays);
              }
              if (!briefRange) return null;

              const isDone = task.status === "DONE" || task.status === "CANCELLED";
              const isOnHold = task.status === "ON_HOLD";
              const briefBg = isDone || isOnHold ? "#9ca3af" : (workTypeMeta[task.workType]?.color ?? "#9ca3af");
              const isDraggingThis = draggingTask?.task.id === task.id;

              return (
                <div key={task.id} className="space-y-0.5 px-3 relative" style={{ zIndex: 1 }}>
                  {/* Brief bar */}
                  <div className="relative h-7">
                    <div
                      draggable={!isDone}
                      onDragStart={(e) => !isDone && handleGanttDragStart(e, task)}
                      onDragEnd={() => { setDraggingTask(null); setDragOverCol(null); }}
                      className={cn(
                        "absolute inset-y-0 rounded-full flex items-center justify-center px-3 text-xs font-bold text-white cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity overflow-hidden",
                        isDone && "opacity-60 line-through cursor-default",
                        isDraggingThis && "opacity-40"
                      )}
                      style={{
                        left: `calc(${toLeft(briefRange.col)} + ${GAP}px)`,
                        width: `calc(${toWidth(briefRange.span)} - ${GAP * 2}px)`,
                        backgroundColor: briefBg,
                      }}
                      onClick={() => { if (!isDraggingThis) window.location.href = `/tasks/${task.id}`; }}
                      title={task.name}
                    >
                      <span className="truncate">{task.name}</span>
                    </div>
                  </div>

                  {/* Phase pills — AM/PM day slots, independently draggable */}
                  {ganttPhases.length > 0 && (() => {
                    const { runs, rowMaxN, bandH, rowH } = buildPhaseRuns(weekDays, squadPhasesWithDates);
                    const pmTop = rowH + ROW_GAP;
                    return (
                      <div className="relative" style={{ height: bandH }}>
                        {rowMaxN >= 2 && (
                          <>
                            <div className="absolute inset-x-0 border-t border-dashed border-gray-200" style={{ top: pmTop - ROW_GAP / 2 }} />
                            <span className="absolute text-[7px] font-bold text-gray-300 leading-none" style={{ left: -9, top: rowH / 2 - 3 }} title="AM">A</span>
                            <span className="absolute text-[7px] font-bold text-gray-300 leading-none" style={{ left: -9, top: pmTop + (bandH - pmTop) / 2 - 3 }} title="PM">P</span>
                          </>
                        )}
                        {runs.map(({ phase, col, span, top, height, slot, peers }) => {
                          const meta = PHASE_META[phase.type as PhaseType] ?? { label: phase.type, color: "#4ade80" };
                          const isDraggingPhase = phaseDragging?.phase.id === phase.id;
                          const isReviewPhase = roundTagPhases.includes(phase.type);
                          const pmSiblings = slot && isReviewPhase
                            ? runs.filter((r) => r.slot === slot && r.phase.id !== phase.id && r.peers.some((p) => p.id === phase.id))
                            : [];
                          const isPmDropTarget = pmDropTarget === phase.id;
                          return (
                            <div
                              key={`${phase.id}-${col}`}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.effectAllowed = "move";
                                setPhaseDragging({ task, phase, startCol: getCol(e) });
                              }}
                              onDragEnd={() => { setPhaseDragging(null); setDragOverCol(null); }}
                              onDragOver={(e) => {
                                if (!pmReorderDrag || !pmSiblings.some((s) => s.phase.id === pmReorderDrag)) return;
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                setPmDropTarget(phase.id);
                              }}
                              onDragLeave={() => { if (isPmDropTarget) setPmDropTarget(null); }}
                              onDrop={(e) => {
                                if (!pmReorderDrag || !pmSiblings.some((s) => s.phase.id === pmReorderDrag)) return;
                                e.preventDefault();
                                e.stopPropagation();
                                onPhaseReorder(task.id, pmReorderDrag, phase.id);
                                setPmReorderDrag(null);
                                setPmDropTarget(null);
                              }}
                              className={cn(
                                "absolute rounded-full flex items-center justify-center px-2 text-[10px] font-semibold overflow-hidden cursor-grab active:cursor-grabbing",
                                isDraggingPhase && "opacity-40",
                                isPmDropTarget && "ring-2 ring-white"
                              )}
                              style={{
                                top,
                                height,
                                left: `calc(${toLeft(col)} + ${GAP}px)`,
                                width: `calc(${toWidth(span)} - ${GAP * 2}px)`,
                                backgroundColor: meta.color + "28",
                                color: meta.color,
                              }}
                              title={`${meta.label}${slot ? ` (${slot})` : ""} — drag to reschedule`}
                            >
                              {pmSiblings.length > 0 && (
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
                              <span className="truncate">{meta.label}</span>
                              {slot && isReviewPhase && height >= 12 && (
                                <div
                                  className="flex items-center gap-0.5 shrink-0 ml-1"
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onDragStart={(e) => e.preventDefault()}
                                >
                                  {(["AM", "PM"] as const).map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (opt === slot) return;
                                        onPhaseAmPmUpdate(task.id, [{ phaseId: phase.id, amPm: opt }]);
                                      }}
                                      className={cn(
                                        "text-[8px] font-bold px-1 rounded-full border leading-tight shrink-0",
                                        opt === slot
                                          ? "bg-white border-white"
                                          : "border-current/30 opacity-50 hover:opacity-100"
                                      )}
                                      style={opt === slot ? { color: meta.color } : undefined}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );
            }).filter(Boolean)}
          </div>
        ) : (
          <div className="py-3 text-center text-[11px] text-gray-300">No briefs this week</div>
        )}
      </div>

      {/* Notes column */}
      {weekSquadTasks.length > 0 && notesWidthClass && (
        <div className={cn(notesWidthClass, "bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shrink-0 transition-all duration-200")}>
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Notes</span>
          </div>
          <div className="overflow-y-auto divide-y divide-gray-100">
            {weekSquadTasks.map((task) => (
              <NoteEntry key={task.id} task={task} onSave={(notes) => onUpdateNotes(task.id, notes)} />
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Next steps — grouped by brief */}
      {weekNextSteps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              Next Steps this week
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {(() => {
              // Group steps by task, preserving insertion order
              const byTask = new Map<string, { task: Task; steps: NextStep[] }>();
              for (const { step, task } of weekNextSteps) {
                if (!byTask.has(task.id)) byTask.set(task.id, { task, steps: [] });
                byTask.get(task.id)!.steps.push(step);
              }
              return Array.from(byTask.values()).map(({ task, steps }) => (
                <div key={task.id} className="px-3 py-2.5">
                  {/* Brief title */}
                  <a
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-1.5 mb-2 group"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: (workTypeMeta[task.workType]?.color ?? "#9ca3af") }}
                    />
                    <span className="text-xs font-semibold text-gray-800 truncate group-hover:text-indigo-700">
                      {task.name}
                    </span>
                  </a>
                  {/* Steps under this brief */}
                  <div className="space-y-1 pl-3.5 border-l-2" style={{ borderColor: squad.color + "40" }}>
                    {steps.map((step) => {
                      const assignee = members.find((m) => m.id === step.assignedToId);
                      return (
                        <div key={step.id} className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] shrink-0 leading-none",
                            step.isComplete ? "text-emerald-400" : "text-gray-300"
                          )}>●</span>
                          <p className={cn(
                            "flex-1 text-xs truncate",
                            step.isComplete ? "line-through text-gray-300" : "text-gray-600"
                          )}>
                            {step.description}
                          </p>
                          {assignee && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {assignee.name.split(" ")[0]}
                            </span>
                          )}
                          {step.dueDate && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {format(parseISO(step.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── External view helpers ────────────────────────────────────────────────────
type ExtGanttPhase = { phase: TaskPhase; r: { col: number; span: number } };
type ExtWeekBrief = { task: Task; temp: TempAssignment; ganttPhases: ExtGanttPhase[]; range: { col: number; span: number } };

function extWeekColRange(start: Date, end: Date, wDays: Date[]): { col: number; span: number } | null {
  const nStart = localDay(start);
  const nEnd = localDay(end);
  const nWDays = wDays.map(localDay);
  const wStart = nWDays[0];
  const wEnd = nWDays[nWDays.length - 1];
  if (isAfter(nStart, wEnd) || isBefore(nEnd, wStart)) return null;
  const cStart = isBefore(nStart, wStart) ? wStart : nStart;
  const cEnd = isAfter(nEnd, wEnd) ? wEnd : nEnd;
  let col = 1;
  for (let i = 0; i < nWDays.length; i++) if (!isBefore(nWDays[i], cStart)) { col = i + 1; break; }
  let colEnd = nWDays.length;
  for (let i = nWDays.length - 1; i >= 0; i--) if (!isAfter(nWDays[i], cEnd)) { colEnd = i + 1; break; }
  return { col, span: colEnd - col + 1 };
}

// For an external's briefs, the phases that are BOTH within the external's
// assignment window AND active in the given week. A brief is only included if
// it has at least one such phase — so externals with no active phase this week
// drop out entirely.
function externalWeekBriefs(items: Array<{ task: Task; temp: TempAssignment }>, weekDays: Date[]): ExtWeekBrief[] {
  const out: ExtWeekBrief[] = [];
  for (const { task, temp } of items) {
    const winStart = localDay(parseISO(temp.startDate));
    const winEnd = localDay(parseISO(temp.dueDate));
    const ganttPhases = (task.phases ?? [])
      .filter((p) => p.type !== "INTAKE" && p.startDate && p.endDate)
      .filter((p) => {
        const ps = localDay(parseISO(p.startDate!));
        const pe = localDay(parseISO(p.endDate!));
        return !isBefore(winEnd, ps) && !isAfter(winStart, pe); // phase overlaps the external's window
      })
      .map((p) => {
        const r = extWeekColRange(parseISO(p.startDate!), parseISO(p.endDate!), weekDays);
        return r ? { phase: p, r } : null;
      })
      .filter((x): x is ExtGanttPhase => x !== null);
    if (ganttPhases.length === 0) continue;
    const minCol = ganttPhases.reduce((mn, { r }) => Math.min(mn, r.col), ganttPhases[0].r.col);
    const maxColEnd = ganttPhases.reduce((mx, { r }) => Math.max(mx, r.col + r.span - 1), 0);
    out.push({ task, temp, ganttPhases, range: { col: minCol, span: maxColEnd - minCol + 1 } });
  }
  return out;
}

// ── External Section (weekly, one per external assignee) ─────────────────────
function ExternalSection({
  name,
  weekBriefs,
  weekDays,
  holidays,
}: {
  name: string;
  weekBriefs: ExtWeekBrief[];
  weekDays: Date[];
  holidays: Holiday[];
}) {
  const { workTypeMeta } = useWorkTypes();
  const toLeft = (col: number) => `${(col - 1) * 20}%`;
  const toWidth = (span: number) => `${span * 20}%`;
  const GAP = 4;
  const PILL_H = 20, PILL_GAP = 2;

  const initials =
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

  return (
    <div className="mb-3">
      {/* External header */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold shrink-0">
          {initials}
        </div>
        <h3 className="text-sm font-bold text-gray-900">{name}</h3>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">External</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ borderTopColor: "#fb923c", borderTopWidth: 3 }}>
        {/* Day header */}
        <div className="grid grid-cols-5 border-b border-gray-200">
          {weekDays.map((day) => {
            const dayHolidays = holidays.filter((h) => {
              const hStart = parseISO(h.date);
              const hEnd = h.endDate ? parseISO(h.endDate) : hStart;
              return isWithinInterval(day, { start: hStart, end: hEnd }) || isSameDay(hStart, day);
            });
            const today = isSameDay(day, todayPH());
            return (
              <div
                key={format(day, "yyyy-MM-dd")}
                className={cn("px-2 py-1 border-r border-gray-200 last:border-r-0", dayHolidays.length > 0 && "bg-rose-50/30")}
              >
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-medium text-gray-400">{format(day, "EEE")}</span>
                  <span className={cn(
                    "text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full shrink-0",
                    today ? "bg-indigo-600 text-white" : "text-gray-700"
                  )}>
                    {format(day, "d")}
                  </span>
                  {dayHolidays.map((h) => (
                    <span key={h.id} className="flex items-center gap-0.5 shrink-0">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", h.type === "PUBLIC" ? "bg-rose-400" : "bg-violet-400")} />
                      <span className={cn("text-[9px] truncate max-w-[52px]", h.type === "PUBLIC" ? "text-rose-500" : "text-violet-500")}>{h.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gantt rows — brief bar + phase pills for phases active this week */}
        <div className="py-1.5 space-y-1.5 relative">
          <div className="absolute inset-0 grid grid-cols-5 pointer-events-none" style={{ zIndex: 0 }}>
            {weekDays.map((_, i) => <div key={i} className="border-r border-gray-100 last:border-r-0" />)}
          </div>
          {weekBriefs.map(({ task, temp, ganttPhases, range }) => {
            const isDone = task.status === "DONE" || task.status === "CANCELLED";
            const isOnHold = task.status === "ON_HOLD";
            const briefBg = isDone || isOnHold ? "#9ca3af" : (workTypeMeta[task.workType]?.color ?? "#9ca3af");

            // Stack overlapping phase pills into rows
            const rowEnds: number[] = [];
            const phaseRows = [...ganttPhases].sort((a, b) => a.r.col - b.r.col).map(({ phase, r }) => {
              const colEnd = r.col + r.span;
              let row = rowEnds.findIndex((end) => end <= r.col);
              if (row === -1) row = rowEnds.length;
              rowEnds[row] = colEnd;
              return { phase, r, row };
            });
            const numRows = rowEnds.length || 1;
            const pillsH = numRows * PILL_H + (numRows - 1) * PILL_GAP;

            return (
              <div key={temp.id} className="space-y-0.5 px-3 relative" style={{ zIndex: 1 }}>
                {/* Brief bar */}
                <div className="relative h-7">
                  <div
                    className={cn(
                      "absolute inset-y-0 rounded-full flex items-center px-3 text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity overflow-hidden",
                      isDone && "opacity-60 line-through"
                    )}
                    style={{
                      left: `calc(${toLeft(range.col)} + ${GAP}px)`,
                      width: `calc(${toWidth(range.span)} - ${GAP * 2}px)`,
                      backgroundColor: briefBg,
                    }}
                    onClick={() => { window.location.href = `/tasks/${task.id}`; }}
                    title={task.name}
                  >
                    <span className="truncate">{task.name}</span>
                  </div>
                </div>

                {/* Phase pills */}
                <div className="relative" style={{ height: pillsH }}>
                  {phaseRows.map(({ phase, r, row }) => {
                    const meta = PHASE_META[phase.type as PhaseType] ?? { label: phase.type, color: "#4ade80" };
                    return (
                      <div
                        key={phase.id}
                        className="absolute rounded-full flex items-center justify-center px-2 text-[10px] font-semibold overflow-hidden"
                        style={{
                          top: row * (PILL_H + PILL_GAP),
                          height: PILL_H,
                          left: `calc(${toLeft(r.col)} + ${GAP}px)`,
                          width: `calc(${toWidth(r.span)} - ${GAP * 2}px)`,
                          backgroundColor: meta.color + "28",
                          color: meta.color,
                        }}
                        title={meta.label}
                      >
                        <span className="truncate">{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Calendar Tab ─────────────────────────────────────────────────────────────
function CalendarTab({
  tasks,
  allTasks,
  members,
  squads,
  holidays,
  setMembers,
  setHolidays,
  setTasks,
  onTaskDrop,
  onPhaseUpdate,
  onPhaseAmPmUpdate,
  onPhaseReorder,
}: {
  tasks: Task[];
  allTasks: Task[];
  members: TeamMember[];
  squads: Squad[];
  holidays: Holiday[];
  setMembers: (m: TeamMember[]) => void;
  setHolidays: (h: Holiday[]) => void;
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  onTaskDrop: (task: Task, offsetDays: number) => Promise<void>;
  onPhaseUpdate: (taskId: string, phase: TaskPhase, offsetDays: number) => Promise<void>;
  onPhaseAmPmUpdate: (taskId: string, updates: Array<{ phaseId: string; amPm: "AM" | "PM" | null }>) => Promise<void>;
  onPhaseReorder: (taskId: string, phaseAId: string, phaseBId: string) => Promise<void>;
}) {
  const { workTypeOrder, workTypeMeta } = useWorkTypes();
  const [currentDate, setCurrentDate] = useState(todayPH());
  const [view, setView] = useState<ViewMode>("squads");
  const [filterValue, setFilterValue] = useState("all");
  const [filterTypes, setFilterTypes] = useState<WorkType[]>(WORK_TYPE_ORDER);
  // Sync once the real (admin-configurable) list loads, without clobbering
  // any manual filter selection the user makes afterward.
  const didInitFilterTypes = useRef(false);
  useEffect(() => {
    if (!didInitFilterTypes.current && workTypeOrder.length) {
      setFilterTypes(workTypeOrder);
      didInitFilterTypes.current = true;
    }
  }, [workTypeOrder]);
  const [notesWidthKey, setNotesWidthKey] = useState<0 | 1 | 2 | 3>(0);
  const NOTES_WIDTHS = ["w-52", "w-72", "w-96", "hidden"] as const;
  const NOTES_LABELS = ["S", "M", "L", "Hide"] as const;
  const notesWidthClass = NOTES_WIDTHS[notesWidthKey];
  const notesHidden = notesWidthKey === 3;

  const [dragging, setDragging] = useState<{ task: Task; assignment: Assignment } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [addEvent, setAddEvent] = useState<{ defaultMember: TeamMember | null; date: Date; tab: AddEventTab } | null>(null);

  // Month Gantt drag state
  const [monthGanttDragging, setMonthGanttDragging] = useState<{ task: Task; startCol: number; weekIdx: number } | null>(null);
  const [monthGanttDragOverCol, setMonthGanttDragOverCol] = useState<number | null>(null);

  // Derived filter state
  const memberIds = resolveMemberIds(filterValue, squads);
  const isSingleMember = filterValue !== "all" && !filterValue.startsWith("squad:");
  const filteredMember = isSingleMember ? members.find((m) => m.id === filterValue) ?? null : null;

  function handleDragStart(e: React.DragEvent, task: Task, assignment: Assignment) {
    e.dataTransfer.effectAllowed = "move";
    setDragging({ task, assignment });
  }

  function handleDragOver(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(dateStr);
  }

  async function handleDrop(e: React.DragEvent, targetDate: Date) {
    e.preventDefault();
    if (!dragging) return;
    const { task, assignment } = dragging;
    const origStart = parseISO(assignment.startDate);
    const offsetDays = differenceInDays(targetDate, origStart);
    if (offsetDays === 0) { setDragging(null); setDropTarget(null); return; }

    const newStart = addDays(origStart, offsetDays).toISOString();
    const newEnd = addDays(parseISO(assignment.dueDate), offsetDays).toISOString();
    setDragging(null);
    setDropTarget(null);

    await fetch(`/api/assignments/${assignment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: newStart, dueDate: newEnd }),
    });
  }

  async function handleAddLeave(memberId: string, startDate: string, endDate: string, reason: string, isHalfDay: boolean): Promise<string | null> {
    const res = await fetch(`/api/team/${memberId}/leaves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, reason, isHalfDay }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Failed to add leave";
    const updated = await fetch("/api/team").then((r) => r.json());
    if (Array.isArray(updated)) setMembers(updated);
    return null;
  }

  async function handleAddHoliday(name: string, startDate: string, endDate: string, type: "PUBLIC" | "COMPANY"): Promise<string | null> {
    const body: Record<string, string> = { name, date: startDate, type };
    if (endDate) body.endDate = endDate;
    const res = await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Failed to add holiday";
    const updated = await fetch("/api/holidays").then((r) => r.json());
    if (Array.isArray(updated)) setHolidays(updated);
    return null;
  }

  async function handleDeleteHoliday(id: string) {
    await fetch("/api/holidays", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setHolidays(holidays.filter((h) => h.id !== id));
  }

  async function handleDeleteLeave(memberId: string, leaveId: string) {
    await fetch(`/api/team/${memberId}/leaves`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveId }),
    });
    const updated = await fetch("/api/team").then((r) => r.json());
    if (Array.isArray(updated)) setMembers(updated);
  }

  function handleDayClick(day: Date, hasTask: boolean) {
    if (hasTask || !isSingleMember) return;
    const member = members.find((m) => m.id === filterValue);
    if (!member) return;
    setAddEvent({ defaultMember: member, date: day, tab: "leave" });
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  // Only Mon–Fri; we expand each week to Mon-Fri by filtering out weekends
  const allCalDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });
  const calDays = allCalDays.filter((d) => { const dow = getDay(d); return dow !== 0 && dow !== 6; });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const allWeekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
  const weekDays = allWeekDays.filter((d) => { const dow = getDay(d); return dow !== 0 && dow !== 6; });

  // The days visible in the current view period
  const viewDays = view === "month" ? calDays : weekDays;

  function navigate(dir: 1 | -1) {
    if (view === "month") setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else setCurrentDate(dir === 1 ? dfAddWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  }

/** Maps a date range onto a 1-based column + span within weekDays (Mon=1…Fri=5). Returns null if no overlap.
   *  Normalises to local midnight so UTC ISO strings don't shift the day column. */
  function weekColRange(start: Date, end: Date, wDays: Date[]): { col: number; span: number } | null {
    const nStart = localDay(start);
    const nEnd = localDay(end);
    const nWDays = wDays.map(localDay);
    const wStart = nWDays[0];
    const wEnd = nWDays[nWDays.length - 1];
    if (isAfter(nStart, wEnd) || isBefore(nEnd, wStart)) return null;
    const cStart = isBefore(nStart, wStart) ? wStart : nStart;
    const cEnd = isAfter(nEnd, wEnd) ? wEnd : nEnd;
    let col = 1;
    for (let i = 0; i < nWDays.length; i++) {
      if (!isBefore(nWDays[i], cStart)) { col = i + 1; break; }
    }
    let colEnd = nWDays.length;
    for (let i = nWDays.length - 1; i >= 0; i--) {
      if (!isAfter(nWDays[i], cEnd)) { colEnd = i + 1; break; }
    }
    return { col, span: colEnd - col + 1 };
  }

  function renderCell(day: Date, compact: boolean) {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayTasks = getTasksForDay(day, tasks, memberIds, filterTypes);
    const today = isSameDay(day, todayPH());
    const inMonth = isSameMonth(day, currentDate);
    const leaveInfo = filteredMember ? getLeaveForDay(day, filteredMember) : null;
    const isOnLeave = !!leaveInfo;
    const isHalfDayLeave = leaveInfo?.isHalfDay ?? false;
    const isDrop = dropTarget === dateStr;
    const dayHolidays = getHolidaysForDay(day, holidays);

    // OOO badges: show for all visible members except when single-member (uses banner instead)
    const leavingMembers = !isSingleMember
      ? members.filter((m) => {
          if (!memberMatches(m.id, memberIds)) return false;
          return isDayOnLeave(day, m);
        })
      : [];

    return (
      <div
        key={dateStr}
        data-date={dateStr}
        className={cn(
          "relative border-r border-b border-gray-100 transition-colors",
          compact ? "p-1.5 min-h-[80px]" : "p-2",
          !inMonth && "bg-gray-50/60",
          isOnLeave && "bg-amber-50",
          dayHolidays.length > 0 && !isOnLeave && "bg-rose-50/40",
          isDrop && dragging && "bg-indigo-50 ring-2 ring-inset ring-indigo-300",
          !isOnLeave && dayHolidays.length === 0 && inMonth && !isDrop && "hover:bg-gray-50/80"
        )}
        onDragOver={(e) => handleDragOver(e, dateStr)}
        onDragLeave={() => setDropTarget(null)}
        onDrop={(e) => handleDrop(e, day)}
        onClick={() => handleDayClick(day, dayTasks.length > 0)}
      >
        <div className={cn(
          "text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full select-none",
          today ? "bg-indigo-600 text-white" : inMonth ? "text-gray-900" : "text-gray-300"
        )}>
          {format(day, "d")}
        </div>

        {isOnLeave && (
          <div className="flex items-center gap-1 mb-1">
            <CalendarOff className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-[10px] text-amber-600 font-medium">{isHalfDayLeave ? "½ OOO" : "OOO"}</span>
          </div>
        )}

        {leavingMembers.length > 0 && (
          <div className="flex gap-0.5 mb-1 flex-wrap">
            {leavingMembers.slice(0, 3).map((m) => (
              <div key={m.id} title={`${m.name} — OOO`}
                className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center text-[9px] text-amber-800 font-bold">
                {m.name[0]}
              </div>
            ))}
            {leavingMembers.length > 3 && (
              <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center text-[9px] text-amber-700">
                +{leavingMembers.length - 3}
              </div>
            )}
          </div>
        )}

        {dayHolidays.map((h) => (
          <div key={h.id} className="flex items-center gap-1 mb-0.5" title={h.name}>
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                h.type === "PUBLIC" ? "bg-rose-400" : "bg-violet-400"
              )}
            />
            <span className={cn(
              "text-[9px] font-medium truncate leading-tight",
              h.type === "PUBLIC" ? "text-rose-600" : "text-violet-600"
            )}>
              {h.name}
            </span>
          </div>
        ))}

        <div className="space-y-0.5">
          {dayTasks.slice(0, compact ? 2 : 4).map((task) => {
            const asgn = (task.assignments ?? []).find((a) => memberMatches(a.teamMemberId, memberIds));
            const isDraggingThis = dragging?.task.id === task.id;
            const isDone = task.status === "DONE" || task.status === "CANCELLED";
            const isOnHold = task.status === "ON_HOLD";
            const activePhase = getPhaseForDay(day, task);
            const phaseLabel = activePhase ? (PHASE_META[activePhase.type as PhaseType]?.label ?? activePhase.type) : null;
            return (
              <div
                key={task.id}
                draggable={!isDone}
                onDragStart={(e) => !isDone && asgn && handleDragStart(e, task, asgn)}
                onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                className={cn(
                  "text-xs px-1.5 py-1 rounded select-none",
                  isDone
                    ? "bg-gray-100 text-gray-400 line-through cursor-default"
                    : isOnHold
                    ? "bg-gray-100 text-gray-400 cursor-grab active:cursor-grabbing"
                    : "text-white cursor-grab active:cursor-grabbing",
                  isDraggingThis && "opacity-40"
                )}
                style={isDone || isOnHold ? undefined : { backgroundColor: (workTypeMeta[task.workType]?.color ?? "#9ca3af") }}
                title={`${task.name}${activePhase ? ` · ${PHASE_META[activePhase.type as PhaseType]?.label ?? activePhase.type}` : ""}${isDone ? ` (${task.status})` : ""}`}
                onClick={(e) => { e.stopPropagation(); window.location.href = `/tasks/${task.id}`; }}
              >
                <div className="truncate font-medium leading-tight">{task.name}</div>
                {phaseLabel && !isDone && (
                  <div className="font-bold text-base leading-tight mt-0.5 opacity-95">{phaseLabel}</div>
                )}
                {!compact && asgn && (
                  <div className="opacity-70 text-[10px] leading-tight">
                    {(asgn.teamMember as any)?.name?.split(" ")[0] ?? ""}
                  </div>
                )}
              </div>
            );
          })}
          {dayTasks.length > (compact ? 2 : 4) && (
            <p className="text-[10px] text-gray-400 px-1">+{dayTasks.length - (compact ? 2 : 4)} more</p>
          )}
        </div>

        {isSingleMember && dayTasks.length === 0 && !isOnLeave && inMonth && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-[10px] text-indigo-400 bg-white/80 px-1 rounded">+ OOO</span>
          </div>
        )}
      </div>
    );
  }

  // Save notes for a brief (optimistic update + API)
  function saveNotes(taskId: string, notes: string) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, notes } : t));
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }

  // Tasks visible anywhere in the current month (for the notes column)
  const monthTasks = (() => {
    if (calDays.length === 0) return [];
    const mStart = calDays[0];
    const mEnd = calDays[calDays.length - 1];
    return tasks.filter((task) => {
      if (!filterTypes.includes(task.workType)) return false;
      const relevant = (task.assignments ?? []).filter((a) => memberMatches(a.teamMemberId, memberIds));
      if (relevant.length === 0) return false;
      return relevant.some((a) => {
        const aStart = parseISO(a.startDate);
        const aEnd = parseISO(a.dueDate);
        return !isBefore(mEnd, aStart) && !isAfter(mStart, aEnd);
      });
    });
  })();

  // External (guest) assignees across all briefs, grouped by name — for the
  // External view. Respects the work-type filter.
  const externalGroups = (() => {
    const map = new Map<string, Array<{ task: Task; temp: TempAssignment }>>();
    for (const task of allTasks) {
      if (!filterTypes.includes(task.workType)) continue;
      for (const temp of task.tempAssignments ?? []) {
        const name = (temp.guestName ?? "").trim() || "Unnamed";
        if (!map.has(name)) map.set(name, []);
        map.get(name)!.push({ task, temp });
      }
    }
    return [...map.entries()]
      .map(([name, items]) => ({
        name,
        items: items.sort((a, b) => a.temp.startDate.localeCompare(b.temp.startDate)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  return (
    <div className="p-4 flex-1 flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-gray-900 min-w-44 text-center">
            {view === "month" ? format(currentDate, "MMMM yyyy") : `Week of ${format(weekStart, "MMM d, yyyy")}`}
          </h2>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentDate(todayPH())} className="text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1">Today</button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {(["month", "squads", "external"] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn(
                "px-3 py-1.5 text-xs font-medium capitalize",
                view === v ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
              )}>{v}</button>
            ))}
          </div>
          {view !== "external" && (
            <button
              onClick={() => setAddEvent({ defaultMember: filteredMember, date: todayPH(), tab: "leave" })}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
          {view === "month" && (
            <FilterSelect value={filterValue} onChange={setFilterValue} members={members} squads={squads} />
          )}
          <TypeFilterDropdown selected={filterTypes} onChange={setFilterTypes} />
          {/* Notes width toggle */}
          {view !== "external" && (
            <button
              onClick={() => setNotesWidthKey(((notesWidthKey + 1) % 4) as 0 | 1 | 2 | 3)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              title="Toggle notes column width"
            >
              Notes: {NOTES_LABELS[notesWidthKey]}
            </button>
          )}
        </div>
      </div>

      {view === "month" && (
        <div className="flex items-center gap-4 text-[11px] text-gray-400">
          <span>Drag briefs to reschedule</span>
          {isSingleMember && <span>· Click an empty day to mark OOO</span>}
          {dragging && <span className="text-indigo-500 font-medium">Dragging: {dragging.task.name}</span>}
        </div>
      )}

      {/* ── Squad view ── */}
      {view === "squads" ? (
        <div className="flex-1 overflow-y-auto">
          {squads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-sm text-gray-500 font-medium">No squads set up yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Go to <a href="/admin/team" className="text-indigo-600 underline">Admin → Team</a> to create squads
              </p>
            </div>
          ) : (
            [...squads]
              .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
              .map((squad) => (
              <SquadSection
                key={squad.id}
                squad={squad}
                tasks={tasks}
                members={members}
                holidays={holidays}
                weekDays={weekDays}
                filterTypes={filterTypes}
                onTaskDrop={onTaskDrop}
                onPhaseUpdate={onPhaseUpdate}
                onPhaseAmPmUpdate={onPhaseAmPmUpdate}
                onPhaseReorder={onPhaseReorder}
                onDeleteHoliday={handleDeleteHoliday}
                onDeleteLeave={handleDeleteLeave}
                onUpdateNotes={saveNotes}
                notesWidthClass={notesHidden ? "" : notesWidthClass}
              />
            ))
          )}
        </div>
      ) : view === "external" ? (
        /* ── External view — weekly, one section per external assignee ── */
        (() => {
          const weekGroups = externalGroups
            .map(({ name, items }) => ({ name, weekBriefs: externalWeekBriefs(items, weekDays) }))
            .filter((g) => g.weekBriefs.length > 0);
          return (
            <div className="flex-1 overflow-y-auto">
              {externalGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <p className="text-sm text-gray-500 font-medium">No external assignees</p>
                  <p className="text-xs text-gray-400 mt-1">
                    External collaborators added to a brief (via “Add external”) will show here.
                  </p>
                </div>
              ) : weekGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <p className="text-sm text-gray-500 font-medium">No externals active this week</p>
                  <p className="text-xs text-gray-400 mt-1">Use the arrows to browse other weeks.</p>
                </div>
              ) : (
                weekGroups.map(({ name, weekBriefs }) => (
                  <ExternalSection key={name} name={name} weekBriefs={weekBriefs} weekDays={weekDays} holidays={holidays} />
                ))
              )}
            </div>
          );
        })()
      ) : (
        <div className="flex-1 flex gap-3 min-h-0">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col min-w-0">
            <div className="grid grid-cols-5 border-b border-gray-300 shrink-0">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
              ))}
            </div>
            {/* ── Month Gantt view — one Gantt row-group per calendar week ── */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-300">
                {Array.from({ length: Math.ceil(calDays.length / 5) }, (_, weekIdx) => {
                  const wDays = calDays.slice(weekIdx * 5, weekIdx * 5 + 5);

                  // Tasks whose date range overlaps this week.
                  // A task is visible if a filtered member's assignment dates overlap the week,
                  // OR that member's assignment covers a non-INTAKE phase that falls in this week.
                  // This prevents a member assigned only to Localization from seeing a task
                  // during Creative Development weeks.
                  // Normalise to local midnight so UTC-midnight dates don't shift
                  // past the week boundary in non-UTC timezones (mirrors weekColRange).
                  const wStart = localDay(wDays[0]);
                  const wEnd   = localDay(wDays[wDays.length - 1]);
                  const weekTasks = tasks.filter((task) => {
                    if (!filterTypes.includes(task.workType)) return false;
                    const relevantAssignments = (task.assignments ?? []).filter((a) =>
                      memberMatches(a.teamMemberId, memberIds)
                    );
                    if (relevantAssignments.length === 0) return false;
                    return relevantAssignments.some((a) => {
                      const aStart = localDay(parseISO(a.startDate));
                      const aEnd   = localDay(parseISO(a.dueDate));
                      // 1. Assignment itself overlaps this week
                      if (!isBefore(wEnd, aStart) && !isAfter(wStart, aEnd)) return true;
                      // 2. A non-INTAKE phase is in this week AND covered by this member's assignment
                      return (task.phases ?? [])
                        .filter((p) => p.type !== "INTAKE" && p.startDate && p.endDate)
                        .some((p) => {
                          const pStart = localDay(parseISO(p.startDate!));
                          const pEnd   = localDay(parseISO(p.endDate!));
                          const phaseInWeek       = !isBefore(wEnd, pStart) && !isAfter(wStart, pEnd);
                          const assignCoversPhase = !isBefore(aEnd, pStart) && !isAfter(aStart, pEnd);
                          return phaseInWeek && assignCoversPhase;
                        });
                    });
                  });

                  const toLeft = (col: number) => `${(col - 1) * 20}%`;
                  const toWidth = (span: number) => `${span * 20}%`;
                  const GAP = 4;

                  return (
                    <div key={weekIdx} className="shrink-0">
                      {/* Compact date context row */}
                      <div className="grid grid-cols-5 border-b border-gray-200">
                        {wDays.map((day) => {
                          const dayHolidays = getHolidaysForDay(day, holidays);
                          const leaveInfoSq = filteredMember ? getLeaveForDay(day, filteredMember) : null;
                          const isOnLeave = !!leaveInfoSq;
                          const isHalfDayLeaveSq = leaveInfoSq?.isHalfDay ?? false;
                          const leavingMembers = !isSingleMember
                            ? members.filter((m) => memberMatches(m.id, memberIds) && isDayOnLeave(day, m))
                            : [];
                          const inMonth = isSameMonth(day, currentDate);
                          return (
                            <div
                              key={format(day, "yyyy-MM-dd")}
                              className={cn(
                                "px-2 py-1.5 border-r border-gray-200 last:border-r-0",
                                isOnLeave && "bg-amber-50",
                                dayHolidays.length > 0 && !isOnLeave && "bg-rose-50/30",
                                !inMonth && "opacity-40"
                              )}
                            >
                              <div className={cn(
                                "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full",
                                isSameDay(day, todayPH()) ? "bg-indigo-600 text-white" : inMonth ? "text-gray-700" : "text-gray-300"
                              )}>
                                {format(day, "d")}
                              </div>
                              {dayHolidays.map((h) => (
                                <div key={h.id} className="group/mh flex items-center gap-0.5 mt-0.5">
                                  <span className={cn("w-1 h-1 rounded-full shrink-0", h.type === "PUBLIC" ? "bg-rose-400" : "bg-violet-400")} />
                                  <span className={cn("text-[8px] truncate", h.type === "PUBLIC" ? "text-rose-600" : "text-violet-600")}>{h.name}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteHoliday(h.id); }}
                                    className="opacity-0 group-hover/mh:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-[8px] leading-none shrink-0"
                                    title="Delete holiday"
                                  >×</button>
                                </div>
                              ))}
                              {isOnLeave && filteredMember && (() => {
                                const todayLeave = (filteredMember.leaves ?? []).find((lv) =>
                                  isWithinInterval(day, { start: parseISO(lv.startDate), end: parseISO(lv.endDate) })
                                );
                                return (
                                  <div className="group/mooo flex items-center gap-0.5 mt-0.5">
                                    <p className="text-[8px] text-amber-600 font-medium">{isHalfDayLeaveSq ? "½ OOO" : "OOO"}</p>
                                    {todayLeave && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteLeave(filteredMember.id, todayLeave.id); }}
                                        className="opacity-0 group-hover/mooo:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-[8px] leading-none"
                                        title="Delete leave"
                                      >×</button>
                                    )}
                                  </div>
                                );
                              })()}
                              {leavingMembers.slice(0, 1).map((m) => {
                                const todayLeave = (m.leaves ?? []).find((lv) =>
                                  isWithinInterval(day, { start: parseISO(lv.startDate), end: parseISO(lv.endDate) })
                                );
                                return (
                                  <div key={m.id} className="group/mooo2 flex items-center gap-0.5">
                                    <span className="text-[8px] text-amber-600 truncate">{m.name.split(" ")[0]} OOO</span>
                                    {todayLeave && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteLeave(m.id, todayLeave.id); }}
                                        className="opacity-0 group-hover/mooo2:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-[8px] leading-none shrink-0"
                                        title={`Delete ${m.name}'s leave`}
                                      >×</button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>

                      {/* Gantt brief + phase rows for this week */}
                      {weekTasks.length > 0 ? (
                        <div
                          className="py-1.5 space-y-1.5 relative"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (monthGanttDragging?.weekIdx !== weekIdx) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const col = Math.min(4, Math.max(0, Math.floor((e.clientX - rect.left) / (rect.width / 5))));
                            setMonthGanttDragOverCol(col);
                          }}
                          onDragLeave={() => { if (monthGanttDragging?.weekIdx === weekIdx) setMonthGanttDragOverCol(null); }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            if (!monthGanttDragging || monthGanttDragging.weekIdx !== weekIdx) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const dropCol = Math.min(4, Math.max(0, Math.floor((e.clientX - rect.left) / (rect.width / 5))));
                            const offsetDays = dropCol - monthGanttDragging.startCol;
                            setMonthGanttDragging(null);
                            setMonthGanttDragOverCol(null);
                            if (offsetDays === 0) return;
                            await onTaskDrop(monthGanttDragging.task, offsetDays);
                          }}
                        >
                          {/* Column guides + holiday highlighting */}
                          <div className="absolute inset-0 grid grid-cols-5 pointer-events-none" style={{ zIndex: 0 }}>
                            {wDays.map((day, i) => {
                              const hasHoliday = holidays.some((h) => {
                                const hStart = parseISO(h.date);
                                const hEnd = h.endDate ? parseISO(h.endDate) : hStart;
                                return isWithinInterval(day, { start: hStart, end: hEnd }) || isSameDay(hStart, day);
                              });
                              return (
                                <div key={i} className={cn(
                                  "border-r border-gray-100 last:border-r-0",
                                  hasHoliday && "bg-rose-50/60"
                                )} />
                              );
                            })}
                          </div>

                          {/* Column hover highlight during drag */}
                          {monthGanttDragging?.weekIdx === weekIdx && monthGanttDragOverCol !== null && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{ zIndex: 0 }}
                            >
                              <div
                                className="absolute inset-y-0 bg-indigo-50 transition-all"
                                style={{ left: `${monthGanttDragOverCol * 20}%`, width: "20%" }}
                              />
                            </div>
                          )}
                          {weekTasks.map((task) => {
                            const asgns = (task.assignments ?? []).filter((a) => memberMatches(a.teamMemberId, memberIds));
                            const phasesWithDates = (task.phases ?? []).filter((p) => p.startDate && p.endDate && p.type !== "INTAKE");

                            const ganttPhases = phasesWithDates
                              .map((p) => {
                                const r = weekColRange(parseISO(p.startDate!), parseISO(p.endDate!), wDays);
                                return r ? { phase: p, r } : null;
                              })
                              .filter((x): x is { phase: TaskPhase; r: { col: number; span: number } } => x !== null);

                            let briefRange: { col: number; span: number } | null;
                            if (ganttPhases.length > 0) {
                              const minCol = ganttPhases.reduce((mn, { r }) => Math.min(mn, r.col), ganttPhases[0].r.col);
                              const maxColEnd = ganttPhases.reduce((mx, { r }) => Math.max(mx, r.col + r.span - 1), 0);
                              briefRange = { col: minCol, span: maxColEnd - minCol + 1 };
                            } else {
                              if (!asgns.length) return null;
                              const bStart = asgns.reduce((mn, a) => { const d = parseISO(a.startDate); return d < mn ? d : mn; }, parseISO(asgns[0].startDate));
                              const bEnd   = asgns.reduce((mx, a) => { const d = parseISO(a.dueDate);   return d > mx ? d : mx; }, parseISO(asgns[0].dueDate));
                              briefRange = weekColRange(bStart, bEnd, wDays);
                            }
                            if (!briefRange) return null;

                            const isDone = task.status === "DONE" || task.status === "CANCELLED";
                            const isOnHold = task.status === "ON_HOLD";
                            const briefBg = isDone || isOnHold ? "#9ca3af" : (workTypeMeta[task.workType]?.color ?? "#9ca3af");
                            const isDraggingThis = monthGanttDragging?.task.id === task.id && monthGanttDragging.weekIdx === weekIdx;

                            return (
                              <div key={`${weekIdx}-${task.id}`} className="space-y-1 px-3 relative" style={{ zIndex: 1 }}>
                                {/* Brief title bar */}
                                <div className="relative h-7">
                                  <div
                                    draggable={!isDone}
                                    onDragStart={(e) => {
                                      if (isDone) return;
                                      e.stopPropagation();
                                      e.dataTransfer.effectAllowed = "move";
                                      const rect = e.currentTarget.closest(".py-2")?.getBoundingClientRect();
                                      const col = rect
                                        ? Math.min(4, Math.max(0, Math.floor((e.clientX - rect.left) / (rect.width / 5))))
                                        : 0;
                                      setMonthGanttDragging({ task, startCol: col, weekIdx });
                                    }}
                                    onDragEnd={() => { setMonthGanttDragging(null); setMonthGanttDragOverCol(null); }}
                                    className={cn(
                                      "absolute inset-y-0 rounded-full flex items-center justify-center px-3 text-xs font-bold text-white cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity overflow-hidden",
                                      isDone && "opacity-60 line-through cursor-default",
                                      isDraggingThis && "opacity-40"
                                    )}
                                    style={{
                                      left: `calc(${toLeft(briefRange.col)} + ${GAP}px)`,
                                      width: `calc(${toWidth(briefRange.span)} - ${GAP * 2}px)`,
                                      backgroundColor: briefBg,
                                    }}
                                    onClick={() => { if (!isDraggingThis) window.location.href = `/tasks/${task.id}`; }}
                                    title={task.name}
                                  >
                                    <span className="truncate">{task.name}</span>
                                  </div>
                                </div>

                                {/* Phase pills */}
                                {ganttPhases.length > 0 && (() => {
                                  const PILL_H = 20, PILL_GAP = 2;
                                  const rowEnds: number[] = [];
                                  const phaseRows = ganttPhases.map(({ phase, r }) => {
                                    const colEnd = r.col + r.span;
                                    let row = rowEnds.findIndex((end) => end <= r.col);
                                    if (row === -1) { row = rowEnds.length; }
                                    rowEnds[row] = colEnd;
                                    return { phase, r, row };
                                  });
                                  const numRows = rowEnds.length || 1;
                                  const containerH = numRows * PILL_H + (numRows - 1) * PILL_GAP;
                                  return (
                                    <div className="relative" style={{ height: containerH }}>
                                      {phaseRows.map(({ phase, r, row }) => {
                                        const meta = PHASE_META[phase.type as PhaseType] ?? { label: phase.type, color: "#4ade80" };
                                        return (
                                          <div
                                            key={phase.id}
                                            className="absolute rounded-full flex items-center justify-center px-2 text-[10px] font-semibold overflow-hidden"
                                            style={{
                                              top: row * (PILL_H + PILL_GAP),
                                              height: PILL_H,
                                              left: `calc(${toLeft(r.col)} + ${GAP}px)`,
                                              width: `calc(${toWidth(r.span)} - ${GAP * 2}px)`,
                                              backgroundColor: meta.color + "28",
                                              color: meta.color,
                                            }}
                                            title={meta.label}
                                          >
                                            <span className="truncate">{meta.label}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          }).filter(Boolean)}
                        </div>
                      ) : (
                        <div className="py-3 text-center text-[11px] text-gray-300">No briefs</div>
                      )}
                    </div>
                  );
                })}
              </div>
          </div>

          {/* Notes column */}
          {!notesHidden && (
            <div className={cn(notesWidthClass, "bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shrink-0 transition-all duration-200")}>
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {monthTasks.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-gray-300 text-center">No briefs this month</p>
                ) : (
                  monthTasks.map((task) => (
                    <NoteEntry key={task.id} task={task} onSave={(notes) => saveNotes(task.id, notes)} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 flex-wrap pt-1">
        {[
          { label: "Strategic", color: "#6366f1" },
          { label: "Task", color: "#f59e0b" },
          { label: "BAU", color: "#10b981" },
          { label: "Micro", color: "#06b6d4" },
          { label: "Leave / OOO", color: "#fbbf24", bg: true },
          { label: "Public holiday", dotColor: "#f87171" },
          { label: "Company holiday", dotColor: "#a78bfa" },
        ].map(({ label, color, bg, dotColor }) => (
          <div key={label} className="flex items-center gap-1.5">
            {dotColor ? (
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
            ) : (
              <div className={cn("w-2.5 h-2.5 rounded-sm shrink-0", bg && "border border-amber-300")} style={{ backgroundColor: bg ? "#fef3c7" : color }} />
            )}
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {addEvent && (
        <AddEventModal
          members={members}
          defaultMember={addEvent.defaultMember}
          defaultDate={addEvent.date}
          defaultTab={addEvent.tab}
          onSaveLeave={handleAddLeave}
          onSaveHoliday={handleAddHoliday}
          onClose={() => setAddEvent(null)}
        />
      )}
    </div>
  );
}

// ── Main Views Page ──────────────────────────────────────────────────────────
export default function ViewsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  function loadData() {
    setLoading(true);
    setLoadError(false);
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/team").then((r) => r.json()),
      fetch("/api/squads").then((r) => r.json()),
      fetch("/api/holidays").then((r) => r.json()),
    ]).then(([td, md, sd, hd]) => {
      setTasks(Array.isArray(td) ? td : []);
      setMembers(Array.isArray(md) ? md : []);
      setSquads(Array.isArray(sd) ? sd : []);
      setHolidays(Array.isArray(hd) ? hd : []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setLoadError(true);
    });
  }

  useEffect(() => { loadData(); }, []);

  async function handleTaskDrop(task: Task, offsetDays: number): Promise<void> {
    if (offsetDays === 0) return;

    // Optimistic update
    setTasks((prev) => prev.map((t) => {
      if (t.id !== task.id) return t;
      const shiftDate = (d: string) => addDays(parseISO(d), offsetDays).toISOString();
      return {
        ...t,
        startDate: t.startDate ? shiftDate(t.startDate) : t.startDate,
        dueDate: t.dueDate ? shiftDate(t.dueDate) : t.dueDate,
        assignments: (t.assignments ?? []).map((a) => ({
          ...a,
          startDate: shiftDate(a.startDate),
          dueDate: shiftDate(a.dueDate),
        })),
        phases: (t.phases ?? []).map((p) => ({
          ...p,
          startDate: p.startDate ? shiftDate(p.startDate) : p.startDate,
          endDate: p.endDate ? shiftDate(p.endDate) : p.endDate,
        })),
      };
    }));

    // Fire all PATCHes in parallel
    const patches: Promise<Response>[] = [];

    // Assignment patches
    for (const asgn of task.assignments ?? []) {
      const newStart = addDays(parseISO(asgn.startDate), offsetDays).toISOString();
      const newEnd = addDays(parseISO(asgn.dueDate), offsetDays).toISOString();
      patches.push(fetch(`/api/assignments/${asgn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: newStart, dueDate: newEnd }),
      }));
    }

    // Task-level dates patch (if set)
    if (task.startDate && task.dueDate) {
      const newStart = addDays(parseISO(task.startDate), offsetDays).toISOString();
      const newEnd = addDays(parseISO(task.dueDate), offsetDays).toISOString();
      patches.push(fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: newStart, dueDate: newEnd }),
      }));
    }

    // Phase patches
    for (const phase of task.phases ?? []) {
      if (!phase.startDate || !phase.endDate) continue;
      const newStart = addDays(parseISO(phase.startDate), offsetDays).toISOString();
      const newEnd = addDays(parseISO(phase.endDate), offsetDays).toISOString();
      patches.push(fetch(`/api/tasks/${task.id}/phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: newStart, endDate: newEnd }),
      }));
    }

    await Promise.all(patches);
  }

  async function handlePhaseUpdate(taskId: string, phase: TaskPhase, offsetDays: number): Promise<void> {
    if (!phase.startDate || !phase.endDate || offsetDays === 0) return;
    const newStart = addDays(parseISO(phase.startDate), offsetDays).toISOString();
    const newEnd   = addDays(parseISO(phase.endDate),   offsetDays).toISOString();

    // Optimistic update — shift just this phase
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        phases: (t.phases ?? []).map((p) =>
          p.id === phase.id ? { ...p, startDate: newStart, endDate: newEnd } : p
        ),
      };
    }));

    await fetch(`/api/tasks/${taskId}/phases/${phase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: newStart, endDate: newEnd }),
    });
  }

  async function handlePhaseAmPmUpdate(
    taskId: string,
    updates: Array<{ phaseId: string; amPm: "AM" | "PM" | null }>
  ): Promise<void> {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        phases: (t.phases ?? []).map((p) => {
          const u = updates.find((x) => x.phaseId === p.id);
          return u ? { ...p, amPm: u.amPm } : p;
        }),
      };
    }));

    await Promise.all(updates.map((u) =>
      fetch(`/api/tasks/${taskId}/phases/${u.phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amPm: u.amPm }),
      })
    ));
  }

  async function handlePhaseReorder(taskId: string, phaseAId: string, phaseBId: string): Promise<void> {
    if (phaseAId === phaseBId) return;
    const task = tasks.find((t) => t.id === taskId);
    const a = task?.phases?.find((p) => p.id === phaseAId);
    const b = task?.phases?.find((p) => p.id === phaseBId);
    if (!a || !b) return;

    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        phases: (t.phases ?? []).map((p) => {
          if (p.id === a.id) return { ...p, sortOrder: b.sortOrder };
          if (p.id === b.id) return { ...p, sortOrder: a.sortOrder };
          return p;
        }),
      };
    }));

    await Promise.all([
      fetch(`/api/tasks/${taskId}/phases/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/tasks/${taskId}/phases/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Calendar" />

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
      ) : loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-gray-500">Couldn't load calendar data.</p>
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <CalendarTab
          tasks={tasks.filter((t) => {
            // Always keep terminal tasks (they may show as past bars)
            if (t.status === "DONE" || t.status === "CANCELLED") return true;
            // Only show if at least one phase beyond Intake exists
            // Tasks with no phases or only INTAKE phases are not yet actionable
            return (t.phases ?? []).some((p) => p.type !== "INTAKE");
          })}
          allTasks={tasks}
          members={members} squads={squads} holidays={holidays}
          setMembers={setMembers} setHolidays={setHolidays} setTasks={setTasks}
          onTaskDrop={handleTaskDrop} onPhaseUpdate={handlePhaseUpdate}
          onPhaseAmPmUpdate={handlePhaseAmPmUpdate}
          onPhaseReorder={handlePhaseReorder}
        />
      )}
    </div>
  );
}
