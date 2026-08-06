"use client";

import { useState, useEffect, useRef } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { WorkTypeBadge, StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";
import { format, parseISO, isWithinInterval, endOfWeek, isBefore, startOfDay } from "date-fns";
import { ChevronDown, ChevronUp, Plus, Trash2, UserCheck, Archive, Link2, ExternalLink, PanelRightClose, PanelRightOpen } from "lucide-react";
import { RichBrainDump } from "@/components/ui/rich-brain-dump";
import type { Task, TeamMember, NextStep, NextStepChecklistItem, TaskStatus, Squad } from "@/types";

const OPEN_STATUSES: TaskStatus[] = ["INTAKE", "IN_PROGRESS", "REVIEW", "BLOCKED"];
const MY_MEMBER_KEY = "lc-my-member-id";

// ── Types ────────────────────────────────────────────────────────────────────

interface GeneralTodoSubtask {
  id: string;
  todoId: string;
  description: string;
  isComplete: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface GeneralTodo {
  id: string;
  teamMemberId: string;
  description: string;
  isComplete: boolean;
  isArchived: boolean;
  completedAt: string | null;
  url: string | null;
  dueDate: string | null;
  sortOrder: number;
  subtasks: GeneralTodoSubtask[];
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveMemberIds(filterValue: string, squads: Squad[]): string[] | "all" {
  if (filterValue === "all") return "all";
  if (filterValue.startsWith("squad:")) {
    const squadId = filterValue.slice(6);
    const squad = squads.find((s) => s.id === squadId);
    return squad ? squad.members.map((m) => m.teamMemberId) : "all";
  }
  return [filterValue];
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// ── Filter dropdown ──────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  members,
  squads,
}: {
  value: string;
  onChange: (v: string) => void;
  members: TeamMember[];
  squads: Squad[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
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


// ── Self-contained todo section per member ───────────────────────────────────

function MemberTodoSection({ memberId }: { memberId: string }) {
  const [todos, setTodos] = useState<GeneralTodo[]>([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubText, setNewSubText] = useState<Record<string, string>>({});
  const [editingUrlFor, setEditingUrlFor] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const subInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Auto-focus the sub-task input whenever it opens
  useEffect(() => {
    if (addingSubFor) {
      const t = setTimeout(() => subInputRefs.current[addingSubFor]?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [addingSubFor]);

  useEffect(() => {
    fetch(`/api/team/${memberId}/todos`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTodos(data); });
  }, [memberId]);

  // Auto-focus URL input when it opens
  useEffect(() => {
    if (editingUrlFor) setTimeout(() => urlInputRef.current?.focus(), 0);
  }, [editingUrlFor]);

  async function addTodo() {
    const text = newText.trim();
    if (!text || saving) return;
    setSaving(true);
    const res = await fetch(`/api/team/${memberId}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text }),
    });
    const created = await res.json();
    if (res.ok) {
      setTodos((prev) => [...prev, { ...created, subtasks: created.subtasks ?? [] }]);
      setNewText("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    setSaving(false);
  }

  async function toggleTodo(todo: GeneralTodo) {
    const isComplete = !todo.isComplete;
    setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, isComplete } : t));
    await fetch(`/api/team/${memberId}/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete }),
    });
  }

  async function deleteTodo(todoId: string) {
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
    await fetch(`/api/team/${memberId}/todos/${todoId}`, { method: "DELETE" });
  }

  async function archiveTodo(todoId: string) {
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
    await fetch(`/api/team/${memberId}/todos/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
  }

  async function updateUrl(todoId: string, raw: string) {
    const url = normalizeUrl(raw);
    setTodos((prev) => prev.map((t) => t.id === todoId ? { ...t, url } : t));
    setEditingUrlFor(null);
    setUrlDraft("");
    await fetch(`/api/team/${memberId}/todos/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  }

  function openUrlEditor(todo: GeneralTodo) {
    setEditingUrlFor(todo.id);
    setUrlDraft(todo.url ?? "");
  }

  function toggleExpand(todoId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(todoId) ? next.delete(todoId) : next.add(todoId);
      return next;
    });
  }

  async function addSubtask(todoId: string) {
    const text = (newSubText[todoId] ?? "").trim();
    if (!text) return;
    const res = await fetch(`/api/team/${memberId}/todos/${todoId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text }),
    });
    const created = await res.json();
    if (res.ok) {
      setTodos((prev) => prev.map((t) => t.id === todoId
        ? { ...t, subtasks: [...(t.subtasks ?? []), created] }
        : t
      ));
      setNewSubText((prev) => ({ ...prev, [todoId]: "" }));
      setTimeout(() => subInputRefs.current[todoId]?.focus(), 0);
    }
  }

  async function toggleSubtask(todoId: string, sub: GeneralTodoSubtask) {
    const isComplete = !sub.isComplete;
    setTodos((prev) => prev.map((t) => t.id === todoId
      ? { ...t, subtasks: (t.subtasks ?? []).map((s) => s.id === sub.id ? { ...s, isComplete } : s) }
      : t
    ));
    await fetch(`/api/team/${memberId}/todos/${todoId}/subtasks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete }),
    });
  }

  async function deleteSubtask(todoId: string, subtaskId: string) {
    setTodos((prev) => prev.map((t) => t.id === todoId
      ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) }
      : t
    ));
    await fetch(`/api/team/${memberId}/todos/${todoId}/subtasks/${subtaskId}`, { method: "DELETE" });
  }

  const openTodos = todos.filter((t) => !t.isComplete);
  const doneTodos = todos.filter((t) => t.isComplete);
  const ordered = [...openTodos, ...doneTodos];

  return (
    <div className="bg-gray-50/60 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-700">
      <div className="px-4 pt-2.5 pb-1">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">General</span>
      </div>

      {ordered.map((todo) => {
        const isExpanded = !collapsed.has(todo.id);
        const isEditingUrl = editingUrlFor === todo.id;
        const subtaskCount = (todo.subtasks ?? []).length;
        const doneSubCount = (todo.subtasks ?? []).filter((s) => s.isComplete).length;

        return (
          <div key={todo.id}>
            {/* Main todo row */}
            <div className="flex items-center gap-2.5 px-4 py-1.5 group">
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo)}
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                  todo.isComplete
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-gray-300 dark:border-slate-600 hover:border-indigo-400"
                )}
              >
                {todo.isComplete && <span className="text-[9px] font-bold leading-none">✓</span>}
              </button>

              {/* Description — clickable link if url is set */}
              {todo.url ? (
                <a
                  href={todo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "flex-1 text-sm flex items-center gap-1 min-w-0",
                    todo.isComplete
                      ? "line-through text-gray-300"
                      : "text-indigo-600 hover:text-indigo-700"
                  )}
                >
                  <span className="truncate">{todo.description}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                </a>
              ) : (
                <p className={cn(
                  "flex-1 text-sm truncate",
                  todo.isComplete ? "line-through text-gray-300 dark:text-slate-600" : "text-gray-700 dark:text-slate-300"
                )}>
                  {todo.description}
                </p>
              )}

              {/* Link icon — always visible (colored) when url set, shows on hover otherwise */}
              <button
                onClick={(e) => { e.stopPropagation(); isEditingUrl ? setEditingUrlFor(null) : openUrlEditor(todo); }}
                title={todo.url ? "Edit link" : "Add link"}
                className={cn(
                  "shrink-0 p-0.5 transition-all",
                  todo.url
                    ? "text-indigo-400 hover:text-indigo-600"
                    : "opacity-0 group-hover:opacity-100 text-gray-300 hover:text-indigo-400"
                )}
              >
                <Link2 className="w-3 h-3" />
              </button>

              {/* Subtask count badge + expand toggle */}
              {subtaskCount > 0 && (
                <button
                  onClick={() => toggleExpand(todo.id)}
                  className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-indigo-500 shrink-0"
                >
                  <span>{doneSubCount}/{subtaskCount}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {/* Add sub-task + button — always on hover */}
              <button
                onClick={() => {
                  // Ensure the subtask section is visible
                  setCollapsed((prev) => { const n = new Set(prev); n.delete(todo.id); return n; });
                  setAddingSubFor(todo.id);
                }}
                title="Add sub-task"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-indigo-400 shrink-0"
              >
                <Plus className="w-3 h-3" />
              </button>

              {/* Archive (completed only) */}
              {todo.isComplete && (
                <button
                  onClick={() => archiveTodo(todo.id)}
                  title="Archive"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-amber-500 shrink-0"
                >
                  <Archive className="w-3 h-3" />
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-rose-400 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* URL editor — inline row below the todo */}
            {isEditingUrl && (
              <div className="flex items-center gap-2 pl-10 pr-4 py-1.5 bg-indigo-50/60 dark:bg-indigo-950/40 border-t border-b border-indigo-100/80 dark:border-indigo-900/60">
                <Link2 className="w-3 h-3 text-indigo-400 shrink-0" />
                <input
                  ref={urlInputRef}
                  type="url"
                  placeholder="Paste a link… (e.g. notion.so/…)"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") { e.preventDefault(); updateUrl(todo.id, urlDraft); }
                    if (e.key === "Escape") { setEditingUrlFor(null); setUrlDraft(""); }
                  }}
                  className="flex-1 text-xs bg-transparent border-0 outline-none text-indigo-700 placeholder-indigo-300"
                />
                {todo.url && (
                  <button
                    onClick={() => updateUrl(todo.id, "")}
                    className="text-[10px] text-gray-400 hover:text-rose-400 shrink-0"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={() => updateUrl(todo.id, urlDraft)}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 shrink-0"
                >
                  Save
                </button>
              </div>
            )}

            {/* Subtasks */}
            {(isExpanded || addingSubFor === todo.id) && (
              <div className="pb-1 ml-[2.625rem] mr-4 pl-1">
                {(todo.subtasks ?? []).map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 py-1 group/sub">
                    <button
                      onClick={() => toggleSubtask(todo.id, sub)}
                      className={cn(
                        "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                        sub.isComplete
                          ? "bg-emerald-400 border-emerald-400 text-white"
                          : "border-gray-300 dark:border-slate-600 hover:border-indigo-300"
                      )}
                    >
                      {sub.isComplete && <span className="text-[8px] font-bold leading-none">✓</span>}
                    </button>
                    <p className={cn(
                      "flex-1 text-sm",
                      sub.isComplete ? "line-through text-gray-300 dark:text-slate-600" : "text-gray-600 dark:text-slate-400"
                    )}>
                      {sub.description}
                    </p>
                    <button
                      onClick={() => deleteSubtask(todo.id, sub.id)}
                      className="opacity-0 group-hover/sub:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-rose-400 shrink-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {addingSubFor === todo.id && (
                  <div className="flex items-center gap-2 py-1">
                    <span className="w-3.5 h-3.5 shrink-0" />
                    <input
                      ref={(el) => { subInputRefs.current[todo.id] = el; }}
                      type="text"
                      placeholder="Add sub-task…"
                      value={newSubText[todo.id] ?? ""}
                      onChange={(e) => setNewSubText((prev) => ({ ...prev, [todo.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") { e.preventDefault(); addSubtask(todo.id); }
                        if (e.key === "Escape") { setAddingSubFor(null); setNewSubText((prev) => ({ ...prev, [todo.id]: "" })); }
                      }}
                      onBlur={() => {
                        if (!(newSubText[todo.id] ?? "").trim()) {
                          setAddingSubFor(null);
                          setNewSubText((prev) => ({ ...prev, [todo.id]: "" }));
                        }
                      }}
                      className="flex-1 text-sm bg-transparent border-0 outline-none placeholder-gray-300 text-gray-600"
                    />
                    <button
                      onClick={() => addSubtask(todo.id)}
                      disabled={!(newSubText[todo.id] ?? "").trim()}
                      className="p-0.5 text-gray-300 hover:text-indigo-400 disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add new to-do input */}
      <div className="flex items-center gap-2.5 px-4 py-2">
        <span className="w-4 h-4 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a to-do…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") { e.preventDefault(); addTodo(); }
          }}
          className="flex-1 text-sm bg-transparent border-0 outline-none placeholder-gray-300 text-gray-700"
        />
        <button
          onClick={addTodo}
          disabled={!newText.trim() || saving}
          className="p-0.5 text-gray-300 hover:text-indigo-500 disabled:opacity-30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Auto-archive helper ───────────────────────────────────────────────────────

function getArchiveDelayMs(): number {
  try {
    if (localStorage.getItem("lc-auto-archive-enabled") === "false") return Infinity;
    const n = parseInt(localStorage.getItem("lc-auto-archive-mins") ?? "10", 10);
    return (isNaN(n) || n < 1 ? 10 : n) * 60 * 1000;
  } catch {
    return 10 * 60 * 1000;
  }
}

// ── Per-brief next-step section ──────────────────────────────────────────────

function BriefStepsSection({ task, memberId }: { task: Task; memberId: string }) {
  const [steps, setSteps] = useState<NextStep[]>(() =>
    (task.nextSteps ?? []).filter((s) => !s.isComplete && s.assignedToId === memberId)
  );
  const [newStepText, setNewStepText] = useState("");
  const [newStepDue, setNewStepDue] = useState("");
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubText, setNewSubText] = useState<Record<string, string>>({});
  const [newSubDue, setNewSubDue] = useState<Record<string, string>>({});
  const stepInputRef = useRef<HTMLInputElement>(null);
  const subInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // Pending-archive tracking: IDs that have been completed but not yet removed
  const [pendingArchiveSteps, setPendingArchiveSteps] = useState<Set<string>>(new Set());
  const stepTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const itemTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all pending timers on unmount
  useEffect(() => {
    const sTimers = stepTimers.current;
    const iTimers = itemTimers.current;
    return () => { sTimers.forEach(clearTimeout); iTimers.forEach(clearTimeout); };
  }, []);

  // Reliably focus the sub-item input whenever it opens
  useEffect(() => {
    if (addingSubFor) {
      const t = setTimeout(() => subInputRefs.current[addingSubFor]?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [addingSubFor]);

  async function toggleStep(step: NextStep) {
    // Mark visually complete; schedule removal after configured delay
    setPendingArchiveSteps((prev) => new Set(prev).add(step.id));
    const delayMs = getArchiveDelayMs();
    if (isFinite(delayMs)) {
      const timer = setTimeout(() => {
        setSteps((prev) => prev.filter((s) => s.id !== step.id));
        setPendingArchiveSteps((prev) => { const n = new Set(prev); n.delete(step.id); return n; });
        stepTimers.current.delete(step.id);
      }, delayMs);
      stepTimers.current.set(step.id, timer);
    } else {
      // Auto-archive disabled — remove immediately
      setSteps((prev) => prev.filter((s) => s.id !== step.id));
      setPendingArchiveSteps((prev) => { const n = new Set(prev); n.delete(step.id); return n; });
    }
    await fetch(`/api/tasks/${task.id}/next-steps/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete: true }),
    });
  }

  async function deleteStep(stepId: string) {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    await fetch(`/api/tasks/${task.id}/next-steps/${stepId}`, { method: "DELETE" });
  }

  async function archiveStep(step: NextStep) {
    // Cancel any pending auto-archive timer
    const timer = stepTimers.current.get(step.id);
    if (timer) { clearTimeout(timer); stepTimers.current.delete(step.id); }
    // Remove from view immediately
    setSteps((prev) => prev.filter((s) => s.id !== step.id));
    setPendingArchiveSteps((prev) => { const n = new Set(prev); n.delete(step.id); return n; });
    // Mark complete in DB
    await fetch(`/api/tasks/${task.id}/next-steps/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete: true }),
    });
  }

  async function archiveChecklistItem(stepId: string, item: NextStepChecklistItem) {
    // Cancel any pending auto-archive timer
    const timer = itemTimers.current.get(item.id);
    if (timer) { clearTimeout(timer); itemTimers.current.delete(item.id); }
    // Remove from view immediately
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, checklistItems: (s.checklistItems ?? []).filter((c) => c.id !== item.id) }
          : s
      )
    );
    // Mark complete in DB
    await fetch(`/api/tasks/${task.id}/next-steps/${stepId}/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete: true }),
    });
  }

  async function addStep() {
    const text = newStepText.trim();
    if (!text) return;
    const res = await fetch(`/api/tasks/${task.id}/next-steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text, assignedToId: memberId, ...(newStepDue && { dueDate: newStepDue }) }),
    });
    const created = await res.json();
    if (res.ok) {
      setSteps((prev) => [...prev, { ...created, checklistItems: created.checklistItems ?? [] }]);
      setNewStepText("");
      setNewStepDue("");
      setTimeout(() => stepInputRef.current?.focus(), 0);
    }
  }

  async function toggleChecklistItem(stepId: string, item: NextStepChecklistItem) {
    const isComplete = !item.isComplete;
    // Update visual state immediately
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, checklistItems: (s.checklistItems ?? []).map((c) => (c.id === item.id ? { ...c, isComplete } : c)) }
          : s
      )
    );
    if (isComplete) {
      // Schedule removal after delay
      const delayMs = getArchiveDelayMs();
      if (isFinite(delayMs)) {
        const timer = setTimeout(() => {
          setSteps((prev) =>
            prev.map((s) =>
              s.id === stepId
                ? { ...s, checklistItems: (s.checklistItems ?? []).filter((c) => c.id !== item.id) }
                : s
            )
          );
          itemTimers.current.delete(item.id);
        }, delayMs);
        itemTimers.current.set(item.id, timer);
      }
    } else {
      // Un-completing — cancel any pending archive
      const timer = itemTimers.current.get(item.id);
      if (timer) { clearTimeout(timer); itemTimers.current.delete(item.id); }
    }
    await fetch(`/api/tasks/${task.id}/next-steps/${stepId}/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete }),
    });
  }

  async function deleteChecklistItem(stepId: string, itemId: string) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, checklistItems: (s.checklistItems ?? []).filter((c) => c.id !== itemId) } : s
      )
    );
    await fetch(`/api/tasks/${task.id}/next-steps/${stepId}/checklist/${itemId}`, { method: "DELETE" });
  }

  async function addChecklistItem(stepId: string) {
    const text = (newSubText[stepId] ?? "").trim();
    if (!text) return;
    const res = await fetch(`/api/tasks/${task.id}/next-steps/${stepId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text, ...(newSubDue[stepId] && { dueDate: newSubDue[stepId] }) }),
    });
    const created = await res.json();
    if (res.ok) {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, checklistItems: [...(s.checklistItems ?? []), created] } : s
        )
      );
      setNewSubText((prev) => ({ ...prev, [stepId]: "" }));
      setNewSubDue((prev) => ({ ...prev, [stepId]: "" }));
      setAddingSubFor(null);
    }
  }

  return (
    <div className="border-t border-gray-50">
      {steps.map((step) => {
        const checklistItems = step.checklistItems ?? [];
        const doneCount = checklistItems.filter((c) => c.isComplete).length;

        return (
          <div key={step.id}>
            {/* Step row */}
            {(() => {
              const isPending = pendingArchiveSteps.has(step.id);
              return (
                <div className="flex items-center gap-2.5 pl-10 pr-4 py-1.5 group/step hover:bg-gray-50/60 transition-colors">
                  <button
                    onClick={() => !isPending && toggleStep(step)}
                    disabled={isPending}
                    className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                      isPending
                        ? "bg-emerald-400 border-emerald-400 text-white cursor-default"
                        : "border-gray-300 hover:border-emerald-400"
                    )}
                    title={isPending ? "Archiving soon…" : "Mark complete"}
                  >
                    {isPending && <span className="text-[9px] font-bold leading-none">✓</span>}
                  </button>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isPending ? "bg-gray-200" : "bg-indigo-300")} />
                  <p className={cn(
                    "flex-1 text-sm truncate",
                    isPending ? "line-through text-gray-300" : "text-gray-600"
                  )}>
                    {step.description}
                  </p>

                  {/* Checklist count (read-only) */}
                  {!isPending && checklistItems.length > 0 && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {doneCount}/{checklistItems.length}
                    </span>
                  )}

                  {!isPending && step.dueDate && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {format(parseISO(step.dueDate), "MMM d")}
                    </span>
                  )}

                  {/* Add sub-item + button — inline on hover (hidden when pending) */}
                  {!isPending && (
                    <button
                      onClick={() => setAddingSubFor(step.id)}
                      title="Add sub-item"
                      className="opacity-0 group-hover/step:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-indigo-400 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}

                  {!isPending && (
                    <button
                      onClick={() => archiveStep(step)}
                      title="Archive (mark done & hide)"
                      className="opacity-0 group-hover/step:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-indigo-400 shrink-0"
                    >
                      <Archive className="w-3 h-3" />
                    </button>
                  )}

                  {!isPending && (
                    <button
                      onClick={() => deleteStep(step.id)}
                      title="Delete"
                      className="opacity-0 group-hover/step:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-rose-400 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Checklist items — shown when items exist or actively adding */}
            {(checklistItems.length > 0 || addingSubFor === step.id) && (
              <div className="pb-1 pr-4 ml-[3.5rem] pl-1">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-0.5 group/item">
                    <button
                      onClick={() => toggleChecklistItem(step.id, item)}
                      className={cn(
                        "w-3 h-3 rounded border flex items-center justify-center shrink-0 transition-colors",
                        item.isComplete
                          ? "bg-emerald-400 border-emerald-400 text-white"
                          : "border-gray-300 hover:border-indigo-300"
                      )}
                    >
                      {item.isComplete && <span className="text-[7px] font-bold leading-none">✓</span>}
                    </button>
                    <p className={cn(
                      "flex-1 text-sm",
                      item.isComplete ? "line-through text-gray-300" : "text-gray-600"
                    )}>
                      {item.description}
                    </p>
                    {item.dueDate && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {format(parseISO(item.dueDate), "MMM d")}
                      </span>
                    )}
                    <button
                      onClick={() => archiveChecklistItem(step.id, item)}
                      title="Archive (mark done & hide)"
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-indigo-400 shrink-0"
                    >
                      <Archive className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => deleteChecklistItem(step.id, item.id)}
                      title="Delete"
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 text-gray-300 hover:text-rose-400 shrink-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {/* Inline add sub-item input */}
                {addingSubFor === step.id && (
                  <div
                    className="flex items-center gap-2 py-0.5"
                    onBlur={(e) => {
                      // Dismiss (when empty) if focus moves outside this row
                      if (!e.currentTarget.contains(e.relatedTarget as Node) && !(newSubText[step.id] ?? "").trim()) {
                        setAddingSubFor(null);
                      }
                    }}
                  >
                    <span className="w-3 h-3 shrink-0" />
                    <input
                      ref={(el) => { subInputRefs.current[step.id] = el; }}
                      type="text"
                      placeholder="Add sub-item…"
                      value={newSubText[step.id] ?? ""}
                      onChange={(e) => setNewSubText((prev) => ({ ...prev, [step.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") { e.preventDefault(); addChecklistItem(step.id); }
                        if (e.key === "Escape") { setAddingSubFor(null); }
                      }}
                      className="flex-1 text-sm bg-transparent border-0 outline-none placeholder-gray-300 text-gray-600"
                    />
                    <input
                      type="date"
                      value={newSubDue[step.id] ?? ""}
                      onChange={(e) => setNewSubDue((prev) => ({ ...prev, [step.id]: e.target.value }))}
                      className="text-[10px] text-gray-400 bg-transparent border-0 outline-none w-28 shrink-0"
                    />
                    <button
                      onClick={() => addChecklistItem(step.id)}
                      disabled={!(newSubText[step.id] ?? "").trim()}
                      className="p-0.5 text-gray-300 hover:text-indigo-400 disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add next step input */}
      <div className="flex items-center gap-2.5 pl-10 pr-4 py-1.5">
        <span className="w-3.5 h-3.5 shrink-0" />
        <span className="w-1.5 h-1.5 shrink-0" />
        <input
          ref={stepInputRef}
          type="text"
          placeholder="Add next step…"
          value={newStepText}
          onChange={(e) => setNewStepText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") { e.preventDefault(); addStep(); }
          }}
          className="flex-1 text-xs bg-transparent border-0 outline-none placeholder-gray-300 text-gray-600"
        />
        <input
          type="date"
          value={newStepDue}
          onChange={(e) => setNewStepDue(e.target.value)}
          className="text-[10px] text-gray-400 bg-transparent border-0 outline-none w-28 shrink-0"
        />
        <button
          onClick={addStep}
          disabled={!newStepText.trim()}
          className="p-0.5 text-gray-300 hover:text-indigo-500 disabled:opacity-30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MyWorkPage() {
  const { isAdmin, user } = useCurrentUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [showBrainDump, setShowBrainDump] = useState(true);

  // For non-admins, always use their linked team member
  const lockedMemberId = !isAdmin ? (user?.teamMemberId ?? null) : null;

  function toggleBrainDump() {
    setShowBrainDump((v) => {
      const next = !v;
      try { localStorage.setItem("lc-brain-dump-visible", String(next)); } catch {}
      return next;
    });
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MY_MEMBER_KEY);
      if (saved) {
        setFilterValue(saved);
        setMyMemberId(saved);
      }
      const bd = localStorage.getItem("lc-brain-dump-visible");
      if (bd !== null) setShowBrainDump(bd !== "false");
    } catch {}

    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/team").then((r) => r.json()),
      fetch("/api/squads").then((r) => r.json()),
    ]).then(([td, md, sd]) => {
      setTasks(Array.isArray(td) ? td : []);
      setMembers(Array.isArray(md) ? md : []);
      setSquads(Array.isArray(sd) ? sd : []);
      setLoading(false);
    });
  }, []);

  function handleFilterChange(v: string) {
    setFilterValue(v);
  }

  function setAsMe() {
    if (!filterValue || filterValue === "all" || filterValue.startsWith("squad:")) return;
    try { localStorage.setItem(MY_MEMBER_KEY, filterValue); } catch {}
    setMyMemberId(filterValue);
  }

  function clearMe() {
    try { localStorage.removeItem(MY_MEMBER_KEY); } catch {}
    setMyMemberId(null);
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Non-admins are locked to their own member; admins use the filter
  const effectiveFilter = lockedMemberId ?? filterValue;
  const memberIds = resolveMemberIds(effectiveFilter, squads);
  const openTasks = tasks.filter((t) => OPEN_STATUSES.includes(t.status));

  const displayMembers = memberIds === "all"
    ? members
    : members.filter((m) => (memberIds as string[]).includes(m.id));

  function getTasksForMember(memberId: string) {
    return openTasks.filter((t) => (t.assignments ?? []).some((a) => a.teamMemberId === memberId));
  }

  const isSingleMember = effectiveFilter !== "all" && !effectiveFilter.startsWith("squad:");
  const isMyMember = isSingleMember && effectiveFilter === myMemberId;

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="My Work" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex flex-col gap-4">
          {/* Non-admin with no linked team member */}
          {!isAdmin && !lockedMemberId && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <UserCheck className="w-10 h-10 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">No team account linked</p>
              <p className="text-xs text-gray-400 text-center max-w-xs">
                Please ask your admin to link your user account to a team member in Admin → Settings → Access &amp; Permissions.
              </p>
            </div>
          )}

          {/* Top bar: filter (admin) + brain dump toggle */}
          {(isAdmin || lockedMemberId) && (
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <>
                  <FilterSelect
                    value={filterValue}
                    onChange={handleFilterChange}
                    members={members}
                    squads={squads}
                  />
                  {isSingleMember && !isMyMember && (
                    <button
                      onClick={setAsMe}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-lg transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Set as me
                    </button>
                  )}
                  {isMyMember && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>My view</span>
                      <button onClick={clearMe} className="ml-1 text-indigo-400 hover:text-indigo-700">×</button>
                    </div>
                  )}
                </>
              )}
              {/* Brain Dump toggle */}
              <button
                onClick={toggleBrainDump}
                title={showBrainDump ? "Hide Brain Dump" : "Show Brain Dump"}
                className={cn(
                  "ml-auto p-1.5 rounded-lg transition-colors",
                  showBrainDump
                    ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    : "text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
                )}
              >
                {showBrainDump ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Only show content if admin or non-admin has linked member */}
          {(!isAdmin && !lockedMemberId) ? null : loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
          ) : (
            <div className={cn("flex gap-5 items-start", !showBrainDump && "max-w-4xl")}>
              {/* Left: Member cards */}
              <div className="flex-1 min-w-0 space-y-4">
                {displayMembers.map((member) => {
                  const memberTasks = getTasksForMember(member.id);
                  const totalSteps = tasks.reduce((n, t) =>
                    n + (t.nextSteps ?? []).filter((s) => !s.isComplete && s.assignedToId === member.id).length, 0);
                  const isCollapsed = collapsed[member.id];

                  return (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        onClick={() => toggleCollapse(member.id)}
                      >
                        <Avatar name={member.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">
                            {memberTasks.length} open brief{memberTasks.length !== 1 ? "s" : ""}
                            {isAdmin && <>{" · "}{totalSteps} next step{totalSteps !== 1 ? "s" : ""}</>}
                          </p>
                        </div>
                        {member.id === myMemberId && (
                          <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">me</span>
                        )}
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                      </button>

                      {!isCollapsed && (
                        <div className="divide-y divide-gray-100">
                          {/* General todos — always first */}
                          <MemberTodoSection memberId={member.id} />

                          {memberTasks.length === 0 && totalSteps === 0 && (
                            <p className="px-4 py-3 text-sm text-gray-400 text-center">No open briefs or next steps</p>
                          )}

                          {memberTasks.map((task) => {
                            const today = startOfDay(new Date());
                            const parsedDue = task.dueDate ? parseISO(task.dueDate) : null;
                            const isDueOverdue = parsedDue ? isBefore(parsedDue, today) : false;
                            const isDueSoon = parsedDue && !isDueOverdue
                              ? isWithinInterval(parsedDue, { start: today, end: endOfWeek(new Date(), { weekStartsOn: 1 }) })
                              : false;
                            return (
                              <div key={task.id}>
                                <a
                                  href={`/tasks/${task.id}`}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/40 transition-colors"
                                >
                                  <StatusBadge status={task.status} />
                                  <p className="flex-1 text-base font-medium text-gray-900 truncate">{task.name}</p>
                                  <WorkTypeBadge type={task.workType} />
                                  {parsedDue && (
                                    <span className={cn(
                                      "text-base font-semibold shrink-0 px-1.5 py-0.5 rounded-md",
                                      isDueOverdue ? "text-red-600 bg-red-50" :
                                      isDueSoon ? "text-amber-600 bg-amber-50" :
                                      "text-gray-500"
                                    )}>
                                      {format(parsedDue, "MMM d")}
                                    </span>
                                  )}
                                </a>
                                {isAdmin && <BriefStepsSection task={task} memberId={member.id} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {displayMembers.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">No members match this filter</p>
                )}
              </div>

              {/* Right: Brain Dump panel */}
              {showBrainDump && (
                <div className="w-[440px] shrink-0 sticky top-4">
                  <RichBrainDump onHide={toggleBrainDump} userId={user?.id ?? undefined} memberId={user?.teamMemberId ?? lockedMemberId ?? undefined} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
