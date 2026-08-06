import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: "default" | "warning" | "danger" | "success";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, variant = "default", icon }: StatCardProps) {
  const colors = {
    default: "bg-white border-gray-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
    success: "bg-emerald-50 border-emerald-200",
  };
  const valueColors = {
    default: "text-gray-900",
    warning: "text-amber-700",
    danger: "text-red-700",
    success: "text-emerald-700",
  };

  return (
    <div className={cn("rounded-xl border p-4", colors[variant])}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className={cn("text-2xl font-bold mt-2", valueColors[variant])}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
