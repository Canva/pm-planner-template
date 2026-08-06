"use client";

import { useState, useMemo } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
import type { Task, TeamMember, DurationType, CapacityCheck, TaskPhase, Assignment, TempAssignment } from "@/types";
import { PHASE_META, lockedPhaseForRole, coversAllPhases } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { CapacityBar } from "@/components/ui/capacity-bar";
import { cn, formatRole } from "@/lib/utils";
import { parseISO, format, isWithinInterval, isSameDay } from "date-fns";

interface AssignModalProps {
  task: Task;
  members: TeamMember[];
  capacityChecks: CapacityCheck[];
  /** Full assignment objects for members already on this brief */
  existingAssignments?: Assignment[];
  phases?: TaskPhase[];
  /** External (guest) assignees already on this brief */
  tempAssignments?: TempAssignment[];
  /** Remove an external assignee by id (persists + refreshes). */
  onRemoveTemp?: (tempId: string) => Promise<void> | void;
  onClose: () => void;
  /** Called with new/updated assignments AND member IDs to remove */
  onAssign: (assignments: AssignmentInput[], removedMemberIds: string[]) => Promise<void>;
}

export interface AssignmentInput {
  teamMemberId: string;
  startDate: string;
  dueDate: string;
  durationType: DurationType;
  durationDays?: number;
  capacityUnits: number;
}

interface MemberSettings {
  durationType: DurationType;
  selectedPhaseIds: Set<string>;
}

function capacityUnitsFor(dt: DurationType) {
  return dt === "FULL_DAY" ? 1.0 : dt === "HALF_DAY" ? 0.5 : 0.25;
}

/** Determine which phase IDs overlap with an existing assignment date range */
function inferPhaseIds(assignment: Assignment, phases: TaskPhase[]): Set<string> {
  if (!phases.length) return new Set();
  const aStart = parseISO(assignment.startDate);
  const aEnd = parseISO(assignment.dueDate);
  const overlapping = phases.filter((p) => {
    if (!p.startDate || !p.endDate) return false;
    const pStart = parseISO(p.startDate);
    const pEnd = parseISO(p.endDate);
    // Overlap: not (aEnd < pStart or aStart > pEnd)
    return !(aEnd < pStart || aStart > pEnd);
  });
  // If nothing matched, default to all phases
  return new Set(overlapping.length ? overlapping.map((p) => p.id) : phases.map((p) => p.id));
}

