const STORAGE_KEY = "lc_user_id";

/** Identity header for the current browser session, to send alongside mutating requests. */
export function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const userId = localStorage.getItem(STORAGE_KEY);
  return userId ? { "x-user-id": userId } : {};
}
