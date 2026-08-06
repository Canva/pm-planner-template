import { cn } from "@/lib/utils";

interface CapacityBarProps {
  used: number;   // days
  total: number;  // days
  showLabel?: boolean;
  className?: string;
}

export function CapacityBar({
  used,
  total,
  showLabel = true,
  className,
}: CapacityBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const overCapacity = used > total;

  const barColor = overCapacity
    ? "bg-red-500"
    : pct >= 80
    ? "bg-amber-400"
    : "bg-emerald-500";

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{used.toFixed(1)}/{total.toFixed(0)} days</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {overCapacity && (
        <p className="text-xs text-red-600 font-medium">Over {total.toFixed(0)}-day cap</p>
      )}
    </div>
  );
}
