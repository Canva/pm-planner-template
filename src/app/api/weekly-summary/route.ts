import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, isWithinInterval, isBefore, addDays, startOfDay } from "date-fns";
import { calculateMemberCapacity, buildPhaseCapacityRates } from "@/lib/capacity";
import type { Task, TeamMember, Assignment, WeeklySummary, MemberWeeklySummary, TaskPhase } from "@/types";
import { ALL_PHASE_ROLES } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekDate = searchParams.get("week") ? new Date(searchParams.get("week")!) : new Date();

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  try {
    const [rawTasks, rawMembers, rawAssignments, rawPhases, phaseConfigs] = await Promise.all([
      prisma.task.findMany({
        where: { status: { notIn: ["CANCELLED", "DONE"] } },
        include: {
          assignments: { include: { teamMember: true } },
          nextSteps: { include: { assignedTo: true } },
          phases: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.teamMember.findMany({ where: { isActive: true } }),
      prisma.assignment.findMany({
        include: { teamMember: true },
        where: { task: { status: { notIn: ["CANCELLED", "DONE"] } } },
      }),
      prisma.taskPhase.findMany({
        where: { task: { status: { notIn: ["CANCELLED", "DONE"] } } },
      }),
      prisma.phaseConfig.findMany(),
    ]);
    const phaseCapacityRates = buildPhaseCapacityRates(phaseConfigs);

    // Serialize dates
    const tasks: Task[] = rawTasks.map((t) => ({
      ...t,
      startDate: t.startDate?.toISOString(),
      dueDate: t.dueDate?.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      mondayUpdates: t.mondayUpdates as any,
      assignments: t.assignments.map((a) => ({
        ...a,
        startDate: a.startDate.toISOString(),
        dueDate: a.dueDate.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        durationType: a.durationType as Assignment["durationType"],
        teamMember: a.teamMember
          ? {
              ...a.teamMember,
              workingDays: a.teamMember.workingDays as string[],
              createdAt: a.teamMember.createdAt.toISOString(),
              updatedAt: a.teamMember.updatedAt.toISOString(),
            }
          : undefined,
      })),
      nextSteps: t.nextSteps.map((ns) => ({
        id: ns.id,
        taskId: ns.taskId,
        description: ns.description,
        durationType: (ns.durationType ?? "FULL_DAY") as import("@/types").StepDurationType,
        startDate: ns.startDate?.toISOString(),
        dueDate: ns.dueDate?.toISOString(),
        assignedToId: ns.assignedToId ?? null,
        assignedTo: (ns as any).assignedTo
          ? { ...(ns as any).assignedTo, workingDays: (ns as any).assignedTo.workingDays as string[], createdAt: (ns as any).assignedTo.createdAt.toISOString(), updatedAt: (ns as any).assignedTo.updatedAt.toISOString() }
          : undefined,
        isComplete: ns.isComplete,
        sortOrder: ns.sortOrder,
      })),
      phases: ((t as any).phases ?? []).map((p: any) => ({
        ...p,
        startDate: p.startDate?.toISOString() ?? null,
        endDate: p.endDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    })) as Task[];

    const allPhases: TaskPhase[] = rawPhases.map((p) => ({
      ...p,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      type: p.type as TaskPhase["type"],
      status: p.status as TaskPhase["status"],
      amPm: p.amPm as TaskPhase["amPm"],
    }));

    const members: TeamMember[] = rawMembers.filter((m) => !ALL_PHASE_ROLES.includes(m.role)).map((m) => ({
      ...m,
      workingDays: m.workingDays as string[],
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    const assignments: Assignment[] = rawAssignments.map((a) => ({
      ...a,
      startDate: a.startDate.toISOString(),
      dueDate: a.dueDate.toISOString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      durationType: a.durationType as Assignment["durationType"],
      teamMember: (a as any).teamMember ? {
        ...(a as any).teamMember,
        workingDays: (a as any).teamMember.workingDays as string[],
        createdAt: (a as any).teamMember.createdAt.toISOString(),
        updatedAt: (a as any).teamMember.updatedAt.toISOString(),
      } : undefined,
    }));

    // Active tasks: overlap with week
    const activeTasks = tasks.filter((t) => {
      const asgns = t.assignments || [];
      return asgns.some((a) => {
        const s = new Date(a.startDate);
        const e = new Date(a.dueDate);
        return isWithinInterval(s, { start: weekStart, end: weekEnd }) ||
          isWithinInterval(e, { start: weekStart, end: weekEnd }) ||
          (s <= weekStart && e >= weekEnd);
      });
    });

    const dueTasks = tasks.filter((t) => t.dueDate && isWithinInterval(new Date(t.dueDate), { start: weekStart, end: weekEnd }));
    const startingTasks = tasks.filter((t) => t.startDate && isWithinInterval(new Date(t.startDate), { start: weekStart, end: weekEnd }));
    const todayStart = startOfDay(new Date());
    const parseLocal = (s: string) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
    const overdueTasks = tasks.filter((t) => t.dueDate && !["DONE", "CANCELLED"].includes(t.status) && isBefore(parseLocal(t.dueDate), todayStart));
    const atRiskTasks = tasks.filter((t) => {
      if (!t.dueDate || ["DONE", "CANCELLED"].includes(t.status)) return false;
      const due = parseLocal(t.dueDate);
      return !isBefore(due, todayStart) && isBefore(due, addDays(todayStart, 3));
    });

    // Work type breakdown
    const workTypeBreakdown = { STRATEGIC: 0, TASK: 0, BAU: 0, MICRO: 0 };
    for (const t of activeTasks) workTypeBreakdown[t.workType]++;

    // Member summaries
    const memberSummaries: MemberWeeklySummary[] = members.map((member) => {
      const memberTasks = activeTasks.filter((t) => (t.assignments || []).some((a) => a.teamMemberId === member.id));
      const capacity = calculateMemberCapacity(member, assignments, weekDate, allPhases, phaseCapacityRates);
      return {
        member,
        tasks: memberTasks,
        capacityUsed: capacity.weeklyCapacityUsed,
        capacityTotal: capacity.weeklyCapacityTotal,
      };
    });

    // Capacity risks
    const capacityRisks = members
      .map((m) => calculateMemberCapacity(m, assignments, weekDate, allPhases, phaseCapacityRates))
      .filter((c) => c.isOverCapacity);

    const summary: WeeklySummary = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      activeTasks,
      dueTasks,
      startingTasks,
      overdueTasks,
      atRiskTasks,
      memberSummaries,
      workTypeBreakdown,
      capacityRisks,
    };

    return NextResponse.json(summary);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
