"use client";
import { useState, useEffect, useCallback } from "react";
import type { UserAccount } from "@/types";

const STORAGE_KEY = "lc_user_id";

export function useCurrentUser() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);

  const refresh = useCallback(async () => {
    try {
      const users: UserAccount[] = await fetch("/api/auth/users").then((r) => r.json());
      if (!Array.isArray(users)) { setLoading(false); return; }
      setAllUsers(users);
      const storedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (storedId) {
        const found = users.find((u) => u.id === storedId && u.isActive);
        setUser(found ?? null);
      } else {
        // No stored user — stay null so the selection screen is shown
        setUser(null);
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function switchUser(userId: string) {
    localStorage.setItem(STORAGE_KEY, userId);
    const found = allUsers.find((u) => u.id === userId);
    setUser(found ?? null);
  }

  // If no accounts exist at all, treat the session as ADMIN
  const role = user?.role ?? (allUsers.length === 0 ? "ADMIN" : "VIEWER");
  const isAdmin = role === "ADMIN";
  const isUser = role === "USER";
  const isViewer = role === "VIEWER";

  return { user, loading, allUsers, switchUser, refresh, role, isAdmin, isUser, isViewer };
}
