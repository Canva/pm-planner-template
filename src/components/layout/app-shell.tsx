"use client";

import { useState, useEffect } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Sidebar } from "./sidebar";
import { UserSelectScreen } from "./user-select-screen";
import { useCurrentUser } from "@/lib/use-current-user";
import { PhasesProvider } from "@/lib/phases-context";
import { WorkTypesProvider } from "@/lib/work-types-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading, allUsers, switchUser } = useCurrentUser();

  // Restore preference after mount so SSR and client match on first render
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lc_sidebar_open");
      if (saved !== null) setSidebarOpen(saved === "true");
    } catch {}
  }, []);

  function toggle() {
    setSidebarOpen((v) => {
      const next = !v;
      try { localStorage.setItem("lc_sidebar_open", String(next)); } catch {}
      return next;
    });
  }

  // While fetching, render nothing to avoid a flash of either screen
  if (loading) return null;

  // No user selected — show the full-screen account selector
  if (!user) return <UserSelectScreen allUsers={allUsers} switchUser={switchUser} />;

  return (
    <PhasesProvider>
    <WorkTypesProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — animated slide */}
        <div
          className={`shrink-0 transition-all duration-200 ease-in-out overflow-hidden ${
            sidebarOpen ? "w-56" : "w-0"
          }`}
        >
          <Sidebar onCollapse={toggle} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0 relative">
          {/* Reveal tab when sidebar is hidden */}
          {!sidebarOpen && (
            <button
              onClick={toggle}
              title="Show sidebar"
              className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 border-l-0 rounded-r-lg px-1 py-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          {children}
        </main>
      </div>
    </WorkTypesProvider>
    </PhasesProvider>
  );
}
