import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; todoId: string }> }) {
  const { todoId } = await params;
  try {
    const body = await req.json();
    const data: Record<string, any> = {};
    if (body.description !== undefined) data.description = body.description;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.isArchived !== undefined) data.isArchived = body.isArchived;
    if (body.url !== undefined) data.url = body.url || null;
    if (body.isComplete !== undefined) {
      data.isComplete = body.isComplete;
      // Track when the todo was completed so we can auto-archive after 2 days
      data.completedAt = body.isComplete ? new Date() : null;
    }

    const todo = await prisma.generalTodo.update({ where: { id: todoId }, data });
    return NextResponse.json({
      ...todo,
      dueDate: todo.dueDate?.toISOString() ?? null,
      completedAt: todo.completedAt?.toISOString() ?? null,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; todoId: string }> }) {
  const { todoId } = await params;
  try {
    await prisma.generalTodo.delete({ where: { id: todoId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
