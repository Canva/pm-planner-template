import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Local dev uses SQLite via libsql (file:./prisma/dev.db).
// For production with PostgreSQL, swap to @prisma/adapter-pg and update the schema provider.

declare global {
  // eslint-disable-next-line no-var
  var _prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");

  const adapter = new PrismaLibSql({ url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalThis._prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis._prismaClient = prisma;
}
