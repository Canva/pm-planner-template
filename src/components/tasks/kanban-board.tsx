"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { WorkTypeBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePhases } from "@/lib/phases-context";
import { format, parseISO, isBefore, isAfter } from "date-fns";
import { todayPH, phCalendarDate } from "@/lib/tz";
import type { Task, TeamMember, TaskStatus, Squad } from "@/types";

type KanbanColumnKey = string;

interface KanbanColumn {
  key: KanbanColumnKey;
  label: string;
  color: string;
}

function columnKeyToStatus(key: KanbanColumnKey): TaskStatus {
  if (key === "DONE") return "DONE";
  if (key === "ON_HOLD") return "ON_HOLD";
  if (key === "INTAKE") return "INTAKE";
  return "IN_PROGRESS";
}

export function getTaskPhaseColumn(task: Task): string {
  if (task.status === "ON_HOLD") return "ON_HOLD";
  if (task.status === "DONE" || task.status === "CANCELLED") return "DONE";
  // BAU tasks have no fixed pipeline — their custom phase names (if any)
  // aren't real columns here, so bucket by status only. Not-yet-started BAU
  // work goes to Intake; everything else shares the Creative Development
  // column, labeled "Creative Development/In Progress" for that reason.
  if (task.workType === "BAU") return task.status === "INTAKE" ? "INTAKE" : "CREATIVE_DEVELOPMENT";
  if (!task.phases?.length) return "INTAKE";
  const sorted = [...task.phases].sort((a, b) => a.sortOrder - b.sortOrder);
  if (task.currentPhaseType) {
    // Treat currentPhaseType as an authoritative override (e.g. set via drag-and-drop)
    return task.currentPhaseType;
  }
  // Resolve by date in Philippine time, comparing calendar dates so single-day
  // phases (start === end === today) and week boundaries aren't dropped.
  const today = todayPH();
  const withDates = sorted.filter((p) => p.startDate && p.endDate);
  const current = withDates.find((p) =>
    !isBefore(today, phCalendarDate(p.startDate!)) && !isAfter(today, phCalendarDate(p.endDate!))
  );
  if (current) return current.type;
  const upcoming = withDates
    .filter((p) => isAfter(phCalendarDate(p.startDate!), today))
    .sort((a, b) => phCalendarDate(a.startDate!).getTime() - phCalendarDate(b.startDate!).getTime())[0];
  if (upcoming) return upcoming.type;
  return sorted[sorted.length - 1].type;
}

function resolveMemberIds(filterValue: string, squads: Squad[]): string[] | "all" {
  if (filterValue === "all") return "all";
  if (filterValue.startsWith("squad:")) {
    const squadId = filterValue.slice(6);
    const squad = squads.find((s) => s.id === squadId);
    return squad ? squad.members.map((m) => m.teamMemberId) : "all";
  }
  return [filterValue];
}

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

export function KanbanBoard({
  tasks: initialTasks,
  members,
  squads,
}: {
  tasks: Task[];
  members: TeamMember[];
  squads: Squad[];
}) {
  const { phaseOrder, phaseMeta } = usePhases();
  const kanbanColumns: KanbanColumn[] = [
    ...phaseOrder.map((key) => ({
      key,
      // Display-only override — BAU "In Progress" work shares this column
      // with briefs in Creative Development (see getTaskPhaseColumn). The
      // underlying phase name itself is unchanged everywhere else.
      label: key === "CREATIVE_DEVELOPMENT" ? "Creative Development/In Progress" : (phaseMeta[key]?.label ?? key),
      color: phaseMeta[key]?.color ?? "#94a3b8",
    })),
    { key: "ON_HOLD", label: "On Hold", color: "#6b7280" },
    { key: "DONE", label: "Done", color: "#10b981" },
  ];

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filterValue, setFilterValue] = useState("all");
  const [dragOver, setDragOver] = useState<KanbanColumnKey | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  const memberIds = resolveMemberIds(filterValue, squads);
  const filtered =
    memberIds === "all"
      ? tasks
      : tasks.filter((t) =>
          (t.assignments ?? []).some((a) => (memberIds as string[]).includes(a.teamMemberId))
        );

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", taskId);
    setDraggingId(taskId);
  }

  function handleDragOver(e: React.DragEvent, key: KanbanColumnKey) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(key);
  }

  async function handleDrop(e: React.DragEvent, colKey: KanbanColumnKey) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    setDragOver(null);
    setDraggingId(null);
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (getTaskPhaseColumn(task) === colKey) return;

    const newStatus = columnKeyToStatus(colKey);
    // For phase columns, pin currentPhaseType so getTaskPhaseColumn places the card correctly.
    // For DONE, clear the pin so it doesn't ghost back into a phase column on refresh.
    // For ON_HOLD, keep the existing phase so the card can return to it when un-held.
    // BAU cards are placed by status alone (see getTaskPhaseColumn) — no fixed
    // phase to pin, so always clear it rather than storing a phase-like string.
    const newPhaseType: string | null =
      task.workType === "BAU" ? null :
      colKey === "DONE" ? null :
      colKey === "ON_HOLD" ? (task.currentPhaseType ?? null) :
      colKey;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, currentPhaseType: newPhaseType } : t
      )
    );
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, currentPhaseType: newPhaseType }),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <FilterSelect
          value={filterValue}
          onChange={setFilterValue}
          members={members}
          squads={squads}
        />
        <span className="text-xs text-gray-400">Drag cards to update phase</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {kanbanColumns.map(({ key, label, color }) => {
          const colTasks = filtered.filter((t) => getTaskPhaseColumn(t) === key);
          const isDropTarget = dragOver === key;
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col rounded-xl border border-gray-200 bg-gray-50 min-w-[180px] w-44 shrink-0 transition-colors overflow-hidden",
                isDropTarget && "ring-2 ring-indigo-300 bg-indigo-50/30"
              )}
              style={{ borderTopColor: color, borderTopWidth: 4 }}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, key)}
            >
              <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">{label}</span>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: color }}
                >
                  {colTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-2 min-h-[80px]">
                {colTasks.map((task) => {
                  const assignees = (task.assignments ?? [])
                    .map((a) => members.find((m) => m.id === a.teamMemberId))
                    .filter(Boolean) as TeamMember[];
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className={cn(
                        "bg-white rounded-lg border border-gray-200 p-2.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none",
                        draggingId === task.id && "opacity-40"
                      )}
                      onClick={() => { window.location.href = `/tasks/${task.id}`; }}
                    >
                      <p className="text-xs font-medium text-gray-900 mb-1.5 line-clamp-2">
                        {task.name}
                      </p>
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <WorkTypeBadge type={task.workType} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex -space-x-1">
                          {assignees.slice(0, 3).map((m) => (
                            <Avatar key={m.id} name={m.name} size="sm" />
                          ))}
                        </div>
                        {task.dueDate && (
                          <span className="text-[10px] text-gray-400">
                            {format(parseISO(task.dueDate), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center py-6 text-[11px] text-gray-300">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
