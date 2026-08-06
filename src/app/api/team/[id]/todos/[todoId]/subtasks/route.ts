import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ todoId: string }> }) {
  const { todoId } = await params;
  try {
    const body = await req.json();
    if (!body.description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    const subtask = await prisma.generalTodoSubtask.create({
      data: {
        todoId,
        description: body.description.trim(),
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json({
      ...subtask,
      createdAt: subtask.createdAt.toISOString(),
      updatedAt: subtask.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 });
  }
}
