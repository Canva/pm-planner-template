import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import type { TeamMember, Assignment, CapacityCheck, DurationType, StepDurationType, TaskPhase, PhaseType } from "@/types";
import { ALL_PHASE_ROLES } from "@/types";
import { countWorkingDays } from "@/lib/utils";

// Sentinel stored in PhaseConfig.capacityHoursPerDay meaning "don't use a
// fixed rate for this phase — use whatever duration (Full Day/Half Day/2
// Hours) was picked for the assignment in the brief's Assignee section."
export const ASSIGNEE_SELECTED = -1;

// Fallback capacity cost per phase type (in days per working day of the
// phase), used only if the caller doesn't pass admin-configured rates from
// PhaseConfig.capacityHoursPerDay. Kept in sync with the DB defaults.
const PHASE_CAPACITY_RATE: Record<PhaseType, number> = {
  KICKOFF:              0.125, // 1 hr
  BRAINSTORM:           0.25,  // 2 hrs
  SH_REVIEW:            0,     // no capacity cost
  BRIEF_REVIEW:         0,     // no capacity cost
  INTAKE:               0.5,
  CREATIVE_DEVELOPMENT: 0.5,
  CREATIVE_REVIEW:      0,     // no capacity cost
  CREATIVE_REFINEMENT:  0.5,
  ASSET_FINALIZATION:   0.5,
  BUILD:                0.5,
  LOCALIZATION:         0.5,
};

// Converts admin-configured PhaseConfig.capacityHoursPerDay (hours, assuming
// an 8-hour working day) into the days-based rate used throughout this file.
// The ASSIGNEE_SELECTED sentinel passes through unconverted.
export function buildPhaseCapacityRates(
  phaseConfigs: Array<{ key: string; capacityHoursPerDay: number }>
): Record<string, number> {
  return Object.fromEntries(
    phaseConfigs.map((p) => [
      p.key,
      p.capacityHoursPerDay === ASSIGNEE_SELECTED ? ASSIGNEE_SELECTED : p.capacityHoursPerDay / 8,
    ])
  );
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function isAssignmentActiveThisWeek(assignment: Assignment, weekDate: Date = new Date()): boolean {
  const { start, end } = getWeekRange(weekDate);
  const assignStart = parseISO(assignment.startDate);
  const assignEnd = parseISO(assignment.dueDate);
  return (
    isWithinInterval(assignStart, { start, end }) ||
    isWithinInterval(assignEnd, { start, end }) ||
    (assignStart <= start && assignEnd >= end)
  );
}

export function calculateMemberCapacity(
  member: TeamMember,
  assignments: Assignment[],
  weekDate: Date = new Date(),
  allPhases?: TaskPhase[],
  phaseCapacityRates?: Record<string, number>
): CapacityCheck {
  const rates: Record<string, number> = phaseCapacityRates ?? PHASE_CAPACITY_RATE;
  const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);

  const weekAssignments = assignments.filter(
    (a) => a.teamMemberId === member.id && isAssignmentActiveThisWeek(a, weekDate)
  );

  const capacityUsed = weekAssignments.reduce((sum, a) => {
    // If we have phase data, calculate based on which phases this assignment covers
    if (allPhases && a.phaseId) {
      let assignedPhaseIds: string[] = [];
      try { assignedPhaseIds = JSON.parse(a.phaseId); } catch { /* invalid JSON */ }

      if (assignedPhaseIds.length > 0) {
        const phaseTotal = assignedPhaseIds.reduce((phaseSum, pid) => {
          const phase = allPhases.find((p) => p.id === pid);
          if (!phase || !phase.startDate || !phase.endDate) return phaseSum;
          const pStart = parseISO(phase.startDate);
          const pEnd = parseISO(phase.endDate);
          // Only count if phase overlaps this week
          const overlaps =
            isWithinInterval(pStart, { start: weekStart, end: weekEnd }) ||
            isWithinInterval(pEnd, { start: weekStart, end: weekEnd }) ||
            (pStart <= weekStart && pEnd >= weekEnd);
          if (!overlaps) return phaseSum;
          const overlapStart = pStart < weekStart ? weekStart : pStart;
          const overlapEnd = pEnd > weekEnd ? weekEnd : pEnd;
          const workingDays = countWorkingDays(overlapStart, overlapEnd);
          const rate = rates[phase.type] ?? 0.5;
          const effectiveRate = rate === ASSIGNEE_SELECTED ? a.capacityUnits : rate;
          return phaseSum + effectiveRate * workingDays;
        }, 0);
        return sum + phaseTotal;
      }
    }

    // Fallback: if task has phases, use phases active this week (treats member as assigned to all phases)
    if (allPhases) {
      const taskPhases = allPhases.filter((p) => p.taskId === a.taskId && p.startDate && p.endDate);
      if (taskPhases.length > 0) {
        const phaseTotal = taskPhases.reduce((phaseSum, phase) => {
          const pStart = parseISO(phase.startDate!);
          const pEnd = parseISO(phase.endDate!);
          const overlaps =
            isWithinInterval(pStart, { start: weekStart, end: weekEnd }) ||
            isWithinInterval(pEnd, { start: weekStart, end: weekEnd }) ||
            (pStart <= weekStart && pEnd >= weekEnd);
          if (!overlaps) return phaseSum;
          const overlapStart = pStart < weekStart ? weekStart : pStart;
          const overlapEnd = pEnd > weekEnd ? weekEnd : pEnd;
          const workingDays = countWorkingDays(overlapStart, overlapEnd);
          const rate = rates[phase.type] ?? 0.5;
          const effectiveRate = rate === ASSIGNEE_SELECTED ? a.capacityUnits : rate;
          return phaseSum + effectiveRate * workingDays;
        }, 0);
        return sum + phaseTotal;
      }
    }

    // Last resort: capacityUnits × days overlapping this week
    const assignStart = parseISO(a.startDate);
    const assignEnd = parseISO(a.dueDate);
    const overlapStart = assignStart < weekStart ? weekStart : assignStart;
    const overlapEnd = assignEnd > weekEnd ? weekEnd : assignEnd;
    const workingDays = countWorkingDays(overlapStart, overlapEnd);
    return sum + a.capacityUnits * workingDays;
  }, 0);

  return {
    teamMemberId: member.id,
    teamMember: member,
    weeklyCapacityUsed: capacityUsed,
    weeklyCapacityTotal: member.weeklyCapacity,
    isOverCapacity: capacityUsed > member.weeklyCapacity,
    availableCapacity: Math.max(0, member.weeklyCapacity - capacityUsed),
    utilizationPercent:
      member.weeklyCapacity > 0
        ? Math.round((capacityUsed / member.weeklyCapacity) * 100)
        : 0,
  };
}

