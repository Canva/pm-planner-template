import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMemberCapacity } from "@/lib/capacity";
import type { DurationType } from "@/types";
import { getRequestRole } from "@/lib/server-role";

export async function POST(req: NextRequest) {
  try {
    const role = await getRequestRole(req);
    if (role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const { taskId, assignments } = body as {
      taskId: string;
      assignments: Array<{
        teamMemberId: string;
        startDate: string;
        dueDate: string;
        durationType: DurationType;
        durationDays?: number;
        capacityUnits: number;
        phaseIds?: string[];
      }>;
    };
    // Fetch existing assignments for capacity check
    const allAssignments = await prisma.assignment.findMany({
      include: { teamMember: true },
    });

    const results = [];

    for (const a of assignments) {
      const member = await prisma.teamMember.findUnique({ where: { id: a.teamMemberId } });
      if (!member) continue;

      const memberAssignments = allAssignments.map((ma) => ({
        ...ma,
        startDate: ma.startDate.toISOString(),
        dueDate: ma.dueDate.toISOString(),
        createdAt: ma.createdAt.toISOString(),
        updatedAt: ma.updatedAt.toISOString(),
      }));

      const assignment = await prisma.assignment.upsert({
        where: { taskId_teamMemberId: { taskId, teamMemberId: a.teamMemberId } },
        create: {
          taskId,
          teamMemberId: a.teamMemberId,
          startDate: new Date(a.startDate),
          dueDate: new Date(a.dueDate),
          durationType: a.durationType,
          durationDays: a.durationDays ?? 1.0,
          capacityUnits: a.capacityUnits,
        },
        update: {
          startDate: new Date(a.startDate),
          dueDate: new Date(a.dueDate),
          durationType: a.durationType,
          durationDays: a.durationDays ?? 1.0,
          capacityUnits: a.capacityUnits,
        },
        include: { teamMember: true },
      });

      // Save phaseIds as JSON string in the phaseId column
      if (a.phaseIds !== undefined) {
        const phaseIdsJson = a.phaseIds.length ? JSON.stringify(a.phaseIds) : null;
        await prisma.$executeRaw`UPDATE "Assignment" SET "phaseId" = ${phaseIdsJson} WHERE "taskId" = ${taskId} AND "teamMemberId" = ${a.teamMemberId}`;
      }

      results.push(assignment);
    }

    // Remove the task from intake after first assignment
    await prisma.task.update({
      where: { id: taskId },
      data: { isInIntake: false, status: "IN_PROGRESS" },
    });

    return NextResponse.json(results, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create assignments" }, { status: 500 });
  }
}
