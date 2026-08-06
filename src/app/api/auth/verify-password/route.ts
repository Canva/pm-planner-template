import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();
    if (!userId || !password) {
      return NextResponse.json({ ok: false, error: "userId and password are required" }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<{ passwordHash: string | null }[]>`
      SELECT "passwordHash" FROM "UserAccount" WHERE id = ${userId} LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { passwordHash } = rows[0];

    if (!passwordHash) {
      return NextResponse.json({ ok: false, error: "No password set" }, { status: 403 });
    }

    const match = await bcrypt.compare(password, passwordHash);
    return NextResponse.json({ ok: match });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
