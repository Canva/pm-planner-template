-- Task.workType is already stored as plain TEXT in SQLite regardless of the
-- Prisma-schema enum (same as the earlier phase_type_string migration) — no
-- SQL needed for that change, only the Prisma schema / TS-layer type widens.

-- WorkTypeConfig was declared in the schema but never wired to any code or
-- seeded (always 0 rows) — replacing its shape rather than migrating data.
DROP TABLE "WorkTypeConfig";

-- CreateTable
CREATE TABLE "WorkTypeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkTypeConfig_key_key" ON "WorkTypeConfig"("key");
