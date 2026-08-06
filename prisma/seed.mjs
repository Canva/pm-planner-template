// First-run seed for a fresh instance — run with: node prisma/seed.mjs
//
// This does NOT seed any team members, tasks, or squads (those belong to
// whichever team owns this instance and should be added through the app).
// It only does two things:
//   1. Applies the generic phase pipeline defaults (prisma/seed-phases.sql)
//   2. Creates one ADMIN account so the first login has somewhere to go
//      (the app has no signup flow — see SETUP_GUIDE.md)
//
// Safe to re-run: phase seeding uses INSERT OR IGNORE, and the admin account
// step is skipped if any UserAccount already exists.
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
const db = createClient({ url });

async function seedPhases() {
  const raw = readFileSync(join(__dirname, "seed-phases.sql"), "utf-8");
  // Strip full-line comments first, THEN split on ";" — a naive split-then-filter
  // silently drops any statement that happens to follow a comment line in the
  // same semicolon-delimited chunk (bit us once already: it dropped the actual
  // PhaseConfig INSERT). None of these statements contain embedded semicolons.
  const withoutComments = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await db.execute(statement);
  }
  console.log(`Phase pipeline defaults applied (${statements.length} statements)`);
}

async function seedFirstAdmin() {
  const existing = await db.execute(`SELECT COUNT(*) as count FROM "UserAccount"`);
  const count = Number(existing.rows[0].count);
  if (count > 0) {
    console.log(`UserAccount already has ${count} row(s) — skipping admin bootstrap`);
    return;
  }

  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  if (!name || !email) {
    console.log("ADMIN_NAME / ADMIN_EMAIL not set — skipping admin bootstrap.");
    console.log("You can create the first account later via: scripts/setup.sh, or POST /api/auth/users");
    return;
  }

  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO "UserAccount" (id, name, email, role, "isActive", "createdAt", "updatedAt")
          VALUES (?, ?, ?, 'ADMIN', 1, ?, ?)`,
    args: [randomUUID(), name, email.toLowerCase(), now, now],
  });
  console.log(`Created first admin account: ${name} <${email}>`);
}

async function run() {
  console.log("Seeding database...");
  await seedPhases();
  await seedFirstAdmin();
  console.log("Done!");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
