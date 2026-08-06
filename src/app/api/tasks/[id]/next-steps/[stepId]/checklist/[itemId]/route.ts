import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string; itemId: string }> }
) {
  const { itemId } = await params;
  try {
    const body = await req.json();
    const item = await prisma.nextStepChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isComplete !== undefined && { isComplete: body.isComplete }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      },
    });
    return NextResponse.json({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error("PATCH checklist item", e);
    return NextResponse.json({ error: "Failed to update checklist item" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string; itemId: string }> }
) {
  const { itemId } = await params;
  try {
    await prisma.nextStepChecklistItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE checklist item", e);
    return NextResponse.json({ error: "Failed to delete checklist item" }, { status: 500 });
  }
}
