import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const automations = await prisma.automation.findMany({
      include: { steps: { orderBy: { sortOrder: "asc" }, include: { subtasks: { orderBy: { sortOrder: "asc" } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(automations);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const automation = await prisma.automation.create({
      data: {
        name: body.name,
        triggerType: body.triggerType,
        triggerValue: body.triggerValue ?? null,
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
      include: { steps: { orderBy: { sortOrder: "asc" }, include: { subtasks: { orderBy: { sortOrder: "asc" } } } } },
    });
    return NextResponse.json(automation, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
  }
}