export function AssignModal({
  task,
  members,
  capacityChecks,
  existingAssignments = [],
  phases = [],
  tempAssignments = [],
  onRemoveTemp,
  onClose,
  onAssign,
}: AssignModalProps) {
  // Chronological by start date (falls back to sortOrder when dates are
  // missing/tied) so rounds like SH Review R2 correctly appear after R1,
  // rather than in whatever order the phases happened to be added.
  const sortedPhases = useMemo(() => [...phases].sort((a, b) => {
    if (a.startDate && b.startDate) {
      const diff = parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
      if (diff !== 0) return diff;
      return a.sortOrder - b.sortOrder;
    }
    if (a.startDate) return -1;
    if (b.startDate) return 1;
    return a.sortOrder - b.sortOrder;
  }), [phases]);
  const hasPhases = sortedPhases.length > 0;

  // Fallback dates
  const fallbackStart = task.startDate?.slice(0, 10) || format(new Date(), "yyyy-MM-dd");
  const fallbackEnd = task.dueDate?.slice(0, 10) || fallbackStart;

  // Initialise from existing assignments
  const initialSelectedIds = useMemo(
    () => existingAssignments.map((a) => a.teamMemberId),
    [existingAssignments],
  );

  // Phase ids on this brief that a role is permanently locked to (e.g.
  // Localisation → the Localization phases). null when the role isn't locked or
  // the brief has no phase of that type (caller falls back to all phases).
  function lockedPhaseIdsFor(role: string | null | undefined): Set<string> | null {
    const lp = lockedPhaseForRole(role);
    if (!lp) return null;
    const ids = sortedPhases.filter((p) => p.type === lp).map((p) => p.id);
    return ids.length ? new Set(ids) : null;
  }

  const initialSettings = useMemo(() => {
    const map: Record<string, MemberSettings> = {};
    for (const a of existingAssignments) {
      const member = members.find((m) => m.id === a.teamMemberId);
      const lp = lockedPhaseForRole(member?.role);
      const lockedIds = lp ? sortedPhases.filter((p) => p.type === lp).map((p) => p.id) : [];
      // Preserve the assignment's existing coverage, and always fold in the
      // role's auto phase (e.g. Build for Content Admin).
      map[a.teamMemberId] = {
        durationType: a.durationType,
        selectedPhaseIds: new Set([...inferPhaseIds(a, sortedPhases), ...lockedIds]),
      };
    }
    return map;
  }, [existingAssignments, sortedPhases, members]);

  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [memberSettings, setMemberSettings] = useState<Record<string, MemberSettings>>(initialSettings);
  const [submitting, setSubmitting] = useState(false);

  function getSettings(memberId: string): MemberSettings {
    const member = members.find((m) => m.id === memberId);
    const allPhaseIds = new Set(sortedPhases.map((p) => p.id));
    // Locked roles default to their phase; everyone else (incl. PM/ACD) to all.
    const lockedIds = lockedPhaseIdsFor(member?.role);
    return memberSettings[memberId] ?? {
      durationType: "FULL_DAY",
      selectedPhaseIds: lockedIds ?? allPhaseIds,
    };
  }

  function updateSettings(memberId: string, patch: Partial<MemberSettings>) {
    setMemberSettings((prev) => ({
      ...prev,
      [memberId]: { ...getSettings(memberId), ...patch },
    }));
  }

  function togglePhase(memberId: string, phaseId: string) {
    const s = getSettings(memberId);
    const next = new Set(s.selectedPhaseIds);
    next.has(phaseId) ? next.delete(phaseId) : next.add(phaseId);
    updateSettings(memberId, { selectedPhaseIds: next });
  }

  function computeDates(memberId: string): { start: string; end: string } {
    const s = getSettings(memberId);
    const selectedPhases = sortedPhases.filter(
      (p) => s.selectedPhaseIds.has(p.id) && p.startDate && p.endDate,
    );
    if (!selectedPhases.length) return { start: fallbackStart, end: fallbackEnd };
    const starts = selectedPhases.map((p) => parseISO(p.startDate!));
    const ends = selectedPhases.map((p) => parseISO(p.endDate!));
    const earliest = starts.reduce((a, b) => (a < b ? a : b));
    const latest = ends.reduce((a, b) => (a > b ? a : b));
    return { start: format(earliest, "yyyy-MM-dd"), end: format(latest, "yyyy-MM-dd") };
  }

  const warnings = selected.map((memberId) => {
    const check = capacityChecks.find((c) => c.teamMemberId === memberId);
    if (!check) return null;
    const cu = capacityUnitsFor(getSettings(memberId).durationType);
    const issues: string[] = [];
    if (check.isOverCapacity) issues.push("Already at full capacity");
    if (check.availableCapacity < cu)
      issues.push(`Only ${check.availableCapacity.toFixed(1)} days available this week`);
    return issues.length > 0 ? { memberId, issues } : null;
  }).filter(Boolean);

  async function handleSubmit() {
    setSubmitting(true);

    // Members removed since the modal opened
    const removedMemberIds = initialSelectedIds.filter((id) => !selected.includes(id));

    const assignments: AssignmentInput[] = selected.map((teamMemberId) => {
      const { durationType, selectedPhaseIds } = getSettings(teamMemberId);
      const { start, end } = computeDates(teamMemberId);
      return {
        teamMemberId,
        startDate: new Date(start).toISOString(),
        dueDate: new Date(end).toISOString(),
        durationType,
        capacityUnits: capacityUnitsFor(durationType),
        phaseIds: [...selectedPhaseIds],
      };
    });

    await onAssign(assignments, removedMemberIds);
    setSubmitting(false);
    onClose();
  }

  // Counts for footer label
  const added = selected.filter((id) => !initialSelectedIds.includes(id)).length;
  const removed = initialSelectedIds.filter((id) => !selected.includes(id)).length;
  const changed = selected.filter((id) => {
    const init = initialSettings[id];
    if (!init) return false;
    const cur = getSettings(id);
    return cur.durationType !== init.durationType;
  }).length;

  function footerLabel() {
    if (submitting) return "Saving…";
    if (!selected.length) return "Select members";
    const parts: string[] = [];
    if (added) parts.push(`+${added}`);
    if (removed) parts.push(`−${removed}`);
    if (changed) parts.push(`${changed} updated`);
    if (!parts.length) return `${selected.length} assignee${selected.length !== 1 ? "s" : ""}`;
    return `Save (${parts.join(", ")})`;
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Manage Assignees</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{task.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Team members</label>
            <div className="space-y-2">
              {members.filter((m) => m.isActive).map((member) => {
                const check = capacityChecks.find((c) => c.teamMemberId === member.id);
                const isSelected = selected.includes(member.id);
                const wasExisting = initialSelectedIds.includes(member.id);
                const hasWarning = check && check.isOverCapacity;
                const settings = getSettings(member.id);

                // Badge: new / existing / removed
                const badge = isSelected && !wasExisting
                  ? { label: "Adding", color: "bg-emerald-100 text-emerald-700" }
                  : !isSelected && wasExisting
                  ? { label: "Removing", color: "bg-red-100 text-red-600" }
                  : null;

                return (
                  <div
                    key={member.id}
                    className={cn(
                      "rounded-xl border transition-colors",
                      isSelected
                        ? wasExisting
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-emerald-300 bg-emerald-50/40"
                        : wasExisting
                        ? "border-red-200 bg-red-50/30"
                        : "border-gray-200 bg-white",
                    )}
                  >
                    {/* Member row toggle */}
                    <button
                      onClick={() =>
                        setSelected((prev) =>
                          prev.includes(member.id)
                            ? prev.filter((id) => id !== member.id)
                            : [...prev, member.id],
                        )
                      }
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                          isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300",
                        )}
                      >
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <Avatar name={member.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          {badge && (
                            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", badge.color)}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{formatRole(member.role)}</p>
                        {check && (
                          <CapacityBar
                            used={check.weeklyCapacityUsed}
                            total={check.weeklyCapacityTotal}
                            showLabel={false}
                            className="mt-1"
                          />
                        )}
                      </div>
                      {hasWarning && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>

                    {/* Expanded settings when selected */}
                    {isSelected && (
                      <div className="px-3 pb-3 space-y-2.5 border-t border-indigo-100 pt-2">
                        {/* Commitment — hidden for PM/ACD */}
                        {!coversAllPhases(member.role) && (
                          <div>
                            <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wide mb-1">
                              Daily commitment
                            </p>
                            <div className="flex gap-1.5">
                              {(["FULL_DAY", "HALF_DAY", "TWO_HOURS"] as DurationType[]).map((dt) => (
                                <button
                                  key={dt}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSettings(member.id, { durationType: dt });
                                  }}
                                  className={cn(
                                    "flex-1 py-1 px-1.5 rounded-lg text-[10px] font-medium border transition-colors",
                                    settings.durationType === dt
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : "border-indigo-200 text-indigo-600 hover:bg-indigo-50",
                                  )}
                                >
                                  {dt === "FULL_DAY" ? "Full Day" : dt === "HALF_DAY" ? "Half Day" : "2 Hours"}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Phase selection — hidden only for PM/ACD (they cover all).
                            Locked roles (Localisation/Content Admin) get their phase
                            auto-included and non-removable, but can add others. */}
                        {hasPhases && !coversAllPhases(member.role) && (() => {
                          const lockedType = lockedPhaseForRole(member.role);
                          const lockedMeta = lockedType ? PHASE_META[lockedType] : null;
                          return (
                          <div>
                            <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wide mb-1">
                              Active phases
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {sortedPhases.map((phase) => {
                                const meta = PHASE_META[phase.type as keyof typeof PHASE_META];
                                const isAuto = lockedType != null && phase.type === lockedType;
                                const active = isAuto || settings.selectedPhaseIds.has(phase.id);
                                return (
                                  <button
                                    key={phase.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isAuto) return; // always included for this role
                                      togglePhase(member.id, phase.id);
                                    }}
                                    title={isAuto ? `${meta?.label ?? phase.type} is always included for ${formatRole(member.role)}` : undefined}
                                    className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                                      active
                                        ? "text-white border-transparent"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                                      isAuto && "cursor-default",
                                    )}
                                    style={active ? { backgroundColor: meta?.color ?? "#6366f1" } : undefined}
                                  >
                                    {meta?.label ?? phase.type}{isAuto ? " · auto" : ""}
                                  </button>
                                );
                              })}
                            </div>
                            {lockedMeta && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                {lockedMeta.label} is always included for this role — add other phases as needed.
                              </p>
                            )}
                            {(() => {
                              const { start, end } = computeDates(member.id);
                              return (
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Assignment: {format(parseISO(start), "MMM d")} –{" "}
                                  {format(parseISO(end), "MMM d, yyyy")}
                                </p>
                              );
                            })()}
                          </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* External assignees — remove only (added via the brief page) */}
          {tempAssignments.length > 0 && (
            <div className="border border-orange-100 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-orange-50 border-b border-orange-100">
                <span className="text-[11px] font-semibold text-orange-700 uppercase tracking-wide">External assignees</span>
              </div>
              <div className="divide-y divide-gray-100">
                {tempAssignments.map((t) => (
                  <div key={t.id} className="group flex items-center gap-2 px-3 py-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 shrink-0">EXT</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{t.guestName}</p>
                      {t.startDate && t.dueDate && (
                        <p className="text-[10px] text-gray-400">
                          {format(parseISO(t.startDate), "MMM d")} – {format(parseISO(t.dueDate), "MMM d")}
                        </p>
                      )}
                    </div>
                    {onRemoveTemp && (
                      <button
                        onClick={() => onRemoveTemp(t.id)}
                        className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove external assignee"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capacity warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">Capacity warnings</p>
                  {warnings.map((w) => {
                    const m = members.find((m) => m.id === w?.memberId);
                    return w?.issues.map((issue) => (
                      <p key={issue} className="text-xs text-amber-700">
                        {m?.name}: {issue}
                      </p>
                    ));
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 p-5 border-t border-gray-100 shrink-0">
          {/* Summary of pending changes */}
          <p className="text-xs text-gray-400">
            {removed > 0 && (
              <span className="text-red-500 font-medium">{removed} will be removed · </span>
            )}
            {selected.length} assigned
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {footerLabel()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
