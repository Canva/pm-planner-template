import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  try {
    // If steps are provided, replace them entirely
    if (body.steps !== undefined) {
      await prisma.automationStep.deleteMany({ where: { automationId: id } });
      await prisma.automation.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.triggerType !== undefined && { triggerType: body.triggerType }),
          ...(body.triggerValue !== undefined && { triggerValue: body.triggerValue }),
          steps: {
            create: (body.steps ?? []).map((s: any, i: number) => ({
              description: s.description,
              durationType: s.durationType ?? "FULL_DAY",
              assignedToId: s.assignedToId ?? null,
              sortOrder: i,
              subtasks: {
                create: (s.subtasks ?? []).map((sub: any, j: number) => ({
                  description: sub.description,
                  sortOrder: j,
                })),
              },
            })),
          },
        },
      });
    } else {
      await prisma.automation.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.triggerType !== undefined && { triggerType: body.triggerType }),
          ...(body.triggerValue !== undefined && { triggerValue: body.triggerValue }),
        },
      });
    }
    const updated = await prisma.automation.findUnique({
      where: { id },
      include: { steps: { orderBy: { sortOrder: "asc" }, include: { subtasks: { orderBy: { sortOrder: "asc" } } } } },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH automation", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.automation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
