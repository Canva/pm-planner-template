import { defineConfig } from "prisma/config";

// Local dev: SQLite file at prisma/dev.db
// For production: set DATABASE_URL in the environment and update this url + the adapter in src/lib/prisma.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
