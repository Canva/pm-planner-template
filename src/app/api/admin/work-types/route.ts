import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workTypes = await prisma.workTypeConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(workTypes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, label, color, sortOrder } = body;

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
    const last = await prisma.workTypeConfig.findFirst({ orderBy: { sortOrder: "desc" } });
    resolvedSortOrder = last ? last.sortOrder + 1 : 0;
  }

  const workType = await prisma.workTypeConfig.create({
    data: { key, label, color, sortOrder: resolvedSortOrder },
  });

  return NextResponse.json(workType, { status: 201 });
}
