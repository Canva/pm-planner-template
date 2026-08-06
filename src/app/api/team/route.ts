import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch members without leaves first (Prisma client is safe for member fields)
    const members = await prisma.teamMember.findMany({ orderBy: { name: "asc" } });

    // Fetch leaves via raw SQL so isHalfDay is always included regardless of
    // whether the cached Prisma client knows about that column.
    const rawLeaves = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM "Leave" ORDER BY "startDate" ASC
    `;
    const leavesMap = new Map<string, Record<string, unknown>[]>();
    for (const lv of rawLeaves) {
      const mid = lv.teamMemberId as string;
      if (!leavesMap.has(mid)) leavesMap.set(mid, []);
      leavesMap.get(mid)!.push({
        ...lv,
        startDate: lv.startDate instanceof Date ? lv.startDate.toISOString() : String(lv.startDate),
        endDate:   lv.endDate   instanceof Date ? lv.endDate.toISOString()   : String(lv.endDate),
        createdAt: lv.createdAt instanceof Date ? lv.createdAt.toISOString() : String(lv.createdAt),
        isHalfDay: Boolean(lv.isHalfDay),
      });
    }

    const result = members.map((m) => ({ ...m, leaves: leavesMap.get(m.id) ?? [] }));
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/team error:", e);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const member = await prisma.teamMember.create({
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        weeklyCapacity: body.weeklyCapacity ?? 5.0,
        workingDays: body.workingDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"],
      },
      include: { leaves: true },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (e) {
    console.error("POST /api/team error:", e);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
