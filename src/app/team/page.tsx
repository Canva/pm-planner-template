"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { MemberCapacityCard } from "@/components/team/member-capacity-card";
import { Avatar } from "@/components/ui/avatar";
import { WorkTypeBadge } from "@/components/ui/badge";
import { CapacityBar } from "@/components/ui/capacity-bar";
import { formatRole, formatDate, cn } from "@/lib/utils";
import { RefreshCw, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO, startOfWeek, endOfWeek, addWeeks, format, isThisWeek } from "date-fns";
import { usePhases } from "@/lib/phases-context";
import type { CapacityCheck, Task, PhaseType } from "@/types";
import { coversAllPhases } from "@/types";

// ── Phase-derived status ───────────────────────────────────────────────────────
const IN_PROGRESS_PHASES = ["BRIEF_REVIEW", "KICKOFF", "BRAINSTORM", "CREATIVE_DEVELOPMENT", "CREATIVE_REFINEMENT", "ASSET_FINALIZATION"];
const IN_REVIEW_PHASES   = ["CREATIVE_REVIEW", "SH_REVIEW"];
const PRODUCTION_PHASES  = ["BUILD", "LOCALIZATION"];

function phaseTypeToLabel(type: string | null | undefined): { label: string; cls: string } {
  if (!type || type === "INTAKE")          return { label: "Intake",      cls: "bg-gray-100 text-gray-600" };
  if (IN_PROGRESS_PHASES.includes(type))   return { label: "In Progress", cls: "bg-indigo-100 text-indigo-700" };
  if (IN_REVIEW_PHASES.includes(type))     return { label: "In Review",   cls: "bg-amber-100 text-amber-700" };
  if (PRODUCTION_PHASES.includes(type))    return { label: "Production",  cls: "bg-purple-100 text-purple-700" };
  return { label: "In Progress", cls: "bg-indigo-100 text-indigo-700" };
}

/**
 * Return the phase label relevant to a specific member's assignment on a task.
 * We find which phase covers that member's assignment start date — so a member
 * assigned only for Localization shows "Production", not the task's current phase.
 * Falls back to the overall task phase if no match is found.
 */
