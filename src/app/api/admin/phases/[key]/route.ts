import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const body = await req.json();
  const { label, color, estMin, estMax, supportsRoundTag, sortOrder, capacityHoursPerDay, newKey } = body;

  const existing = await prisma.phaseConfig.findUnique({ where: { key } });
  if (!existing) {
    return NextResponse.json({ error: "Phase not found" }, { status: 404 });
  }

  if (newKey !== undefined) {
    // Key rename: update PhaseConfig + all TaskPhase + all Task.currentPhaseType
    if (!/^[A-Z][A-Z0-9_]*$/.test(newKey)) {
      return NextResponse.json({ error: "newKey must be UPPER_SNAKE_CASE" }, { status: 400 });
    }

    // Update TaskPhase rows
    const taskPhaseResult = await prisma.$executeRaw`
      UPDATE "TaskPhase" SET "type" = ${newKey} WHERE "type" = ${key}
    `;
    // Update Task.currentPhaseType rows
    await prisma.$executeRaw`
      UPDATE "Task" SET "currentPhaseType" = ${newKey} WHERE "currentPhaseType" = ${key}
    `;
    // Update the PhaseConfig record
    const updated = await prisma.phaseConfig.update({
      where: { key },
      data: {
        key: newKey,
        ...(label !== undefined && { label }),
        ...(color !== undefined && { color }),
        ...(estMin !== undefined && { estMin: estMin === null ? null : Number(estMin) }),
        ...(estMax !== undefined && { estMax: estMax === null ? null : Number(estMax) }),
        ...(supportsRoundTag !== undefined && { supportsRoundTag }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(capacityHoursPerDay !== undefined && { capacityHoursPerDay: Number(capacityHoursPerDay) }),
      },
    });

    return NextResponse.json({ ok: true, migratedCount: taskPhaseResult, phase: updated });
  }

  // Regular update (no key rename)
  const updated = await prisma.phaseConfig.update({
    where: { key },
    data: {
      ...(label !== undefined && { label }),
      ...(color !== undefined && { color }),
      ...(estMin !== undefined && { estMin: estMin === null ? null : Number(estMin) }),
      ...(estMax !== undefined && { estMax: estMax === null ? null : Number(estMax) }),
      ...(supportsRoundTag !== undefined && { supportsRoundTag }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(capacityHoursPerDay !== undefined && { capacityHoursPerDay: Number(capacityHoursPerDay) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const existing = await prisma.phaseConfig.findUnique({ where: { key } });
  if (!existing) {
    return NextResponse.json({ error: "Phase not found" }, { status: 404 });
  }

  // Check if any TaskPhase records use this key
  const count = await prisma.taskPhase.count({ where: { type: key as any } });
  if (count > 0) {
    return NextResponse.json({ error: "Phase is in use", count }, { status: 409 });
  }

  await prisma.phaseConfig.delete({ where: { key } });
  return NextResponse.json({ ok: true });
}
