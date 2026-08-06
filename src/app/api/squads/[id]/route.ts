import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: { name?: string; color?: string; sortOrder?: number } = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.color !== undefined) data.color = body.color;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

    // Replace members if provided
    if (Array.isArray(body.memberIds)) {
      await prisma.squadMember.deleteMany({ where: { squadId: id } });
      await prisma.squadMember.createMany({
        data: body.memberIds.map((mid: string) => ({ squadId: id, teamMemberId: mid })),
      });
    }

    const squad = await prisma.squad.update({
      where: { id },
      data,
      include: {
        members: {
          include: { teamMember: true },
          orderBy: { teamMember: { name: "asc" } },
        },
      },
    });

    return NextResponse.json(squad);
  } catch (e) {
    console.error("PATCH /api/squads/[id] error:", e);
    return NextResponse.json({ error: "Failed to update squad" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.squad.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/squads/[id] error:", e);
    return NextResponse.json({ error: "Failed to delete squad" }, { status: 500 });
  }
}
