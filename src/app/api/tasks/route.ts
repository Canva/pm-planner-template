import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const workType = searchParams.get("workType");
  const isInIntake = searchParams.get("intake");

  try {
    const tasks = await prisma.task.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(workType ? { workType: workType as any } : {}),
        ...(isInIntake !== null ? { isInIntake: isInIntake === "true" } : {}),
      },
      include: {
        assignments: { include: { teamMember: true } },
        tempAssignments: true,
        nextSteps: { orderBy: { sortOrder: "asc" }, include: { assignedTo: true, checklistItems: { orderBy: { sortOrder: "asc" } } } },
        phases: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status ?? "INTAKE",
        effort: body.effort ?? 2,
        workType: body.workType ?? "TASK",
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes,
        isInIntake: body.isInIntake ?? true,
        mondayItemId: body.mondayItemId,
        mondayBoardId: body.mondayBoardId,
        mondayLink: body.mondayLink,
        deadline: body.deadline ? new Date(body.deadline) : null,
        briefLink: body.briefLink ?? null,
        figmaLink: body.figmaLink ?? null,
        iconikLink: body.iconikLink ?? null,
        slackThreadLink: body.slackThreadLink ?? null,
        internalSlackLink: body.internalSlackLink ?? null,
        customLinks: body.customLinks ?? undefined,
        channel: body.channel ?? null,
        stakeholder: body.stakeholder ?? null,
        opsLead: body.opsLead ?? null,
        priorityLevel: body.priorityLevel ?? null,
        catNumber: body.catNumber ?? null,
        urgency: body.urgency ?? null,
        hasBuild: body.hasBuild ?? false,
        hasLocalization: body.hasLocalization ?? false,
      },
      include: {
        assignments: { include: { teamMember: true } },
        nextSteps: { include: { assignedTo: true } },
      },
    });

    // Create notification for new intake task (non-fatal)
    if (task.isInIntake) {
      try {
        await prisma.notification.create({
          data: {
            type: "NEW_INTAKE",
            title: "New intake task",
            body: `"${task.name}" has been added to the intake queue`,
            taskId: task.id,
          },
        });
      } catch (notifErr) {
        console.error("Notification creation failed (non-fatal):", notifErr);
      }
    }

    // Automation steps are now applied via the frontend picker modal — not auto-applied here.

    return NextResponse.json(task, { status: 201 });
  } catch (e: any) {
    console.error("Failed to create task:", e);
    return NextResponse.json(
      { error: "Failed to create task", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
