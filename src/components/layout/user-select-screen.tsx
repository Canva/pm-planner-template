"use client";

import { useState } from "react";
import type { UserAccount } from "@/types";
import { useAppTitle } from "@/lib/use-app-title";

function roleBadgeClasses(role: UserAccount["role"]) {
  if (role === "ADMIN") return "bg-indigo-100 text-indigo-700";
  if (role === "USER") return "bg-emerald-100 text-emerald-700";
  return "bg-gray-100 text-gray-600";
}

function roleLabel(role: UserAccount["role"]) {
  if (role === "ADMIN") return "Admin";
  if (role === "USER") return "User";
  return "Viewer";
}

interface CardState {
  showPassword: boolean;
  password: string;
  error: string | null;
  verifying: boolean;
}

const DEFAULT_CARD: CardState = {
  showPassword: false,
  password: "",
  error: null,
  verifying: false,
};

interface Props {
  allUsers: UserAccount[];
  switchUser: (userId: string) => void;
}

export function UserSelectScreen({ allUsers, switchUser }: Props) {
  const activeUsers = allUsers.filter((u) => u.isActive);
  const appTitle = useAppTitle();

  // Per-card UI state keyed by user id
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  function getCardState(id: string): CardState {
    return cardStates[id] ?? DEFAULT_CARD;
  }

  function updateCardState(id: string, patch: Partial<CardState>) {
    setCardStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? DEFAULT_CARD), ...patch },
    }));
  }

  function handleCardClick(u: UserAccount) {
    if (!u.hasPassword) {
      // No password set — log straight in so admin can reach settings to set passwords
      switchUser(u.id);
      return;
    }
    updateCardState(u.id, { showPassword: true, password: "", error: null });
  }

  async function handleSubmitPassword(u: UserAccount) {
    const state = getCardState(u.id);
    if (!state.password) return;

    updateCardState(u.id, { verifying: true, error: null });
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, password: state.password }),
      });
      const data = await res.json();
      if (data.ok) {
        switchUser(u.id);
      } else {
        updateCardState(u.id, { verifying: false, error: "Incorrect password" });
      }
    } catch {
      updateCardState(u.id, { verifying: false, error: "An error occurred. Please try again." });
    }
  }

  function handleCancelPassword(id: string) {
    updateCardState(id, { showPassword: false, password: "", error: null, verifying: false });
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      {/* Logo / heading */}
      <div className="text-center mb-10">
        <p className="text-4xl font-bold text-indigo-600 uppercase tracking-tight leading-none">{appTitle}</p>
        <p className="mt-4 text-sm text-gray-500">Select your account to continue</p>
      </div>

      {activeUsers.length === 0 && (
        <p className="text-sm text-gray-400">No accounts found. Ask your admin to add users.</p>
      )}

      {/* User cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-2xl">
        {activeUsers.map((u) => {
          const state = getCardState(u.id);

          return (
            <div
              key={u.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${roleBadgeClasses(u.role)}`}
                >
                  {u.name[0]}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400">{roleLabel(u.role)}</p>
                </div>
              </div>

              {/* Select / password button */}
              {!state.showPassword && (
                <button
                  onClick={() => handleCardClick(u)}
                  className="w-full mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                >
                  Select
                </button>
              )}

              {/* Password input */}
              {u.hasPassword && state.showPassword && (
                <div className="flex flex-col gap-2">
                  {state.error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                      {state.error}
                    </p>
                  )}
                  <input
                    type="password"
                    placeholder="Password"
                    value={state.password}
                    onChange={(e) => updateCardState(u.id, { password: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitPassword(u);
                      if (e.key === "Escape") handleCancelPassword(u.id);
                    }}
                    autoFocus
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancelPassword(u.id)}
                      className="flex-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitPassword(u)}
                      disabled={state.verifying || !state.password}
                      className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {state.verifying ? "Checking…" : "Enter"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
