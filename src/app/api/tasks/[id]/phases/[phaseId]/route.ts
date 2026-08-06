import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestRole } from "@/lib/server-role";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const { phaseId } = await params;
  try {
    const role = await getRequestRole(req);
    if (role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const phase = await prisma.taskPhase.update({
      where: { id: phaseId },
      data: {
        ...(body.status    !== undefined && { status: body.status }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate   !== undefined && { endDate:   body.endDate   ? new Date(body.endDate)   : null }),
        ...(body.notes     !== undefined && { notes: body.notes }),
        ...(body.roundTag  !== undefined && { roundTag: body.roundTag }),
        ...(body.amPm      !== undefined && { amPm: body.amPm }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });
    return NextResponse.json(phase);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update phase" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const { phaseId } = await params;
  try {
    const role = await getRequestRole(req);
    if (role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.taskPhase.delete({ where: { id: phaseId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete phase" }, { status: 500 });
  }
}
