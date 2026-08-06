import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ subtaskId: string }> }) {
  const { subtaskId } = await params;
  try {
    const body = await req.json();
    const subtask = await prisma.generalTodoSubtask.update({
      where: { id: subtaskId },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isComplete !== undefined && { isComplete: body.isComplete }),
      },
    });
    return NextResponse.json({
      ...subtask,
      createdAt: subtask.createdAt.toISOString(),
      updatedAt: subtask.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ subtaskId: string }> }) {
  const { subtaskId } = await params;
  try {
    await prisma.generalTodoSubtask.delete({ where: { id: subtaskId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete subtask" }, { status: 500 });
  }
}
