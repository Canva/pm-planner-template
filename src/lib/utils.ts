import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isAfter, isBefore, addDays, getDay, startOfDay } from "date-fns";
import type { Task, TaskStatus } from "@/types";
import { STATUS_COLORS, PRIORITY_COLORS } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = "MMM d, yyyy") {
  return format(new Date(date), fmt);
}

/** Parse a YYYY-MM-DD date string as local midnight (avoids UTC-shift issues). */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === "DONE" || task.status === "CANCELLED") return false;
  // Strictly before today — due TODAY is not overdue, it's at risk
  return isBefore(parseLocalDate(task.dueDate), startOfDay(new Date()));
}

export function isAtRisk(task: Task, daysThreshold = 3): boolean {
  if (!task.dueDate) return false;
  if (task.status === "DONE" || task.status === "CANCELLED") return false;
  const due = parseLocalDate(task.dueDate);
  const todayStart = startOfDay(new Date());
  const threshold = addDays(todayStart, daysThreshold);
  // Due today or within the next N days (but not already overdue)
  return !isBefore(due, todayStart) && isBefore(due, threshold);
}

export function getStatusColor(status: TaskStatus): string {
  return STATUS_COLORS[status];
}

export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? "#9ca3af";
}

// ── Working-day helpers ──────────────────────────────────────────────────────

/** Returns true for Saturday (6) or Sunday (0). */
export function isWeekendDay(date: Date): boolean {
  const d = getDay(date);
  return d === 0 || d === 6;
}

/**
 * Advance date to the next weekday if it currently falls on a weekend.
 * Does nothing if already Mon–Fri.
 */
export function nextWorkingDay(date: Date): Date {
  let d = new Date(date);
  while (isWeekendDay(d)) d = addDays(d, 1);
  return d;
}

/**
 * Add `days` working days (Mon–Fri) to `start`.
 * Skips Sat/Sun when counting.
 */
export function addWorkingDays(start: Date, days: number): Date {
  let d = new Date(start);
  let remaining = Math.max(0, Math.round(days));
  while (remaining > 0) {
    d = addDays(d, 1);
    if (!isWeekendDay(d)) remaining--;
  }
  return d;
}

/**
 * Count Mon–Fri days between start and end (inclusive).
 */
export function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  let d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(23, 59, 59, 999);
  while (d <= endNorm) {
    if (!isWeekendDay(d)) count++;
    d = addDays(d, 1);
  }
  return count;
}

export function formatRole(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length = 60): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}
