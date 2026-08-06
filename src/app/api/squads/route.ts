import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const squads = await prisma.squad.findMany({
      include: {
        members: {
          include: { teamMember: true },
          orderBy: { teamMember: { name: "asc" } },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(squads);
  } catch (e) {
    console.error("GET /api/squads error:", e);
    return NextResponse.json({ error: "Failed to fetch squads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Squad name is required" }, { status: 400 });
    }

    const squad = await prisma.squad.create({
      data: {
        name: body.name.trim(),
        color: body.color ?? "#6366f1",
        members: {
          create: (body.memberIds ?? []).map((id: string) => ({ teamMemberId: id })),
        },
      },
      include: {
        members: {
          include: { teamMember: true },
        },
      },
    });

    return NextResponse.json(squad, { status: 201 });
  } catch (e) {
    console.error("POST /api/squads error:", e);
    return NextResponse.json({ error: "Failed to create squad" }, { status: 500 });
  }
}
