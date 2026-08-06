import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestRole } from "@/lib/server-role";

// Create table if it doesn't exist (idempotent)
async function ensureTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "TempAssignment" (
      "id"           TEXT NOT NULL PRIMARY KEY,
      "taskId"       TEXT NOT NULL,
      "guestName"    TEXT NOT NULL,
      "startDate"    DATETIME NOT NULL,
      "dueDate"      DATETIME NOT NULL,
      "durationType" TEXT NOT NULL DEFAULT 'FULL_DAY',
      "capacityUnits" REAL NOT NULL DEFAULT 1.0,
      "notes"        TEXT,
      "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE
    )
  `;
}

export async function POST(req: NextRequest) {
  try {
    const role = await getRequestRole(req);
    if (role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await ensureTable();
    const body = await req.json();
    const { taskId, guestName, startDate, dueDate, durationType, capacityUnits } = body;
    if (!taskId || !guestName?.trim())
      return NextResponse.json({ error: "taskId and guestName required" }, { status: 400 });

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const dur = durationType ?? "FULL_DAY";
    const cap = capacityUnits ?? 1.0;

    await prisma.$executeRaw`
      INSERT INTO "TempAssignment" ("id","taskId","guestName","startDate","dueDate","durationType","capacityUnits","createdAt","updatedAt")
      VALUES (${id}, ${taskId}, ${guestName.trim()}, ${startDate}, ${dueDate}, ${dur}, ${cap}, ${now}, ${now})
    `;

    return NextResponse.json({ id, taskId, guestName: guestName.trim(), startDate, dueDate, durationType: dur, capacityUnits: cap, createdAt: now, updatedAt: now }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create temp assignment" }, { status: 500 });
  }
}
