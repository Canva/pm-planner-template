"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  LayoutGrid,
  Users,
  Settings,
  Bell,
  MessageSquare,
  FileText,
  Zap,
  Moon,
  Sun,
  ClipboardList,
  ChevronDown,
  UserCircle,
  PanelLeftClose,
  X,
  LogOut,
  Layers,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";
import { useCurrentUser } from "@/lib/use-current-user";
import { useAppTitle } from "@/lib/use-app-title";
import { useState } from "react";
import type { UserRole } from "@/types";

// Which nav items are visible per role
// ADMIN sees everything including the Admin section
// VIEWER and USER see all regular pages (USER additionally gets edit rights
// on a brief's description/links, enforced on the brief detail page itself)
const NAV_ITEMS: { href: string; label: string; icon: any; minRole: UserRole }[] = [
  { href: "/",                label: "Dashboard & Summary", icon: LayoutDashboard, minRole: "VIEWER" },
  { href: "/intake",          label: "Queue",               icon: Inbox,           minRole: "VIEWER" },
  { href: "/views",           label: "Calendar",            icon: LayoutGrid,      minRole: "VIEWER" },
  { href: "/my-work",         label: "My Work",             icon: ClipboardList,   minRole: "VIEWER" },
  { href: "/team",            label: "Team Capacity",       icon: Users,           minRole: "VIEWER" },
  { href: "/notifications",   label: "Notifications",       icon: Bell,            minRole: "VIEWER" },
  { href: "/slack-templates", label: "Slack Messages",      icon: MessageSquare,   minRole: "VIEWER" },
];

const ADMIN_ITEMS = [
  { href: "/admin/team",            label: "Team",            icon: Users         },
  { href: "/admin/phases",          label: "Phases",          icon: Layers        },
  { href: "/admin/work-types",      label: "Brief Types",     icon: Tag           },
  { href: "/admin/slack-templates", label: "Slack Templates", icon: MessageSquare },
  { href: "/automations",           label: "Automations",     icon: Zap           },
  { href: "/admin/settings",        label: "Settings",        icon: Settings      },
];

function roleRank(r: UserRole): number {
  return r === "ADMIN" ? 2 : 1; // VIEWER and USER see the same nav; ADMIN additionally sees the Admin section
}

export function Sidebar({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const { user, allUsers, role, isAdmin, switchUser, loading } = useCurrentUser();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Password prompt state
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [noPasswordMsg, setNoPasswordMsg] = useState<string | null>(null);

  const userRank = roleRank(role as UserRole);

  const visibleNav = NAV_ITEMS.filter((item) => userRank >= roleRank(item.minRole));

  function handleUserClick(u: (typeof allUsers)[number]) {
    // Current user — no prompt needed (can't lock yourself out)
    if (user?.id === u.id) {
      setSwitcherOpen(false);
      return;
    }

    if (!u.hasPassword) {
      // No password set — allow direct switch
      switchUser(u.id);
      setSwitcherOpen(false);
      return;
    }

    // Password required — open prompt
    setPendingUserId(u.id);
    setPasswordInput("");
    setPasswordError(null);
  }

  async function submitPassword() {
    if (!pendingUserId || !passwordInput) return;
    setVerifying(true);
    setPasswordError(null);
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId, password: passwordInput }),
      });
      const data = await res.json();
      if (data.ok) {
        switchUser(pendingUserId);
        setPendingUserId(null);
        setSwitcherOpen(false);
      } else {
        setPasswordError("Incorrect password");
      }
    } catch {
      setPasswordError("An error occurred. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function cancelPasswordPrompt() {
    setPendingUserId(null);
    setPasswordInput("");
    setPasswordError(null);
  }

  const pendingUser = pendingUserId ? allUsers.find((u) => u.id === pendingUserId) : null;
  const appTitle = useAppTitle();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100 flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-indigo-600 uppercase tracking-tight leading-none">{appTitle}</p>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Hide sidebar"
            className="mt-0.5 p-1 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Admin section — only for ADMIN role */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Admin</p>
            </div>
            {ADMIN_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User switcher */}
      {!loading && (
        <div className="px-3 pb-2 border-t border-gray-100 pt-2 relative">
          <button
            onClick={() => setSwitcherOpen((v) => !v)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <UserCircle className="w-4 h-4 shrink-0 text-indigo-500" />
            <span className="flex-1 text-left truncate text-xs">
              {user ? user.name : "Select profile"}
            </span>
            {allUsers.length > 0 && <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />}
          </button>

          {/* Role badge */}
          {user && (
            <p className="px-3 text-[10px] text-gray-400 -mt-1 mb-1">
              {user.role === "ADMIN" ? "Admin" : user.role === "USER" ? "User" : "Viewer"}
            </p>
          )}

          {/* No-password notice */}
          {noPasswordMsg && (
            <p className="mx-3 mb-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 leading-snug">
              {noPasswordMsg}
            </p>
          )}

          {/* Switcher dropdown */}
          {switcherOpen && allUsers.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Switch profile</p>
              </div>

              {/* Password prompt (shown inside the dropdown) */}
              {pendingUserId && pendingUser ? (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">Enter password for {pendingUser.name}</p>
                  {passwordError && (
                    <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{passwordError}</p>
                  )}
                  <input
                    type="password"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitPassword(); if (e.key === "Escape") cancelPasswordPrompt(); }}
                    autoFocus
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={cancelPasswordPrompt}
                      className="flex-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitPassword}
                      disabled={verifying || !passwordInput}
                      className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {verifying ? "Checking…" : "Switch"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {allUsers.filter((u) => u.isActive).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserClick(u)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 transition-colors",
                          user?.id === u.id && "bg-indigo-50 text-indigo-700"
                        )}
                      >
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          u.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" :
                          u.role === "USER"  ? "bg-emerald-100 text-emerald-700" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {u.name[0]}
                        </span>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-400">{u.role === "ADMIN" ? "Admin" : u.role === "USER" ? "User" : "Viewer"}</p>
                        </div>
                        {user?.id === u.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                  {/* Sign out */}
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={() => {
                        try { localStorage.removeItem("lc_user_id"); } catch {}
                        window.location.reload();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-medium">Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dark mode toggle */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={toggle}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}
