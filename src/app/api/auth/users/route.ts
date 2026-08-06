import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Ensure the passwordHash column exists (idempotent — fails silently if already added)
async function ensurePasswordHashColumn() {
  try {
    await prisma.$executeRaw`ALTER TABLE "UserAccount" ADD COLUMN "passwordHash" TEXT`;
  } catch {
    // Column already exists — ignore
  }
}

export async function GET() {
  try {
    await ensurePasswordHashColumn();

    const rows = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        email: string;
        role: string;
        teamMemberId: string | null;
        isActive: boolean;
        passwordHash: string | null;
        createdAt: Date;
        updatedAt: Date;
      }[]
    >`SELECT id, name, email, role, "teamMemberId", "isActive", "passwordHash", "createdAt", "updatedAt" FROM "UserAccount" ORDER BY "createdAt" ASC`;

    // Fetch linked teamMembers separately and join in JS
    const teamMemberIds = rows
      .map((r) => r.teamMemberId)
      .filter((id): id is string => id !== null);

    let teamMembersMap: Record<string, { id: string; name: string; email: string }> = {};
    if (teamMemberIds.length > 0) {
      const allMembers = await prisma.$queryRaw<{ id: string; name: string; email: string }[]>`
        SELECT id, name, email FROM "TeamMember"
      `;
      for (const m of allMembers) {
        if (teamMemberIds.includes(m.id)) teamMembersMap[m.id] = m;
      }
    }

    const users = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      teamMemberId: row.teamMemberId,
      teamMember: row.teamMemberId ? (teamMembersMap[row.teamMemberId] ?? null) : null,
      isActive: row.isActive,
      hasPassword: Boolean(row.passwordHash),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json(users);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!body.email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    const user = await prisma.userAccount.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        role: body.role ?? "USER",
        teamMemberId: body.teamMemberId || null,
        isActive: body.isActive !== false,
      },
      include: { teamMember: true },
    });
    return NextResponse.json({ ...user, hasPassword: false }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, plainPassword, passwordHash, name, email, role, teamMemberId, isActive } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Handle password update — hash server-side
    if (plainPassword !== undefined) {
      const hashed = bcrypt.hashSync(plainPassword, 10);
      await prisma.$executeRaw`UPDATE "UserAccount" SET "passwordHash" = ${hashed} WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    // Legacy: accept pre-hashed password too
    if (passwordHash !== undefined) {
      await prisma.$executeRaw`UPDATE "UserAccount" SET "passwordHash" = ${passwordHash} WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    // Standard field updates via raw SQL to stay consistent with the stale Prisma client
    const updates: string[] = [];
    if (name !== undefined) updates.push(`name = '${String(name).trim().replace(/'/g, "''")}'`);
    if (email !== undefined) updates.push(`email = '${String(email).trim().toLowerCase().replace(/'/g, "''")}'`);
    if (role !== undefined) updates.push(`role = '${String(role).replace(/'/g, "''")}'`);
    if (teamMemberId !== undefined) updates.push(`"teamMemberId" = ${teamMemberId ? `'${String(teamMemberId).replace(/'/g, "''")}'` : "NULL"}`);
    if (isActive !== undefined) updates.push(`"isActive" = ${isActive ? "TRUE" : "FALSE"}`);

    if (updates.length > 0) {
      // Use prisma.userAccount.update for non-password fields (standard fields are fine)
      await prisma.userAccount.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: String(name).trim() }),
          ...(email !== undefined && { email: String(email).trim().toLowerCase() }),
          ...(role !== undefined && { role }),
          ...(teamMemberId !== undefined && { teamMemberId: teamMemberId || null }),
          ...(isActive !== undefined && { isActive }),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.userAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