function getPhaseLabel(task: Task, memberId: string): { label: string; cls: string } {
  if (task.status === "DONE")      return { label: "Done",      cls: "bg-emerald-100 text-emerald-700" };
  if (task.status === "CANCELLED") return { label: "Cancelled", cls: "bg-gray-100 text-gray-500" };
  if (task.status === "ON_HOLD")   return { label: "On Hold",   cls: "bg-gray-100 text-gray-600" };
  if (task.status === "BLOCKED")   return { label: "Blocked",   cls: "bg-red-100 text-red-700" };

  const assignment = (task.assignments ?? []).find((a) => a.teamMemberId === memberId);
  if (assignment) {
    const aStart = parseISO(assignment.startDate);
    const aEnd   = parseISO(assignment.dueDate);
    // Find the phase whose date range contains the member's assignment start
    const sortedPhases = [...(task.phases ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const matchedPhase = sortedPhases.find((p) => {
      if (!p.startDate || !p.endDate) return false;
      const pStart = parseISO(p.startDate);
      const pEnd   = parseISO(p.endDate);
      // Phase overlaps the member's assignment period
      return aStart <= pEnd && aEnd >= pStart;
    });
    if (matchedPhase) return phaseTypeToLabel(matchedPhase.type);
  }

  // Fallback: overall task phase
  const phase =
    task.currentPhaseType ??
    [...(task.phases ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).at(-1)?.type ??
    null;
  return phaseTypeToLabel(phase);
}

/**
 * Return the actual phase name + color for a member's assignment on a task,
 * used to show phase chips in the collapsed capacity card.
 */
function getMemberPhase(
  task: Task,
  memberId: string,
  phaseMeta: Record<string, { label: string; color: string }>,
): { label: string; color: string } | null {
  if (["DONE", "CANCELLED", "ON_HOLD", "BLOCKED"].includes(task.status)) return null;

  const assignment = (task.assignments ?? []).find((a) => a.teamMemberId === memberId);
  if (assignment) {
    const aStart = parseISO(assignment.startDate);
    const aEnd   = parseISO(assignment.dueDate);
    const sortedPhases = [...(task.phases ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const matched = sortedPhases.find((p) => {
      if (!p.startDate || !p.endDate) return false;
      const pStart = parseISO(p.startDate);
      const pEnd   = parseISO(p.endDate);
      return aStart <= pEnd && aEnd >= pStart;
    });
    if (matched && matched.type !== "INTAKE") {
      const meta = phaseMeta[matched.type];
      return meta ? { label: meta.label, color: meta.color } : null;
    }
  }

  const phaseType =
    task.currentPhaseType ??
    [...(task.phases ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).at(-1)?.type ??
    null;
  if (!phaseType || phaseType === "INTAKE") return null;
  const meta = phaseMeta[phaseType];
  return meta ? { label: meta.label, color: meta.color } : null;
}

export default function TeamCapacityPage() {
  const { phaseMeta } = usePhases();
  const [capacityChecks, setCapacityChecks] = useState<CapacityCheck[]>([]);
  const [memberTasks, setMemberTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDate = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
  const weekLabel = isThisWeek(weekDate, { weekStartsOn: 1 })
    ? "This week"
    : `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`;

  useEffect(() => {
    loadData();
  }, [weekOffset]);

  async function loadData() {
    setLoading(true);
    const weekParam = weekStart.toISOString();
    const [capacityRes, tasksRes] = await Promise.all([
      fetch(`/api/capacity?week=${weekParam}`),
      fetch("/api/tasks"),
    ]);
    const [checks, tasks]: [CapacityCheck[], Task[]] = await Promise.all([
      capacityRes.json(),
      tasksRes.json(),
    ]);

    setCapacityChecks(Array.isArray(checks) ? checks : []);

    // Group tasks by member — only include tasks with phases or assignment dates in the viewed week
    const wStart = new Date(weekParam);
    const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });

    function taskActiveInWeek(t: Task): boolean {
      const phases = (t.phases ?? []).filter((p) => p.startDate && p.endDate);
      if (phases.length > 0) {
        return phases.some((p) => {
          const s = parseISO(p.startDate!); const e = parseISO(p.endDate!);
          return s <= wEnd && e >= wStart;
        });
      }
      // fallback: check assignment dates
      return (t.assignments ?? []).some((a) => {
        const s = parseISO(a.startDate); const e = parseISO(a.dueDate);
        return s <= wEnd && e >= wStart;
      });
    }

    const byMember: Record<string, Task[]> = {};
    if (Array.isArray(tasks)) {
      tasks.filter(taskActiveInWeek).forEach((t) => {
        (t.assignments || []).forEach((a) => {
          if (!byMember[a.teamMemberId]) byMember[a.teamMemberId] = [];
          if (!byMember[a.teamMemberId].find((x) => x.id === t.id)) {
            byMember[a.teamMemberId].push(t);
          }
        });
      });
    }
    setMemberTasks(byMember);
    setLoading(false);
  }

  const overCapacity = capacityChecks.filter((c) => c.isOverCapacity);

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Team Capacity" />
      <div className="p-6 space-y-4 flex-1">
        {/* Week navigation */}
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[160px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-indigo-600 hover:text-indigo-700 ml-1">
              Back to today
            </button>
          )}
        </div>

        {overCapacity.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">⚠️ Capacity warnings ({overCapacity.length})</p>
            <div className="flex flex-wrap gap-2">
              {overCapacity.map((c) => (
                <span key={c.teamMemberId} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  {c.teamMember.name}: {c.isOverCapacity ? "over capacity" : "max projects reached"}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : capacityChecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No team members yet</p>
            <a href="/admin/team" className="text-xs text-indigo-600 mt-2 hover:text-indigo-700">Add team members →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {capacityChecks.filter((check) => !coversAllPhases(check.teamMember.role)).map((check) => {
              const tasks = memberTasks[check.teamMemberId] || [];
              const isExpanded = expandedMember === check.teamMemberId;

              return (
                <div key={check.teamMemberId} className={cn(
                  "bg-white border rounded-xl overflow-hidden",
                  check.isOverCapacity ? "border-red-200" : "border-gray-200"
                )}>
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedMember(isExpanded ? null : check.teamMemberId)}
                  >
                    <Avatar name={check.teamMember.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{check.teamMember.name}</p>
                        <span className="text-xs text-gray-500">{formatRole(check.teamMember.role)}</span>
                        {check.isOverCapacity && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                            Over capacity
                          </span>
                        )}
                      </div>
                      <CapacityBar
                        used={check.weeklyCapacityUsed}
                        total={check.weeklyCapacityTotal}
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{check.utilizationPercent}%</p>
                      <p className="text-xs text-gray-400">{tasks.length} tasks</p>
                    </div>
                    <span className="text-gray-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No active tasks assigned</p>
                      ) : (
                        tasks.map((task) => {
                          // Find this member's specific assignment on this task
                          const assignment = (task.assignments ?? []).find(
                            (a) => a.teamMemberId === check.teamMemberId
                          );
                          const durLabel =
                            !assignment ? null
                            : assignment.durationType === "HALF_DAY" ? "Half day"
                            : assignment.durationType === "TWO_HOURS" ? "2 hrs"
                            : "Full day";

                          // All phases of this brief that overlap the member's assignment dates
                          const memberPhases: { label: string; color: string }[] = (() => {
                            if (!assignment) return [];
                            const aStart = parseISO(assignment.startDate);
                            const aEnd   = parseISO(assignment.dueDate);
                            return [...(task.phases ?? [])]
                              .sort((a, b) => a.sortOrder - b.sortOrder)
                              .filter((p) => {
                                if (!p.startDate || !p.endDate || p.type === "INTAKE") return false;
                                const pStart = parseISO(p.startDate);
                                const pEnd   = parseISO(p.endDate);
                                return aStart <= pEnd && aEnd >= pStart;
                              })
                              .map((p) => {
                                const meta = phaseMeta[p.type];
                                return meta ? { label: meta.label, color: meta.color } : null;
                              })
                              .filter(Boolean) as { label: string; color: string }[];
                          })();

                          // Fallback to categorized label if no dated phases matched
                          const { label: phaseLabel, cls: phaseCls } = getPhaseLabel(task, check.teamMemberId);

                          return (
                            <a
                              key={task.id}
                              href={`/tasks/${task.id}`}
                              className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg p-3 hover:border-indigo-200 transition-colors"
                            >
                              <WorkTypeBadge type={task.workType} />
                              <p className="text-sm text-gray-900 flex-1 truncate">{task.name}</p>
                              {/* Phase chips — actual phase names per assignment */}
                              {memberPhases.length > 0 ? (
                                <div className="flex flex-wrap gap-1 shrink-0">
                                  {memberPhases.map(({ label, color }) => (
                                    <span
                                      key={label}
                                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white shrink-0"
                                      style={{ backgroundColor: color }}
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", phaseCls)}>
                                  {phaseLabel}
                                </span>
                              )}
                              {/* Assignment duration */}
                              {durLabel && (
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                                  {durLabel}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="text-xs text-gray-400 shrink-0">{formatDate(task.dueDate, "MMM d")}</span>
                              )}
                            </a>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
