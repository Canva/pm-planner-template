import { getInitials, cn } from "@/lib/utils";

const COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Render a neutral grey circle instead of a name-derived color. */
  gray?: boolean;
}

export function Avatar({ name, avatarUrl, size = "md", className, gray }: AvatarProps) {
  const colorIndex = name.charCodeAt(0) % COLORS.length;
  const tone = gray ? "bg-gray-100 text-gray-600" : COLORS[colorIndex];
  const sizeClasses = { sm: "w-6 h-6 text-xs", md: "w-8 h-8 text-sm", lg: "w-10 h-10 text-base" };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold", sizeClasses[size], tone, className)}>
      {getInitials(name)}
    </div>
  );
}

export function AvatarGroup({ members, max = 3 }: { members: Array<{ name: string; avatarUrl?: string | null }>; max?: number }) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((m) => (
        <Avatar key={m.name} name={m.name} avatarUrl={m.avatarUrl} size="sm" className="ring-2 ring-white" />
      ))}
      {overflow > 0 && (
        <div className="w-6 h-6 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs text-gray-600 font-medium">
          +{overflow}
        </div>
      )}
    </div>
  );
}
