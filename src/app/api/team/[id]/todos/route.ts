import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serializeTodo(t: any) {
  return {
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    subtasks: (t.subtasks ?? []).map((s: any) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Auto-archive completed todos older than 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await prisma.generalTodo.updateMany({
      where: {
        teamMemberId: id,
        isComplete: true,
        isArchived: false,
        completedAt: { lt: twoDaysAgo },
      },
      data: { isArchived: true },
    });

    const todos = await prisma.generalTodo.findMany({
      where: { teamMemberId: id, isArchived: false },
      include: { subtasks: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
      orderBy: [{ isComplete: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(todos.map(serializeTodo));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: teamMemberId } = await params;
  try {
    const body = await req.json();
    if (!body.description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    const todo = await prisma.generalTodo.create({
      data: {
        teamMemberId,
        description: body.description.trim(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        sortOrder: body.sortOrder ?? 0,
      },
      include: { subtasks: true },
    });
    return NextResponse.json(serializeTodo(todo), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
