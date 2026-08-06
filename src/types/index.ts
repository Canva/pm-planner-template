/** Built-in roles — kept as suggestions; any custom string is also valid */
export type Role = "CREATIVE" | "CONTENT_ADMIN" | "COPYWRITER" | "MANAGER" | "PROGRAM_MANAGER" | string;
export type UserRole = "ADMIN" | "USER" | "VIEWER";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamMemberId?: string | null;
  teamMember?: TeamMember | null;
  isActive: boolean;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
}
export type WorkType = "STRATEGIC" | "TASK" | "BAU" | "MICRO";
export type TaskStatus = "INTAKE" | "IN_PROGRESS" | "REVIEW" | "BLOCKED" | "ON_HOLD" | "DONE" | "CANCELLED";
export type Effort = 1 | 2 | 3;
export type DurationType = "FULL_DAY" | "HALF_DAY" | "TWO_HOURS";
export type NotificationType =
  | "NEW_INTAKE"
  | "ASSIGNED_TO_ME"
  | "MISSING_OWNER"
  | "MISSING_DUE_DATE"
  | "CAPACITY_OVERLOAD"
  | "AT_RISK"
  | "OVERDUE";

export interface SquadMemberRef {
  squadId: string;
  teamMemberId: string;
  teamMember?: TeamMember;
}

