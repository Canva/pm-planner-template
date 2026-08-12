import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isProtectedWorkType } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const body = await req.json();
  const { label, color, sortOrder, newKey } = body;

  const existing = await prisma.workTypeConfig.findUnique({ where: { key } });
  if (!existing) {
    return NextResponse.json({ error: "Brief type not found" }, { status: 404 });
  }

  if (isProtectedWorkType(key)) {
    return NextResponse.json(
      { error: "This brief type is protected and cannot be changed" },
      { status: 400 }
    );
  }

  if (newKey !== undefined) {
    // Key rename: update WorkTypeConfig + all Task.workType
    if (!/^[A-Z][A-Z0-9_]*$/.test(newKey)) {
      return NextResponse.json({ error: "newKey must be UPPER_SNAKE_CASE" }, { status: 400 });
    }
    if (isProtectedWorkType(newKey)) {
      return NextResponse.json({ error: "That key is reserved" }, { status: 400 });
    }

    const taskResult = await prisma.$executeRaw`
      UPDATE "Task" SET "workType" = ${newKey} WHERE "workType" = ${key}
    `;
    const updated = await prisma.workTypeConfig.update({
      where: { key },
      data: {
        key: newKey,
        ...(label !== undefined && { label }),
        ...(color !== undefined && { color }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json({ ok: true, migratedCount: taskResult, workType: updated });
  }

  const updated = await prisma.workTypeConfig.update({
    where: { key },
    data: {
      ...(label !== undefined && { label }),
      ...(color !== undefined && { color }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const existing = await prisma.workTypeConfig.findUnique({ where: { key } });
  if (!existing) {
    return NextResponse.json({ error: "Brief type not found" }, { status: 404 });
  }

  if (isProtectedWorkType(key)) {
    return NextResponse.json(
      { error: "This brief type is protected and cannot be deleted" },
      { status: 400 }
    );
  }

  const count = await prisma.task.count({ where: { workType: key } });
  if (count > 0) {
    return NextResponse.json({ error: "Brief type is in use", count }, { status: 409 });
  }

  await prisma.workTypeConfig.delete({ where: { key } });
  return NextResponse.json({ ok: true });
}
