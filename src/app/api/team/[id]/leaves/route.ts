import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tiny CUID-style ID that doesn't need an external package.
function makeId() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Normalise a raw SQLite row so dates are ISO strings and isHalfDay is boolean.
function normaliseRow(row: Record<string, unknown>) {
  return {
    ...row,
    startDate: row.startDate instanceof Date
      ? row.startDate.toISOString()
      : String(row.startDate),
    endDate: row.endDate instanceof Date
      ? row.endDate.toISOString()
      : String(row.endDate),
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt),
    // SQLite stores booleans as 0/1
    isHalfDay: Boolean(row.isHalfDay),
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const leaves = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM "Leave" WHERE "teamMemberId" = ${id} ORDER BY "startDate" ASC
    `;
    return NextResponse.json(leaves.map(normaliseRow));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: teamMemberId } = await params;
  try {
    const body = await req.json();
    const id = makeId();
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const reason: string | null = body.reason || null;
    const isHalfDay = body.isHalfDay ? 1 : 0;
    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "Leave" (id, "teamMemberId", "startDate", "endDate", reason, "isHalfDay", "createdAt")
      VALUES (${id}, ${teamMemberId}, ${startDate}, ${endDate}, ${reason}, ${isHalfDay}, ${now})
    `;

    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM "Leave" WHERE id = ${id}
    `;
    return NextResponse.json(normaliseRow(rows[0]), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create leave" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  try {
    const { leaveId, startDate, endDate, reason, isHalfDay } = await req.json();
    if (!leaveId) return NextResponse.json({ error: "leaveId is required" }, { status: 400 });

    if (startDate)            await prisma.$executeRaw`UPDATE "Leave" SET "startDate" = ${new Date(startDate)} WHERE id = ${leaveId}`;
    if (endDate)              await prisma.$executeRaw`UPDATE "Leave" SET "endDate"   = ${new Date(endDate)}   WHERE id = ${leaveId}`;
    if (reason !== undefined) await prisma.$executeRaw`UPDATE "Leave" SET reason      = ${reason || null}      WHERE id = ${leaveId}`;
    if (isHalfDay !== undefined) await prisma.$executeRaw`UPDATE "Leave" SET "isHalfDay" = ${isHalfDay ? 1 : 0} WHERE id = ${leaveId}`;

    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM "Leave" WHERE id = ${leaveId}
    `;
    return NextResponse.json(normaliseRow(rows[0]));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update leave" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  try {
    const { leaveId } = await req.json();
    await prisma.$executeRaw`DELETE FROM "Leave" WHERE id = ${leaveId}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete leave" }, { status: 500 });
  }
}
