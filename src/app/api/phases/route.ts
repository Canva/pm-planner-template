import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const phases = await prisma.phaseConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(phases);
}