export function calculateTeamCapacity(
  members: TeamMember[],
  assignments: Assignment[],
  weekDate?: Date,
  allPhases?: TaskPhase[],
  phaseCapacityRates?: Record<string, number>
): CapacityCheck[] {
  return members
    .filter((m) => !ALL_PHASE_ROLES.includes(m.role))
    .map((m) => calculateMemberCapacity(m, assignments, weekDate, allPhases, phaseCapacityRates));
}

export function suggestAssignees(
  members: TeamMember[],
  assignments: Assignment[],
  capacityUnitsNeeded: number,
  weekDate?: Date
): Array<{ member: TeamMember; capacity: CapacityCheck; canAccept: boolean }> {
  return members
    .filter((m) => m.isActive)
    .map((member) => {
      const capacity = calculateMemberCapacity(member, assignments, weekDate);
      const canAccept = capacity.availableCapacity >= capacityUnitsNeeded;
      return { member, capacity, canAccept };
    })
    .sort((a, b) => {
      if (a.canAccept && !b.canAccept) return -1;
      if (!a.canAccept && b.canAccept) return 1;
      return b.capacity.availableCapacity - a.capacity.availableCapacity;
    });
}

/**
 * Returns the daily capacity rate in days:
 *   FULL_DAY  → 1.0 day
 *   HALF_DAY  → 0.5 days
 *   TWO_HOURS → 0.25 days
 *
 * This is stored as `capacityUnits` on Assignment and multiplied by
 * the number of working days the assignment overlaps with each week.
 */
export function getDurationCapacityUnits(
  durationType: DurationType | StepDurationType
): number {
  if (durationType === "FULL_DAY") return 1.0;
  if (durationType === "HALF_DAY") return 0.5;
  return 0.25; // TWO_HOURS
}
