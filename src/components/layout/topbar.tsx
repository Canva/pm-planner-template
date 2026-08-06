"use client";

import { Bell, RefreshCw } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  const [syncing, setSyncing] = useState(false);

  async function syncMonday() {
    setSyncing(true);
    try {
      await fetch("/api/monday/sync", { method: "POST" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <header className="h-14 border-b border-gray-100 bg-white px-6 flex items-center justify-between shrink-0">
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-2">
        {actions}
        <button
          onClick={syncMonday}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        >
          <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
          Sync monday
        </button>
        <Link
          href="/notifications"
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
        >
          <Bell className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
