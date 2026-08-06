import { cn } from "@/lib/utils";
import type { WorkType, TaskStatus } from "@/types";
import { WORK_TYPE_COLORS, STATUS_COLORS, EFFORT_COLORS, EFFORT_LABELS } from "@/types";

interface BadgeProps {
  label: string;
  color?: string;
  className?: string;
  size?: "sm" | "md";
}

export function Badge({ label, color, className, size = "sm" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
      style={color ? { backgroundColor: color + "20", color } : undefined}
    >
      {label}
    </span>
  );
}

export function WorkTypeBadge({ type }: { type: WorkType }) {
  const labels: Record<WorkType, string> = { STRATEGIC: "Strategic", TASK: "Task", BAU: "BAU", MICRO: "Micro" };
  return <Badge label={labels[type]} color={WORK_TYPE_COLORS[type]} />;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const labels: Record<TaskStatus, string> = {
    INTAKE: "Intake",
    IN_PROGRESS: "In Progress",
    REVIEW: "Review",
    BLOCKED: "Blocked",
    ON_HOLD: "On Hold",
    DONE: "Done",
    CANCELLED: "Cancelled",
  };
  return <Badge label={labels[status]} color={STATUS_COLORS[status]} />;
}

export function EffortBadge({ effort }: { effort: number }) {
  return <Badge label={EFFORT_LABELS[effort] ?? `E${effort}`} color={EFFORT_COLORS[effort]} />;
}

/** @deprecated use EffortBadge */
export function PriorityBadge({ priority }: { priority: any }) {
  // Map old priority strings to effort numbers for backward compat
  const map: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 3 };
  const effort = typeof priority === "number" ? priority : (map[priority] ?? 2);
  return <EffortBadge effort={effort} />;
}
