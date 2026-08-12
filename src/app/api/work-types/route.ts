import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workTypes = await prisma.workTypeConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(workTypes);
}
