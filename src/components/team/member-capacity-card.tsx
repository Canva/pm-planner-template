import type { CapacityCheck } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { CapacityBar } from "@/components/ui/capacity-bar";
import { formatRole, cn } from "@/lib/utils";

export function MemberCapacityCard({ check }: { check: CapacityCheck }) {
  const { teamMember: member, weeklyCapacityUsed, weeklyCapacityTotal, isOverCapacity } = check;

  return (
    <div className={cn(
      "bg-white border rounded-xl p-4",
      isOverCapacity ? "border-red-200" : "border-gray-200"
    )}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={member.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
          <p className="text-xs text-gray-500">{formatRole(member.role)}</p>
        </div>
        {isOverCapacity && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            Over limit
          </span>
        )}
      </div>
      <CapacityBar
        used={weeklyCapacityUsed}
        total={weeklyCapacityTotal}
      />
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{weeklyCapacityUsed.toFixed(1)} / {weeklyCapacityTotal.toFixed(0)} days used</span>
        <span>{check.availableCapacity.toFixed(1)} days free</span>
      </div>
    </div>
  );
}
