import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateTeamCapacity, buildPhaseCapacityRates } from "@/lib/capacity";
import type { TeamMember, Assignment, TaskPhase } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekDate = searchParams.get("week") ? new Date(searchParams.get("week")!) : new Date();

  try {
    const [members, assignments, phases, phaseConfigs] = await Promise.all([
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

    const membersTyped: TeamMember[] = members.map((m) => ({
      ...m,
      workingDays: m.workingDays as string[],
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    const assignmentsTyped: Assignment[] = assignments.map((a) => ({
      ...a,
      startDate: a.startDate.toISOString(),
      dueDate: a.dueDate.toISOString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      durationType: a.durationType as Assignment["durationType"],
      teamMember: a.teamMember ? {
        ...a.teamMember,
        workingDays: a.teamMember.workingDays as string[],
        createdAt: a.teamMember.createdAt.toISOString(),
        updatedAt: a.teamMember.updatedAt.toISOString(),
      } : undefined,
    }));

    const phasesTyped: TaskPhase[] = phases.map((p) => ({
      ...p,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      type: p.type as TaskPhase["type"],
      status: p.status as TaskPhase["status"],
      amPm: p.amPm as TaskPhase["amPm"],
    }));

    const capacity = calculateTeamCapacity(membersTyped, assignmentsTyped, weekDate, phasesTyped, phaseCapacityRates);
    return NextResponse.json(capacity);
  } catch {
    return NextResponse.json({ error: "Failed to calculate capacity" }, { status: 500 });
  }
}