export interface Squad {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  members: SquadMemberRef[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  weeklyCapacity: number;
  workingDays: string[];
  avatarUrl?: string | null;
  isActive: boolean;
  leaves?: Leave[];
  assignments?: Assignment[];
  createdAt: string;
  updatedAt: string;
}

export interface Leave {
  id: string;
  teamMemberId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isHalfDay: boolean;
}

export type HolidayType = "PUBLIC" | "COMPANY";

export interface Holiday {
  id: string;
  name: string;
  date: string;        // ISO date string
  endDate?: string | null;
  type: HolidayType;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  mondayItemId?: string;
  mondayBoardId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  effort: Effort;
  workType: WorkType;
  startDate?: string;
  dueDate?: string;
  deadline?: string | null;
  mondayLink?: string;
  briefLink?: string | null;
  figmaLink?: string | null;
  iconikLink?: string | null;
  slackThreadLink?: string | null;
  internalSlackLink?: string | null;
  customLinks?: { name: string; url: string }[] | null;
  mondayUpdates?: MondayUpdate[];
  notes?: string;
  catNumber?: string | null;
  channel?: string | null;
  stakeholder?: string | null;
  opsLead?: string | null;
  priorityLevel?: string | null;
  urgency?: string | null;
  isInIntake: boolean;
  currentPhaseType?: string | null;
  hasBuild?: boolean;
  hasLocalization?: boolean;
  assignments?: Assignment[];
  tempAssignments?: TempAssignment[];
  nextSteps?: NextStep[];
  phases?: TaskPhase[];
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  taskId: string;
  task?: Task;
  teamMemberId: string;
  teamMember?: TeamMember;
  phaseId?: string | null;   // JSON array of phase IDs this assignment covers, e.g. '["id1","id2"]'
  startDate: string;
  dueDate: string;
  durationDays: number;
  durationType: DurationType;
  capacityUnits: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TempAssignment {
  id: string;
  taskId: string;
  guestName: string;
  startDate: string;
  dueDate: string;
  durationType: DurationType;
  capacityUnits: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StepDurationType = "FULL_DAY" | "HALF_DAY" | "TWO_HOURS";

export interface NextStepChecklistItem {
  id: string;
  nextStepId: string;
  description: string;
  isComplete: boolean;
  sortOrder: number;
  url?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NextStep {
  id: string;
  taskId: string;
  description: string;
  startDate?: string;
  dueDate?: string;
  durationType: StepDurationType;
  assignedToId?: string | null;
  assignedTo?: TeamMember;
  isComplete: boolean;
  sortOrder: number;
  url?: string | null;
  checklistItems?: NextStepChecklistItem[];
}

export interface MondayUpdate {
  id: string;
  body: string;
  createdAt: string;
  creator: { name: string };
}

export interface CapacityCheck {
  teamMemberId: string;
  teamMember: TeamMember;
  weeklyCapacityUsed: number;
  weeklyCapacityTotal: number;
  isOverCapacity: boolean;
  availableCapacity: number;
  utilizationPercent: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  activeTasks: Task[];
  dueTasks: Task[];
  startingTasks: Task[];
  overdueTasks: Task[];
  atRiskTasks: Task[];
  memberSummaries: MemberWeeklySummary[];
  workTypeBreakdown: WorkTypeBreakdown;
  capacityRisks: CapacityCheck[];
}

export interface MemberWeeklySummary {
  member: TeamMember;
  tasks: Task[];
  capacityUsed: number;
  capacityTotal: number;
}

export interface WorkTypeBreakdown {
  STRATEGIC: number;
  TASK: number;
  BAU: number;
  MICRO: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId?: string;
  task?: Task;
  isRead: boolean;
  sentSlack: boolean;
  createdAt: string;
}

// ── Phase system ─────────────────────────────────────────────────────────────
export type PhaseType =
  | "INTAKE" | "BRIEF_REVIEW" | "KICKOFF" | "BRAINSTORM" | "CREATIVE_DEVELOPMENT"
  | "CREATIVE_REVIEW" | "SH_REVIEW" | "CREATIVE_REFINEMENT"
  | "ASSET_FINALIZATION" | "BUILD" | "LOCALIZATION";

export type PhaseStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "BLOCKED";

export interface TaskPhase {
  id: string;
  taskId: string;
  // A plain string, not PhaseType — BAU tasks can use free-text custom
  // phase names. Regular briefs still use one of the PhaseType values.
  type: string;
  status: PhaseStatus;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  roundTag?: string | null;
  sortOrder: number;
  amPm?: "AM" | "PM" | null;
  createdAt: string;
  updatedAt: string;
}

export const PHASE_ORDER: PhaseType[] = [
  "INTAKE", "BRIEF_REVIEW", "KICKOFF", "BRAINSTORM", "CREATIVE_DEVELOPMENT",
  "CREATIVE_REVIEW", "SH_REVIEW", "CREATIVE_REFINEMENT",
  "ASSET_FINALIZATION", "BUILD", "LOCALIZATION",
];

export const ROUND_TAG_PHASES: PhaseType[] = ["CREATIVE_REVIEW", "SH_REVIEW"];
export const ROUND_TAGS = ["R1", "R2", "R3"] as const;
export type RoundTag = typeof ROUND_TAGS[number];

export const PHASE_META: Record<PhaseType, {
  label: string; estMin: number | null; estMax: number | null; color: string; capacityHoursPerDay: number;
}> = {
  INTAKE:               { label: "Intake",              color: "#94a3b8", estMin: null, estMax: null, capacityHoursPerDay: 4 },
  BRIEF_REVIEW:         { label: "Brief Review",        color: "#a78bfa", estMin: 1,    estMax: 2,    capacityHoursPerDay: 0 },
  KICKOFF:              { label: "Kickoff",             color: "#8b5cf6", estMin: 1,    estMax: 1,    capacityHoursPerDay: 1 },
  BRAINSTORM:           { label: "Brainstorm",          color: "#6366f1", estMin: 2,    estMax: 2,    capacityHoursPerDay: 2 },
  CREATIVE_DEVELOPMENT: { label: "Creative Development",color: "#3b82f6", estMin: 3,    estMax: 5,    capacityHoursPerDay: 4 },
  CREATIVE_REVIEW:      { label: "Creative Review",     color: "#0ea5e9", estMin: 1,    estMax: 2,    capacityHoursPerDay: 0 },
  SH_REVIEW:            { label: "SH Review",           color: "#f59e0b", estMin: 1,    estMax: 2,    capacityHoursPerDay: 0 },
  CREATIVE_REFINEMENT:  { label: "Creative Refinement", color: "#f97316", estMin: 3,    estMax: 3,    capacityHoursPerDay: 4 },
  ASSET_FINALIZATION:   { label: "Asset Finalization",  color: "#10b981", estMin: 2,    estMax: 2,    capacityHoursPerDay: 4 },
  BUILD:                { label: "Build",               color: "#14b8a6", estMin: 3,    estMax: 3,    capacityHoursPerDay: 4 },
  LOCALIZATION:         { label: "Localization",        color: "#ec4899", estMin: 3,    estMax: null, capacityHoursPerDay: 4 },
};

export const WORK_TYPE_COLORS: Record<WorkType, string> = {
  STRATEGIC: "#6366f1",
  TASK: "#f59e0b",
  BAU: "#10b981",
  MICRO: "#06b6d4",
};

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  STRATEGIC: "Strategic",
  TASK: "Task",
  BAU: "BAU",
  MICRO: "Micro",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  INTAKE: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  REVIEW: "#f59e0b",
  BLOCKED: "#ef4444",
  ON_HOLD: "#a78bfa",
  DONE: "#10b981",
  CANCELLED: "#6b7280",
};

export const EFFORT_COLORS: Record<number, string> = {
  1: "#10b981",
  2: "#f59e0b",
  3: "#ef4444",
};

export const EFFORT_LABELS: Record<number, string> = {
  1: "E1 · Light",
  2: "E2 · Medium",
  3: "E3 · Heavy",
};

// legacy — kept for any imports that still reference it
export const PRIORITY_COLORS: Record<string, string> = {};

export const ROLE_LABELS: Record<Role, string> = {
  CREATIVE: "Creative",
  CONTENT_ADMIN: "Content Admin",
  COPYWRITER: "Copywriter",
  MANAGER: "Manager",
  PROGRAM_MANAGER: "Program Manager",
};

// Roles that are permanently tied to a specific phase: whenever assigned, they
// cover (only) the phases of the mapped type on a brief, regardless of any
// manual phase selection. (Distinct from PM/ACD, who cover every phase.)
export const ROLE_LOCKED_PHASE: Record<string, PhaseType> = {
  Localisation: "LOCALIZATION",
  CONTENT_ADMIN: "BUILD",
};

/** The phase type a role is locked to, if any (e.g. Localisation → LOCALIZATION). */
export function lockedPhaseForRole(role: string | null | undefined): PhaseType | null {
  if (!role) return null;
  return ROLE_LOCKED_PHASE[role] ?? null;
}

// Roles that cover EVERY non-INTAKE phase on any brief they're assigned to,
// regardless of manual phase selection (e.g. a PM or ACD who oversees the
// whole brief end to end). Rename/add role strings here to match your team —
// this is the single place that logic is defined; nothing else needs editing.
export const ALL_PHASE_ROLES: string[] = ["PROGRAM_MANAGER", "ACD"];

export function coversAllPhases(role: string | null | undefined): boolean {
  return !!role && ALL_PHASE_ROLES.includes(role);
}
