import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestRole } from "@/lib/server-role";

// Fields a "USER" role account may edit on a brief — description and links only.
const USER_EDITABLE_FIELDS = new Set([
  "description", "briefLink", "figmaLink", "iconikLink",
  "slackThreadLink", "internalSlackLink", "mondayLink", "customLinks", "notes",
]);

const NEXT_STEPS_INCLUDE = {
  orderBy: { sortOrder: "asc" as const },
  include: {
    assignedTo: true,
    checklistItems: { orderBy: { sortOrder: "asc" as const } },
  },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: { include: { teamMember: true } },
        nextSteps: NEXT_STEPS_INCLUDE,
        phases: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch temp assignments via raw SQL
    let tempAssignments: unknown[] = [];
    try {
      tempAssignments = await prisma.$queryRaw`SELECT * FROM "TempAssignment" WHERE "taskId" = ${id} ORDER BY "createdAt" ASC`;
    } catch { /* table doesn't exist yet */ }

    return NextResponse.json({ ...task, tempAssignments });
  } catch (e) {
    console.error("GET /api/tasks/[id]", e);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const role = await getRequestRole(req);
    if (role === "USER") {
      for (const key of Object.keys(body)) {
        if (!USER_EDITABLE_FIELDS.has(key)) delete body[key];
      }
    }
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.effort !== undefined && { effort: body.effort }),
        ...(body.workType !== undefined && { workType: body.workType }),
        ...(body.briefLink !== undefined && { briefLink: body.briefLink }),
        ...(body.figmaLink !== undefined && { figmaLink: body.figmaLink }),
        ...(body.iconikLink !== undefined && { iconikLink: body.iconikLink }),
        ...(body.slackThreadLink !== undefined && { slackThreadLink: body.slackThreadLink }),
        ...(body.internalSlackLink !== undefined && { internalSlackLink: body.internalSlackLink }),
        ...(body.customLinks !== undefined && { customLinks: body.customLinks }),
        ...(body.mondayLink !== undefined && { mondayLink: body.mondayLink }),
        ...(body.channel !== undefined && { channel: body.channel || null }),
        ...(body.stakeholder !== undefined && { stakeholder: body.stakeholder || null }),
        ...(body.opsLead !== undefined && { opsLead: body.opsLead || null }),
        ...(body.priorityLevel !== undefined && { priorityLevel: body.priorityLevel || null }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.catNumber !== undefined && { catNumber: body.catNumber || null }),
        ...(body.urgency !== undefined && { urgency: body.urgency || null }),
        ...(body.isInIntake !== undefined && { isInIntake: body.isInIntake }),
        ...(body.currentPhaseType !== undefined && { currentPhaseType: body.currentPhaseType }),
        ...(body.hasBuild !== undefined && { hasBuild: body.hasBuild }),
        ...(body.hasLocalization !== undefined && { hasLocalization: body.hasLocalization }),
      },
      include: {
        assignments: { include: { teamMember: true } },
        nextSteps: NEXT_STEPS_INCLUDE,
        phases: { orderBy: { sortOrder: "asc" } },
      },
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error("PATCH /api/tasks/[id]", e);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/tasks/[id]", e);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
