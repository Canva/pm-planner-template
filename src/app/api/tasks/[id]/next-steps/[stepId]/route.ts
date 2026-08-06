import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const { stepId } = await params;
  try {
    const body = await req.json();
    const step = await prisma.nextStep.update({
      where: { id: stepId },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isComplete !== undefined && { isComplete: body.isComplete }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.durationType !== undefined && { durationType: body.durationType }),
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
        ...(body.url !== undefined && { url: body.url }),
      },
      include: { assignedTo: true },
    });
    return NextResponse.json({
      ...step,
      startDate: step.startDate?.toISOString() ?? null,
      dueDate: step.dueDate?.toISOString() ?? null,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error("PATCH next-step", e);
    return NextResponse.json({ error: "Failed to update next step" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const { stepId } = await params;
  try {
    await prisma.nextStep.delete({ where: { id: stepId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE next-step", e);
    return NextResponse.json({ error: "Failed to delete next step" }, { status: 500 });
  }
}
