import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  try {
    const body = await req.json();
    const count = await prisma.nextStep.count({ where: { taskId } });
    const step = await prisma.nextStep.create({
      data: {
        taskId,
        description: body.description,
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        durationType: body.durationType ?? "FULL_DAY",
        assignedToId: body.assignedToId ?? null,
        sortOrder: count,
      },
      include: { assignedTo: true },
    });
    return NextResponse.json({
      ...step,
      startDate: step.startDate?.toISOString() ?? null,
      dueDate: step.dueDate?.toISOString() ?? null,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (e) {
    console.error("POST next-steps", e);
    return NextResponse.json({ error: "Failed to add next step" }, { status: 500 });
  }
}
