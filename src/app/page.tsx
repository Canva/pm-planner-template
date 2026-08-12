"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { WorkTypeBadge } from "@/components/ui/badge";
import { MemberCapacityCard } from "@/components/team/member-capacity-card";
import { formatDate, cn } from "@/lib/utils";
import { format, startOfWeek, addWeeks, subWeeks, isBefore, parseISO, addDays, startOfDay } from "date-fns";
import {
  ChevronLeft, ChevronRight, ExternalLink,
  Inbox, Clock, AlertCircle, AlertTriangle, TrendingUp, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import Link from "next/link";
import { PHASE_META } from "@/types";
import type { WeeklySummary, Task, PhaseType } from "@/types";
import { useWorkTypes } from "@/lib/work-types-context";

export default function DashboardPage() {
  const { workTypeOrder, workTypeMeta } = useWorkTypes();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [weekDate, setWeekDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showCapacity, setShowCapacity] = useState(true);

  // Quick stats (all-time, not week-scoped)
  const [intakeCount, setIntakeCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    const [summaryRes, intakeRes, allRes] = await Promise.all([
      fetch(`/api/weekly-summary?week=${weekDate.toISOString()}`),
      fetch("/api/tasks?intake=true"),
      fetch("/api/tasks"),
    ]);
    const [summaryData, intakeTasks, allTasksRaw] = await Promise.all([
      summaryRes.json(),
      intakeRes.json(),
      allRes.json().catch(() => []),
    ]);
    setSummary(summaryData && !summaryData.error ? summaryData : null);
    setIntakeCount(Array.isArray(intakeTasks) ? intakeTasks.length : 0);
    const fetchedTasks: Task[] = Array.isArray(allTasksRaw) ? allTasksRaw : [];
    setInProgressCount(fetchedTasks.filter((t) => t.status === "IN_PROGRESS").length);
    setAllTasks(fetchedTasks);
    setLoading(false);
  }, [weekDate]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const activeTasks = summary?.activeTasks ?? [];
  const dueTasks = summary?.dueTasks ?? [];
  const overdueTasks = summary?.overdueTasks ?? [];
  const atRiskTasks = summary?.atRiskTasks ?? [];
  const memberSummaries = summary?.memberSummaries ?? [];
  const capacityRisks = summary?.capacityRisks ?? [];
  const workTypeBreakdown = summary?.workTypeBreakdown ?? { STRATEGIC: 0, TASK: 0, BAU: 0, MICRO: 0 };

  // Briefs missing phases (phase-readiness check)
  const tasksNeedingPhases = allTasks
    .filter((t) => !["DONE", "CANCELLED"].includes(t.status))
    .map((task) => {
      const phaseTypes = (task.phases ?? []).map((p) => p.type);
      if (phaseTypes.length === 0) return { task, label: "FOR INTAKE" };
      if (phaseTypes.every((p) => p === "INTAKE")) return { task, label: "FOR KICKOFF" };
      if (phaseTypes.every((p) => p === "INTAKE" || p === "KICKOFF")) return { task, label: "FOR RESOURCING" };
      return null;
    })
    .filter(Boolean) as { task: Task; label: string }[];

  // "Due this week" grouped by assignee
  const dueByMember: Record<string, { name: string; tasks: Task[] }> = {};
  const unassignedDue: Task[] = [];
  for (const task of dueTasks) {
    const assignees = (task.assignments ?? []).map((a) => a.teamMember).filter(Boolean);
    if (assignees.length === 0) { unassignedDue.push(task); continue; }
    for (const member of assignees) {
      if (!member) continue;
      if (!dueByMember[member.id]) dueByMember[member.id] = { name: member.name, tasks: [] };
      if (!dueByMember[member.id].tasks.find((t) => t.id === task.id)) dueByMember[member.id].tasks.push(task);
    }
  }

  const weekLabel = `${format(startOfWeek(weekDate, { weekStartsOn: 1 }), "MMM d")} – ${format(new Date(summary?.weekEnd || weekDate), "MMM d, yyyy")}`;

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Dashboard"
        actions={
          <div className="flex items-center gap-2">
            {/* Week nav */}
            <button onClick={() => setWeekDate(subWeeks(weekDate, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Week of {weekLabel}</span>
            <button onClick={() => setWeekDate(addWeeks(weekDate, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setWeekDate(new Date())} className="text-xs text-indigo-600 hover:text-indigo-700 px-2">Today</button>
            {/* Team Capacity panel toggle */}
            <button
              onClick={() => setShowCapacity((v) => !v)}
              title={showCapacity ? "Hide Team Capacity" : "Show Team Capacity"}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg border border-gray-200 transition-colors"
            >
              {showCapacity
                ? <PanelRightClose className="w-3.5 h-3.5" />
                : <PanelRightOpen className="w-3.5 h-3.5" />}
            </button>
            {/* Weekly summary → Slack Templates */}
            <Link
              href="/slack-templates?t=monday-summary"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Weekly Summary
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-5 flex-1 overflow-auto">
        {/* ── Stat row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Intake", value: intakeCount, sub: "awaiting review", icon: <Inbox className="w-4 h-4" />, variant: "default" },
            { label: "In Progress", value: inProgressCount, sub: "active", icon: <Clock className="w-4 h-4" />, variant: "default" },
            { label: "Overdue", value: overdueTasks.length, sub: "need attention", icon: <AlertCircle className="w-4 h-4" />, variant: overdueTasks.length > 0 ? "danger" : "default" },
            { label: "At Risk", value: atRiskTasks.length, sub: "due in ≤3 days", icon: <AlertTriangle className="w-4 h-4" />, variant: atRiskTasks.length > 0 ? "warning" : "default" },
            { label: "Capacity Flags", value: capacityRisks.length, sub: "members", icon: <TrendingUp className="w-4 h-4" />, variant: capacityRisks.length > 0 ? "warning" : "success" },
          ].map(({ label, value, sub, icon, variant }) => (
            <div key={label} className={cn(
              "bg-white border rounded-xl p-4",
              variant === "danger" ? "border-red-200 bg-red-50" :
              variant === "warning" ? "border-amber-200 bg-amber-50" :
              variant === "info" ? "border-indigo-200 bg-indigo-50" :
              variant === "success" && value === 0 ? "border-emerald-200 bg-emerald-50" :
              "border-gray-200"
            )}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <span className="text-gray-300">{icon}</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                variant === "danger" ? "text-red-700" :
                variant === "warning" ? "text-amber-700" :
                variant === "info" ? "text-indigo-700" :
                "text-gray-900"
              )}>{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
        ) : (
          <div className={cn("grid gap-5", showCapacity ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1")}>
            {/* ── Left: Needs attention ── */}
            <div className={cn("space-y-5", showCapacity ? "lg:col-span-3" : "col-span-1")}>
              {/* Needs attention — overdue / at-risk */}
              {(() => {
                // Tasks already surfaced in Missing Phases should not also appear here —
                // their "overdue" dueDate is just the end of their only phase, not the real deadline.
                const missingPhaseIds = new Set(tasksNeedingPhases.map(({ task }) => task.id));
                const coveredIds = new Set([...overdueTasks, ...atRiskTasks].map((t) => t.id));
                const todayStart = startOfDay(new Date());
                // Tasks not already flagged that have an incomplete next step due today or earlier
                const stepDueTasks = allTasks
                  .filter((t) => !["DONE", "CANCELLED"].includes(t.status))
                  .filter((t) => !missingPhaseIds.has(t.id) && !coveredIds.has(t.id))
                  .filter((t) =>
                    (t.nextSteps ?? []).some(
                      (s) => !s.isComplete && s.dueDate && isBefore(parseISO(s.dueDate), addDays(todayStart, 1))
                    )
                  );
                const attentionItems = [
                  ...overdueTasks
                    .filter((t) => !missingPhaseIds.has(t.id))
                    .map((t) => ({ task: t, badge: "OVERDUE", badgeCls: "bg-red-200 text-red-800" })),
                  ...atRiskTasks
                    .filter((t) => !overdueTasks.some((o) => o.id === t.id) && !missingPhaseIds.has(t.id))
                    .map((t) => ({ task: t, badge: "DUE SOON", badgeCls: "bg-amber-200 text-amber-800" })),
                  ...stepDueTasks
                    .map((t) => ({ task: t, badge: "STEP DUE", badgeCls: "bg-orange-200 text-orange-800" })),
                ];
                if (attentionItems.length === 0) return null;
                return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-red-900 mb-3">⚠️ Needs Attention</h2>
                  <div className="space-y-1">
                    {attentionItems.map(({ task, badge, badgeCls }) => {
                      const assignees = (task.assignments ?? []).map((a) => a.teamMember).filter(Boolean);
                      // First incomplete next step (sorted by due date, undated last)
                      const focusStep = [...(task.nextSteps ?? [])]
                        .filter((s) => !s.isComplete)
                        .sort((a, b) => {
                          if (!a.dueDate && !b.dueDate) return a.sortOrder - b.sortOrder;
                          if (!a.dueDate) return 1;
                          if (!b.dueDate) return -1;
                          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        })[0] ?? null;
                      // Current or last phase
                      const currentPhase =
                        (task.phases ?? []).find((p) => p.type === task.currentPhaseType) ??
                        [...(task.phases ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).at(-1) ??
                        null;

                      return (
                        <a
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          className="block hover:bg-red-100/60 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                        >
                          {/* Row 1: status tag + name + owners */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                              badgeCls
                            )}>
                              {badge}
                            </span>
                            <WorkTypeBadge type={task.workType} />
                            <span className="text-sm font-medium text-gray-800 flex-1 truncate min-w-0">{task.name}</span>
                            {focusStep && (focusStep as any).assignedTo ? (
                              <span className="text-xs text-gray-400 shrink-0">{(focusStep as any).assignedTo.name.split(" ")[0]}</span>
                            ) : (
                              assignees.slice(0, 2).map((m: any) => (
                                <span key={m.id} className="text-xs text-gray-400 shrink-0">{m.name.split(" ")[0]}</span>
                              ))
                            )}
                          </div>
                          {/* Row 2: specific issue */}
                          <div className="flex items-center gap-1.5 mt-0.5 pl-1 min-w-0">
                            {focusStep ? (
                              <>
                                <span className="text-[11px] text-gray-400 shrink-0">Next step →</span>
                                <span className="text-[11px] text-gray-600 truncate flex-1 min-w-0">{focusStep.description}</span>
                                {focusStep.dueDate && (
                                  <span className="text-[11px] font-semibold text-red-600 shrink-0">
                                    due {formatDate(focusStep.dueDate, "MMM d")}
                                  </span>
                                )}
                              </>
                            ) : currentPhase?.endDate ? (
                              <>
                                <span className="text-[11px] text-gray-400 shrink-0">Phase →</span>
                                <span className="text-[11px] text-gray-600 shrink-0">
                                  {PHASE_META[currentPhase.type as PhaseType]?.label ?? currentPhase.type}
                                </span>
                                <span className="text-[11px] font-semibold text-red-600 shrink-0">
                                  ends {formatDate(currentPhase.endDate, "MMM d")}
                                </span>
                              </>
                            ) : task.dueDate ? (
                              <span className="text-[11px] font-semibold text-red-600">
                                Delivery {formatDate(task.dueDate, "MMM d")}
                              </span>
                            ) : null}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
                );
              })()}

              {/* Needs attention — missing phases */}
              {tasksNeedingPhases.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-amber-900 mb-3">📋 Missing Phases</h2>
                  <div className="space-y-2">
                    {tasksNeedingPhases.map(({ task, label }) => (
                      <a key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-2 hover:opacity-80">
                        <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 shrink-0 whitespace-nowrap">
                          {label}
                        </span>
                        <WorkTypeBadge type={task.workType} />
                        <span className="text-sm text-gray-800 flex-1 truncate">{task.name}</span>
                        {(task.assignments ?? []).map((a) => a.teamMember).filter(Boolean).map((m: any) => (
                          <span key={m.id} className="text-xs text-gray-400 shrink-0">{m.name.split(" ")[0]}</span>
                        ))}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Capacity + Work type mix ── */}
            {showCapacity && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Team Capacity</h2>
                <a href="/team" className="text-xs text-indigo-600 hover:text-indigo-700">View all →</a>
              </div>

              {capacityRisks.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 mb-2">🔴 Over Capacity</p>
                  {capacityRisks.map((risk) => (
                    <div key={risk.teamMemberId} className="flex items-center gap-2 mb-1">
                      <Avatar name={risk.teamMember.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-amber-900 truncate">{risk.teamMember.name}</p>
                        <p className="text-[10px] text-amber-700">
                          {risk.utilizationPercent}% capacity used
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {memberSummaries.map((ms) => (
                  <MemberCapacityCard key={ms.member.id} check={{
                    teamMemberId: ms.member.id,
                    teamMember: ms.member,
                    weeklyCapacityUsed: ms.capacityUsed,
                    weeklyCapacityTotal: ms.capacityTotal,
                    isOverCapacity: ms.capacityUsed > ms.capacityTotal,
                    availableCapacity: Math.max(0, ms.capacityTotal - ms.capacityUsed),
                    utilizationPercent: ms.capacityTotal > 0 ? Math.round((ms.capacityUsed / ms.capacityTotal) * 100) : 0,
                  }} />
                ))}
              </div>

              {/* Work type mix */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Work Type Mix</h3>
                <div className="space-y-2.5">
                  {workTypeOrder.map((key) => {
                    const meta = workTypeMeta[key];
                    const count = workTypeBreakdown[key] ?? 0;
                    const total = Math.max(activeTasks.length, 1);
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{meta?.label ?? key}</span>
                          <span>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta?.color ?? "#9ca3af" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
