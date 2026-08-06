import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const phases = await prisma.phaseConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(phases);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, label, color, estMin, estMax, supportsRoundTag, sortOrder, capacityHoursPerDay } = body;

  if (!key || !label || !color) {
    return NextResponse.json({ error: "key, label, and color are required" }, { status: 400 });
  }

  // Validate UPPER_SNAKE_CASE
  if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
    return NextResponse.json({ error: "key must be UPPER_SNAKE_CASE" }, { status: 400 });
  }

  // If sortOrder not provided, append at end
  let resolvedSortOrder = sortOrder;
  if (resolvedSortOrder === undefined || resolvedSortOrder === null) {
    const last = await prisma.phaseConfig.findFirst({ orderBy: { sortOrder: "desc" } });
    resolvedSortOrder = last ? last.sortOrder + 1 : 0;
  }

  const phase = await prisma.phaseConfig.create({
    data: {
      key,
      label,
      color,
      estMin: estMin ?? null,
      estMax: estMax ?? null,
      sortOrder: resolvedSortOrder,
      supportsRoundTag: supportsRoundTag ?? false,
      capacityHoursPerDay: capacityHoursPerDay ?? 4,
    },
  });

  return NextResponse.json(phase, { status: 201 });
}
