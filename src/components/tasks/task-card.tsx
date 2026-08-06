import Link from "next/link";
import { ExternalLink, Calendar, AlertCircle, FileText, Palette, MessageSquare, Film } from "lucide-react";
import type { Task } from "@/types";
import { WorkTypeBadge, StatusBadge, EffortBadge } from "@/components/ui/badge";
import { AvatarGroup } from "@/components/ui/avatar";
import { formatDate, isOverdue, isAtRisk, cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  compact?: boolean;
}

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const overdue = isOverdue(task);
  const atRisk = isAtRisk(task);
  const done = task.status === "DONE" || task.status === "CANCELLED";
  const assignees = (task.assignments || []).map((a) => a.teamMember!).filter(Boolean);

  const links = [
    { href: task.briefLink, icon: <FileText className="w-3 h-3" />, title: "Brief" },
    { href: task.figmaLink, icon: <Palette className="w-3 h-3" />, title: "Figma" },
    { href: task.iconikLink, icon: <Film className="w-3 h-3" />, title: "Iconik" },
    { href: task.slackThreadLink, icon: <MessageSquare className="w-3 h-3" />, title: "SH Slack" },
    { href: task.internalSlackLink, icon: <MessageSquare className="w-3 h-3" />, title: "Internal Slack" },
    { href: task.mondayLink, icon: <ExternalLink className="w-3 h-3" />, title: "monday.com" },
  ].filter((l) => l.href);

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={cn(
        "block bg-white border rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all group",
        done ? "opacity-50 border-gray-100 bg-gray-50" :
        overdue ? "border-red-200" :
        atRisk ? "border-amber-200" :
        "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <WorkTypeBadge type={task.workType} />
            {overdue && !done && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertCircle className="w-3 h-3" /> Overdue
              </span>
            )}
            {atRisk && !overdue && !done && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                <AlertCircle className="w-3 h-3" /> At risk
              </span>
            )}
          </div>
          <p className={cn("text-sm font-medium truncate", done ? "text-gray-400 line-through" : "text-gray-900")}>
            {task.name}
          </p>
          {!compact && task.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
        {/* Link icons */}
        {links.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {links.slice(0, 3).map((l) => (
              <a
                key={l.title}
                href={l.href!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={l.title}
                className="text-gray-300 hover:text-indigo-500 transition-colors"
              >
                {l.icon}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <EffortBadge effort={task.effort ?? 2} />
        </div>
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <span className={cn("flex items-center gap-1 text-xs", overdue && !done ? "text-red-600" : "text-gray-400")}>
              <Calendar className="w-3 h-3" />
              {formatDate(task.dueDate, "MMM d")}
            </span>
          )}
          {assignees.length > 0 && <AvatarGroup members={assignees} />}
        </div>
      </div>
    </Link>
  );
}
