import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const { stepId } = await params;
  try {
    const body = await req.json();
    if (!body.description?.trim()) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }
    // Set sortOrder to max + 1
    const agg = await prisma.nextStepChecklistItem.aggregate({
      where: { nextStepId: stepId },
      _max: { sortOrder: true },
    });
    const sortOrder = (agg._max.sortOrder ?? -1) + 1;
    const item = await prisma.nextStepChecklistItem.create({
      data: {
        nextStepId: stepId,
        description: body.description.trim(),
        sortOrder,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });
    return NextResponse.json({
      ...item,
      dueDate: item.dueDate?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error("POST checklist item", e);
    return NextResponse.json({ error: "Failed to create checklist item" }, { status: 500 });
  }
}
