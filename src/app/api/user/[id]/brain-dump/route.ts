import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Ensure the brainDumpContent column exists on UserAccount (idempotent)
async function ensureColumn() {
  try {
    await prisma.$executeRaw`ALTER TABLE "UserAccount" ADD COLUMN "brainDumpContent" TEXT`;
  } catch {
    // Already exists — ignore
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureColumn();
    const rows = await prisma.$queryRaw<{ brainDumpContent: string | null }[]>`
      SELECT "brainDumpContent" FROM "UserAccount" WHERE id = ${id}
    `;
    const content = rows[0]?.brainDumpContent ?? null;
    return NextResponse.json({ content });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ content: null });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureColumn();
    const { content } = await req.json();
    await prisma.$executeRaw`
      UPDATE "UserAccount" SET "brainDumpContent" = ${content ?? null} WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
