import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestRole } from "@/lib/server-role";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const role = await getRequestRole(req);
    if (role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();

    if (body.phaseId !== undefined) {
      await prisma.$executeRaw`UPDATE "Assignment" SET "phaseId" = ${body.phaseId ?? null} WHERE id = ${id}`;
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
        ...(body.durationType !== undefined && { durationType: body.durationType }),
        ...(body.durationDays !== undefined && { durationDays: body.durationDays }),
        ...(body.capacityUnits !== undefined && { capacityUnits: body.capacityUnits }),
      },
      include: { teamMember: true },
    });
    return NextResponse.json({
      ...assignment,
      startDate: assignment.startDate.toISOString(),
      dueDate: assignment.dueDate.toISOString(),
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const role = await getRequestRole(req);
    if (role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
