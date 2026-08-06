import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

/**
 * Resolves the calling user's role from the `x-user-id` header sent by the
 * client (see `src/lib/api-fetch.ts`). No identity header (or an unknown id)
 * defaults to "ADMIN" — this app has no real session layer, so that default
 * preserves the pre-existing unrestricted behavior for every caller except
 * ones that explicitly identify as a "USER" role account.
 */
export async function getRequestRole(req: NextRequest): Promise<UserRole> {
  const userId = req.headers.get("x-user-id");
  if (!userId) return "ADMIN";
  const account = await prisma.userAccount.findUnique({ where: { id: userId } });
  return account?.role ?? "ADMIN";
}
