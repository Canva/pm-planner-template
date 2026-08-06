import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const original = await prisma.automation.findUnique({
      where: { id },
      include: { steps: { orderBy: { sortOrder: "asc" }, include: { subtasks: { orderBy: { sortOrder: "asc" } } } } },
    });
    if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const copy = await prisma.automation.create({
      data: {
        name: `${original.name} (copy)`,
        triggerType: original.triggerType,
        triggerValue: original.triggerValue,
        isActive: false,
        steps: {
          create: original.steps.map((s) => ({
            description: s.description,
            durationType: s.durationType,
            assignedToId: s.assignedToId,
            sortOrder: s.sortOrder,
            subtasks: {
              create: s.subtasks.map((sub) => ({
                description: sub.description,
                sortOrder: sub.sortOrder,
              })),
            },
          })),
        },
      },
      include: { steps: { orderBy: { sortOrder: "asc" }, include: { subtasks: { orderBy: { sortOrder: "asc" } } } } },
    });
    return NextResponse.json(copy, { status: 201 });
  } catch (e) {
    console.error("duplicate automation", e);
    return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
