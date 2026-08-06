import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PHASE_ORDER } from "@/types";
import { getRequestRole } from "@/lib/server-role";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const phases = await prisma.taskPhase.findMany({
      where: { taskId: id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(phases);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch phases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const role = await getRequestRole(req);
    if (role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const type = body.type;
    if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });

    // Determine sortOrder: if this type already exists on the task, append after all
    // existing phases so duplicates (e.g. a second Creative Development) come last.
    // For first-time additions use the canonical PHASE_ORDER position.
    const existingPhases = await prisma.taskPhase.findMany({ where: { taskId: id } });
    const alreadyHasType = existingPhases.some((p) => p.type === type);
    const maxOrder = existingPhases.reduce((m, p) => Math.max(m, p.sortOrder), -1);

    let sortOrder: number;
    if (alreadyHasType) {
      // Duplicate — append after all existing phases
      sortOrder = maxOrder + 1;
    } else {
      // First time this type is added — use canonical PHASE_ORDER position
      const idx = PHASE_ORDER.indexOf(type as any);
      sortOrder = idx >= 0 ? idx : 99;
    }

    // Guarantee uniqueness: if any existing phase already occupies this sortOrder,
    // keep incrementing until we find a free slot. This prevents non-deterministic
    // ordering in the DB query when two phases share the same sortOrder value.
    const taken = new Set(existingPhases.map((p) => p.sortOrder));
    while (taken.has(sortOrder)) sortOrder++;

    const phase = await prisma.taskPhase.create({
      data: {
        taskId: id,
        type,
        status: body.status ?? "NOT_STARTED",
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        notes: body.notes ?? null,
        roundTag: body.roundTag ?? null,
        sortOrder,
      },
    });
    return NextResponse.json(phase, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to add phase" }, { status: 500 });
  }
}
