"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { AssignModal } from "@/components/tasks/assign-modal";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { WorkTypeBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Inbox, Plus, RefreshCw, Trash2, X, ChevronDown, ChevronRight,
  Filter, Download, Pencil, ExternalLink, List, LayoutGrid,
} from "lucide-react";
import { isBefore, isAfter } from "date-fns";
import { formatDate, cn } from "@/lib/utils";
import { todayPH, phCalendarDate } from "@/lib/tz";
import { usePhases } from "@/lib/phases-context";
import { useWorkTypes } from "@/lib/work-types-context";
import type { Task, TeamMember, CapacityCheck, WorkType, TaskStatus, PhaseType, TaskPhase, Squad } from "@/types";

type QueueView = "list" | "kanban";

const defaultNewTask = {
  name: "", description: "", workType: "TASK" as WorkType,
  deadline: "", mondayLink: "", briefLink: "", figmaLink: "", iconikLink: "", slackThreadLink: "", internalSlackLink: "",
  channel: "", stakeholder: "", priorityLevel: "", catNumber: "", urgency: "",
  hasBuild: false, hasLocalization: false,
  customLinks: [] as { name: string; url: string }[],
};

// ── Filter defaults ───────────────────────────────────────────────────────────
type DateField = "startDate" | "dueDate" | "deadline";
const DATE_FIELD_OPTIONS: { value: DateField; label: string }[] = [
  { value: "startDate", label: "Start" },
  { value: "dueDate",   label: "Delivery" },
  { value: "deadline",  label: "Deadline" },
];

interface FilterState {
  workType: WorkType | "ALL";
  dateField: DateField;
  dateFrom: string;
  dateTo: string;
  owner: string;
}

const DEFAULT_FILTERS: FilterState = {
  workType: "ALL",
  dateField: "startDate",
  dateFrom: "",
  dateTo: "",
  owner: "",
};

function activeFilterCount(f: FilterState): number {
  let count = 0;
  if (f.workType !== "ALL") count++;
  if (f.dateFrom || f.dateTo) count++;
  if (f.owner) count++;
  return count;
}

// ── Phase-based grouping ──────────────────────────────────────────────────────
type GroupKey = PhaseType | "ON_HOLD" | "DONE" | "CANCELLED";

const TERMINAL_GROUPS: GroupKey[] = ["ON_HOLD", "DONE", "CANCELLED"];

// The phase a brief currently sits in, resolved by date in Philippine time:
// the phase whose range includes today, else the earliest upcoming phase, else
// the last phase. Used as the fallback when no explicit currentPhaseType is set
// — picking the last phase by sort order would wrongly bucket a not-yet-started
// brief into its final phase (e.g. Localization instead of Kickoff).
function resolveActivePhase(phases: TaskPhase[]): PhaseType {
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  const withDates = sorted.filter((p) => p.startDate && p.endDate);
  const today = todayPH();
  const current = withDates.find((p) =>
    !isBefore(today, phCalendarDate(p.startDate!)) && !isAfter(today, phCalendarDate(p.endDate!))
  );
  if (current) return current.type as PhaseType;
  const upcoming = withDates
    .filter((p) => isAfter(phCalendarDate(p.startDate!), today))
    .sort((a, b) => phCalendarDate(a.startDate!).getTime() - phCalendarDate(b.startDate!).getTime())[0];
  if (upcoming) return upcoming.type as PhaseType;
  return sorted[sorted.length - 1].type as PhaseType;
}

function getGroupKey(task: Task): GroupKey {
  if (task.status === "DONE") return "DONE";
  if (task.status === "CANCELLED") return "CANCELLED";
  if (task.status === "ON_HOLD" || task.currentPhaseType === "ON_HOLD") return "ON_HOLD";
  // BAU tasks have no fixed pipeline — their custom phase names (if any)
  // aren't part of GROUP_ORDER, so bucket by status only. Not-yet-started
  // BAU work merges into Intake; anything else (In Progress, and any stray
  // REVIEW/BLOCKED) merges into Creative Development, sharing that bucket's
  // "Creative Development/In Progress" label (see GROUP_LABELS below).
  if (task.workType === "BAU") return task.status === "INTAKE" ? "INTAKE" : "CREATIVE_DEVELOPMENT";
  // An explicitly-set current phase wins; otherwise resolve by date.
  if (task.currentPhaseType) return task.currentPhaseType as PhaseType;
  if (!task.phases?.length) return "INTAKE";
  return resolveActivePhase(task.phases);
}

function applyFilters(tasks: Task[], f: FilterState): Task[] {
  return tasks.filter((t) => {
    if (f.workType !== "ALL" && t.workType !== f.workType) return false;
    if (f.owner && (t.stakeholder ?? "").toLowerCase() !== f.owner.toLowerCase()) return false;
    if (f.dateFrom || f.dateTo) {
      const rawDate = t[f.dateField];
      if (!rawDate) return false;
      const taskDate = rawDate.slice(0, 10);
      if (f.dateFrom && taskDate < f.dateFrom) return false;
      if (f.dateTo && taskDate > f.dateTo) return false;
    }
    return true;
  });
}

// ── CSV helpers ───────────────────────────────────────────────────────────────
function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function isoDate(val: string | null | undefined): string {
  if (!val) return "";
  return val.slice(0, 10);
}

function exportCSV(tasks: Task[], phaseMeta: Record<string, { label: string; color: string }>) {
  const header = ["Name", "Type", "Status", "Assignees", "Phase", "Start Date", "Delivery Date", "Deadline"];
  const rows = tasks.map((t) => {
    const assignees = (t.assignments ?? [])
      .map((a) => a.teamMember?.name)
      .filter(Boolean)
      .join(", ");
    const phase = t.currentPhaseType
      ? phaseMeta[t.currentPhaseType]?.label ?? ""
      : "";
    return [
      t.name, t.workType, t.status, assignees, phase,
      isoDate(t.startDate), isoDate(t.dueDate), isoDate(t.deadline),
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `briefs-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Edit state helpers ────────────────────────────────────────────────────────
interface EditState {
  id: string;
  name: string;
  description: string;
  phase: PhaseType | "";
  status: TaskStatus;
  workType: WorkType;
  startDate: string;
  dueDate: string;
  deadline: string;
  notes: string;
  catNumber: string;
  urgency: string;
  mondayLink: string;
  briefLink: string;
  figmaLink: string;
  iconikLink: string;
  slackThreadLink: string;
  internalSlackLink: string;
  channel: string;
  stakeholder: string;
  priorityLevel: string;
  customLinks: { name: string; url: string }[];
}

function toDateInput(val: string | null | undefined): string {
  if (!val) return "";
  return val.slice(0, 10);
}

function taskToEditState(t: Task): EditState {
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? "",
    phase: (t.currentPhaseType as PhaseType) ?? "",
    status: t.status,
    workType: t.workType,
    startDate: toDateInput(t.startDate),
    dueDate: toDateInput(t.dueDate),
    deadline: toDateInput(t.deadline),
    notes: t.notes ?? "",
    catNumber: t.catNumber ?? "",
    urgency: t.urgency ?? "",
    mondayLink: t.mondayLink ?? "",
    briefLink: t.briefLink ?? "",
    figmaLink: t.figmaLink ?? "",
    iconikLink: t.iconikLink ?? "",
    slackThreadLink: t.slackThreadLink ?? "",
    internalSlackLink: t.internalSlackLink ?? "",
    channel: t.channel ?? "",
    stakeholder: t.stakeholder ?? "",
    priorityLevel: t.priorityLevel ?? "",
    customLinks: t.customLinks ?? [],
  };
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({
  edit, setEdit, onSave, onClose, saving, phaseOrder, phaseMeta, workTypeOrder, workTypeMeta,
}: {
  edit: EditState;
  setEdit: (e: EditState) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  phaseOrder: string[];
  phaseMeta: Record<string, { label: string; color: string }>;
  workTypeOrder: string[];
  workTypeMeta: Record<string, { label: string; color: string }>;
}) {
  const set = (patch: Partial<EditState>) => setEdit({ ...edit, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-900">
            {edit.workType === "BAU" ? "Edit Project" : "Edit Brief"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {edit.workType === "BAU" ? "Project name *" : "Brief name *"}
            </label>
            <input
              value={edit.name}
              onChange={(e) => set({ name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <textarea
              value={edit.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Phase + Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {edit.workType !== "BAU" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phase</label>
                <select
                  value={edit.phase}
                  onChange={(e) => set({ phase: e.target.value as PhaseType | "" })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">— No phase —</option>
                  {phaseOrder.map((p) => (
                    <option key={p} value={p}>{phaseMeta[p]?.label ?? p}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={edit.workType === "BAU" ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select
                value={edit.status}
                onChange={(e) => set({ status: e.target.value as TaskStatus })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {edit.workType === "BAU" ? (
                  <>
                    <option value="INTAKE">Intake</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </>
                ) : (
                  <>
                    <option value="IN_PROGRESS">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Work Type row */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Work Type</label>
            <select
              value={edit.workType}
              onChange={(e) => set({ workType: e.target.value as WorkType })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {workTypeOrder.map((key) => (
                <option key={key} value={key}>{workTypeMeta[key]?.label ?? key}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
              <input
                type="date"
                value={edit.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Delivery Date</label>
              <input
                type="date"
                value={edit.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {edit.workType === "BAU" ? "Deadline" : "Stakeholder Deadline"}
              </label>
              <input
                type="date"
                value={edit.deadline}
                onChange={(e) => set({ deadline: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Project metadata */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ...(edit.workType === "BAU" ? [] : [{ key: "channel" as const, label: "Channel", placeholder: "e.g. Engagement" }]),
              {
                key: "stakeholder" as const, label: "Owner",
                placeholder: edit.workType === "BAU" ? "" : "External owner",
              },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                <input type="text" value={edit[key]} onChange={(e) => set({ [key]: e.target.value } as Partial<EditState>)}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label>
              <select value={edit.priorityLevel} onChange={(e) => set({ priorityLevel: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">— Select —</option>
                <option value="P0 - Critical">P0 - Critical</option>
                <option value="P1 - Important, Urgent">P1 - Important, Urgent</option>
                <option value="P2 - Important, Flexible">P2 - Important, Flexible</option>
                <option value="P3 - Nice to have">P3 - Nice to have</option>
              </select>
            </div>
          </div>

          {/* CAT Number */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">CAT Number</label>
            <input
              type="text"
              value={edit.catNumber}
              onChange={(e) => set({ catNumber: e.target.value })}
              placeholder="e.g. CAT-1234"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Urgency</label>
            <select
              value={edit.urgency}
              onChange={(e) => set({ urgency: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">— Not set —</option>
              <option value="CRITICAL">Critical — must ship, no flex</option>
              <option value="FIXED">Fixed — date set, small buffer ok</option>
              <option value="FLEXIBLE">Flexible — no hard date, can shift</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
            <textarea
              value={edit.notes}
              onChange={(e) => set({ notes: e.target.value })}
              rows={2}
              placeholder="Internal notes…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Links */}
          <div className="pt-1 border-t border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Links</p>
            {edit.workType === "BAU" ? (
              <div className="space-y-2">
                {edit.customLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Link name (e.g. Design doc)"
                      value={link.name}
                      onChange={(e) => set({
                        customLinks: edit.customLinks.map((l, i) => i === idx ? { ...l, name: e.target.value } : l),
                      })}
                      className="w-48 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <input
                      type="url"
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => set({
                        customLinks: edit.customLinks.map((l, i) => i === idx ? { ...l, url: e.target.value } : l),
                      })}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button
                      onClick={() => set({ customLinks: edit.customLinks.filter((_, i) => i !== idx) })}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                      title="Remove link"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => set({ customLinks: [...edit.customLinks, { name: "", url: "" }] })}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-3 h-3" /> Add link
                </button>
              </div>
            ) : (
              ([
                { key: "mondayLink" as const,         label: "monday.com URL" },
                { key: "briefLink" as const,          label: "Brief URL" },
                { key: "figmaLink" as const,          label: "Figma URL" },
                { key: "iconikLink" as const,         label: "Iconik URL" },
                { key: "slackThreadLink" as const,    label: "SH Slack Thread URL" },
                { key: "internalSlackLink" as const,  label: "Internal Slack Thread URL" },
              ] as { key: keyof EditState; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type="url"
                    value={edit[key] as string}
                    onChange={(e) => set({ [key]: e.target.value } as Partial<EditState>)}
                    placeholder={`https://…`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-2 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !edit.name.trim()}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AutoPicker types ──────────────────────────────────────────────────────────
interface AutoPickerStep {
  automationName: string;
  stepId: string;
  description: string;
  durationType: string;
  sortOrder: number;
  subtasks: { description: string; sortOrder: number }[];
}

// ── Reusable group table (phase-based groups + BAU status-based groups) ───────
function GroupSection({
  groupKey, label, color, tasks, isCollapsed, onToggleCollapse,
  deletingId, editingNotesId, notesDraft, setNotesDraft, saveNotes,
  setEditingNotesId, onEdit, onDelete, onAssign,
}: {
  groupKey: string;
  label: string;
  color: string;
  tasks: Task[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  deletingId: string | null;
  editingNotesId: string | null;
  notesDraft: string;
  setNotesDraft: (v: string) => void;
  saveNotes: (taskId: string) => void;
  setEditingNotesId: (id: string | null) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAssign: (task: Task) => void;
}) {
  return (
    <div
      key={groupKey}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      {/* Group header */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span className="text-xs text-gray-400 font-normal">
          {tasks.length} brief{tasks.length !== 1 ? "s" : ""}
        </span>
      </button>

      {!isCollapsed && (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase tracking-wide">
                <th className="text-left pl-4 pr-3 py-2.5 w-[22%]">Brief</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">Type</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">Owner</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">Assignees</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">Urgency</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">Priority</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">Deadline</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">Brief</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">Monday</th>
                <th className="text-left px-2 py-2.5 whitespace-nowrap">CAT #</th>
                <th className="text-left px-2 py-2.5 w-[22%]">Notes</th>
                <th className="px-3 py-2.5 whitespace-nowrap" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const assignees = (task.assignments ?? [])
                  .map((a) => a.teamMember)
                  .filter(Boolean);
                return (
                  <tr
                    key={task.id}
                    className="border-b border-gray-50 hover:bg-indigo-50/40 group transition-colors"
                  >
                    {/* Brief name */}
                    <td className="pl-4 pr-3 py-3">
                      <a
                        href={`/tasks/${task.id}`}
                        className="text-sm font-medium text-gray-800 hover:text-indigo-700 line-clamp-2"
                      >
                        {task.name}
                      </a>
                    </td>
                    {/* Type */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      <WorkTypeBadge type={task.workType} />
                    </td>
                    {/* Owner */}
                    <td className="px-2 py-3 w-24">
                      {task.stakeholder ? (
                        <span className="text-xs text-gray-600 truncate block">{task.stakeholder}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Assignees */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="flex items-center -space-x-1">
                        {assignees.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          assignees.slice(0, 3).map((m: any) => (
                            <Avatar key={m.id} name={m.name} size="sm" gray className="ring-2 ring-white" />
                          ))
                        )}
                        {assignees.length > 3 && (
                          <span className="text-[10px] text-gray-400 ml-1.5">
                            +{assignees.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Urgency */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      {task.urgency ? (
                        <span className={cn(
                          "text-[11px] px-1.5 py-0.5 rounded-full font-medium",
                          task.urgency === "CRITICAL" && "bg-red-100 text-red-700",
                          task.urgency === "FIXED" && "bg-amber-100 text-amber-700",
                          task.urgency === "FLEXIBLE" && "bg-green-100 text-green-700",
                        )}>
                          {task.urgency === "CRITICAL" ? "Critical" : task.urgency === "FIXED" ? "Fixed" : "Flexible"}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Priority */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      {task.priorityLevel ? (
                        <span className={cn(
                          "text-[11px] px-1.5 py-0.5 rounded-full font-medium",
                          task.priorityLevel.startsWith("P0") && "bg-red-100 text-red-700",
                          task.priorityLevel.startsWith("P1") && "bg-orange-100 text-orange-700",
                          task.priorityLevel.startsWith("P2") && "bg-amber-100 text-amber-700",
                          task.priorityLevel.startsWith("P3") && "bg-gray-100 text-gray-600",
                        )}>
                          {task.priorityLevel}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Deadline */}
                    <td className="px-2 py-3 whitespace-nowrap text-xs">
                      {task.deadline ? (
                        <span className="font-medium text-rose-600">
                          {formatDate(task.deadline, "MMM d")}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Brief link */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      {task.briefLink ? (
                        <a
                          href={task.briefLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open brief"
                          className="inline-flex text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-gray-200">—</span>
                      )}
                    </td>
                    {/* Monday link */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      {task.mondayLink ? (
                        <a
                          href={task.mondayLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open monday.com"
                          className="inline-flex text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-gray-200">—</span>
                      )}
                    </td>
                    {/* CAT # */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      {task.catNumber ? (
                        <span className="text-xs text-gray-600 font-mono">{task.catNumber}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Notes — inline editable */}
                    {editingNotesId === task.id ? (
                      <td
                        className="px-2 py-2 w-44"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          autoFocus
                          rows={3}
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          onBlur={() => saveNotes(task.id)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Escape") { setEditingNotesId(null); setNotesDraft(""); }
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNotes(task.id); }
                          }}
                          placeholder="Add a note…"
                          className="w-full text-xs text-gray-700 border border-indigo-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                        />
                      </td>
                    ) : (
                      <td
                        className="px-2 py-3 w-44 max-w-[176px] cursor-text"
                        onClick={(e) => { e.stopPropagation(); setEditingNotesId(task.id); setNotesDraft(task.notes ?? ""); }}
                      >
                        {task.notes ? (
                          <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap">{task.notes}</p>
                        ) : (
                          <span className="text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Add note…</span>
                        )}
                      </td>
                    )}
                    {/* Actions */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(task)}
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit brief"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(task.id)}
                          disabled={deletingId === task.id}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete brief"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onAssign(task)}
                          className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const { phaseOrder, phaseMeta } = usePhases();
  const { workTypeOrder, workTypeMeta } = useWorkTypes();

  // Derived group helpers — recalculated when phase config changes
  const GROUP_ORDER: GroupKey[] = [...phaseOrder as GroupKey[], ...TERMINAL_GROUPS];
  const GROUP_LABELS: Record<string, string> = {
    ...Object.fromEntries(phaseOrder.map((p) => [p, phaseMeta[p]?.label ?? p])),
    // Display-only bucket label — BAU "In Progress" work shares this column
    // with briefs in Creative Development (see getGroupKey). The underlying
    // CREATIVE_DEVELOPMENT phase name itself is unchanged everywhere else.
    CREATIVE_DEVELOPMENT: "Creative Development/In Progress",
    ON_HOLD: "On Hold",
    DONE: "Done",
    CANCELLED: "Cancelled",
  };
  const GROUP_COLORS: Record<string, string> = {
    ...Object.fromEntries(phaseOrder.map((p) => [p, phaseMeta[p]?.color ?? "#94a3b8"])),
    ON_HOLD: "#6b7280",
    DONE: "#10b981",
    CANCELLED: "#9ca3af",
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [capacityChecks, setCapacityChecks] = useState<CapacityCheck[]>([]);
  const [viewMode, setViewMode] = useState<QueueView>("list");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [newTask, setNewTask] = useState(defaultNewTask);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    DONE: true, CANCELLED: true, ON_HOLD: false,
  });

  // Edit state
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  // AutoPicker state
  const [autoPicker, setAutoPicker] = useState<{ taskId: string; steps: AutoPickerStep[] } | null>(null);
  const [autoSelected, setAutoSelected] = useState<Set<string>>(new Set());

  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Inline notes editing
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  async function saveNotes(taskId: string) {
    const notes = notesDraft.trim() || null;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, notes: notes ?? undefined } : t));
    setEditingNotesId(null);
    setNotesDraft("");
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [tasksRes, membersRes, capacityRes, squadsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/team"),
      fetch("/api/capacity"),
      fetch("/api/squads"),
    ]);
    const [tasksData, membersData, capacityData, squadsData] = await Promise.all([
      tasksRes.json(), membersRes.json(), capacityRes.json(), squadsRes.json().catch(() => []),
    ]);
    setTasks(Array.isArray(tasksData) ? tasksData : []);
    setMembers(Array.isArray(membersData) ? membersData : []);
    setCapacityChecks(Array.isArray(capacityData) ? capacityData : []);
    setSquads(Array.isArray(squadsData) ? squadsData : []);
    setLoading(false);
  }

  async function handleAssign(assignments: any[], removedMemberIds: string[] = []) {
    if (!selectedTask) return;
    if (removedMemberIds.length) {
      const current = selectedTask.assignments || [];
      for (const memberId of removedMemberIds) {
        const asgn = current.find((a) => a.teamMemberId === memberId);
        if (asgn) await fetch(`/api/assignments/${asgn.id}`, { method: "DELETE" });
      }
    }
    if (assignments.length) {
      await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTask.id, assignments }),
      });
    }
    await loadData();
  }

  async function handleAddTask() {
    if (!newTask.name.trim()) return;
    setAddError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newTask,
        customLinks: newTask.customLinks.filter((l) => l.name.trim() && l.url.trim()),
        deadline: newTask.deadline || undefined,
        mondayLink: newTask.mondayLink || null,
        briefLink: newTask.briefLink || null,
        figmaLink: newTask.figmaLink || null,
        iconikLink: newTask.iconikLink || null,
        slackThreadLink: newTask.slackThreadLink || null,
        internalSlackLink: newTask.internalSlackLink || null,
        channel: newTask.channel || null,
        stakeholder: newTask.stakeholder || null,
        priorityLevel: newTask.priorityLevel || null,
        catNumber: newTask.catNumber || null,
        urgency: newTask.urgency || null,
        hasBuild: newTask.hasBuild,
        hasLocalization: newTask.hasLocalization,
        isInIntake: true,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAddError(body.detail ?? body.error ?? "Failed to add brief — please try again.");
      return;
    }
    const task = await res.json();
    // Fetch automations and check for matches
    try {
      const autoRes = await fetch("/api/automations");
      const automations: any[] = await autoRes.json().catch(() => []);
      const matching = Array.isArray(automations) ? automations.filter((a: any) =>
        a.isActive !== false && (
          a.triggerType === "INTAKE_ADDED" ||
          (a.triggerType === "WORK_TYPE" && a.triggerValue === newTask.workType)
        )
      ) : [];
      const steps: AutoPickerStep[] = matching.flatMap((a: any) =>
        (a.steps ?? []).map((s: any) => ({
          automationName: a.name,
          stepId: s.id,
          description: s.description,
          durationType: s.durationType ?? "FULL_DAY",
          sortOrder: s.sortOrder,
          subtasks: s.subtasks ?? [],
        }))
      );
      if (steps.length > 0) {
        setAutoSelected(new Set(steps.map((s) => s.stepId)));
        setAutoPicker({ taskId: task.id, steps });
        return; // Don't close form yet
      }
    } catch {}
    // No automations — finish normally
    setShowAddForm(false);
    setNewTask(defaultNewTask);
    await loadData();
  }

  async function handleSaveEdit() {
    if (!editState || !editState.name.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${editState.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editState.name,
        description: editState.description || null,
        currentPhaseType: editState.phase || null,
        status: editState.status,
        workType: editState.workType,
        startDate: editState.startDate || null,
        dueDate: editState.dueDate || null,
        deadline: editState.deadline || null,
        notes: editState.notes || null,
        catNumber: editState.catNumber || null,
        urgency: editState.urgency || null,
        mondayLink: editState.mondayLink || null,
        briefLink: editState.briefLink || null,
        figmaLink: editState.figmaLink || null,
        iconikLink: editState.iconikLink || null,
        slackThreadLink: editState.slackThreadLink || null,
        internalSlackLink: editState.internalSlackLink || null,
        channel: editState.channel || null,
        stakeholder: editState.stakeholder || null,
        priorityLevel: editState.priorityLevel || null,
        customLinks: editState.customLinks.filter((l) => l.name.trim() && l.url.trim()),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditState(null);
      await loadData();
    }
  }

  async function handleConfirmAutomation() {
    if (!autoPicker) return;
    const selected = autoPicker.steps.filter((s) => autoSelected.has(s.stepId));
    for (const step of selected) {
      await fetch(`/api/tasks/${autoPicker.taskId}/next-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: step.description,
          durationType: step.durationType,
          sortOrder: step.sortOrder,
          subtasks: step.subtasks,
        }),
      });
    }
    setAutoPicker(null);
    setAutoSelected(new Set());
    setShowAddForm(false);
    setNewTask(defaultNewTask);
    await loadData();
  }

  function handleDelete(taskId: string) {
    setConfirmDeleteId(taskId);
  }

  async function performDelete(taskId: string) {
    setDeleting(taskId);
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setDeleting(null);
    setConfirmDeleteId(null);
    await loadData();
  }

  function toggleCollapsed(status: string) {
    setCollapsed((c) => ({ ...c, [status]: !c[status] }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const filteredTasks = applyFilters(tasks, filters);

  // Group by phase / terminal status. BAU tasks merge in via getGroupKey —
  // Intake into the shared Intake bucket, everything else (In Progress, and
  // any stray REVIEW/BLOCKED) into Creative Development.
  const grouped = GROUP_ORDER.reduce((acc, key) => {
    acc[key] = filteredTasks.filter((t) => getGroupKey(t) === key);
    return acc;
  }, {} as Record<GroupKey, Task[]>);

  const badgeCount = activeFilterCount(filters);

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="All Briefs"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(filteredTasks, phaseMeta)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  if (showAddForm) { setShowAddForm(false); setAddMenuOpen(false); }
                  else setAddMenuOpen((v) => !v);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddForm ? "Cancel" : "Add"}
              </button>
              {addMenuOpen && !showAddForm && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                    <button
                      onClick={() => {
                        setNewTask({ ...defaultNewTask, workType: "TASK" });
                        setAddError(null);
                        setShowAddForm(true);
                        setAddMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Brief
                    </button>
                    <button
                      onClick={() => {
                        setNewTask({ ...defaultNewTask, workType: "BAU" });
                        setAddError(null);
                        setShowAddForm(true);
                        setAddMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      BAU project
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="p-6 flex-1 overflow-auto">
        {/* ── Add form ── */}
        {showAddForm && (
          <div className="bg-white border border-indigo-200 rounded-xl p-5 mb-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {newTask.workType === "BAU" ? "New BAU Project" : "New Brief"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder={newTask.workType === "BAU" ? "Project name *" : "Brief name *"}
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                className="col-span-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <textarea
                placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={2}
                className="col-span-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
              <div className="flex gap-3 flex-wrap col-span-full">
                <select
                  value={newTask.workType}
                  onChange={(e) => setNewTask({ ...newTask, workType: e.target.value as WorkType })}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                >
                  {workTypeOrder.map((key) => (
                    <option key={key} value={key}>{workTypeMeta[key]?.label ?? key}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-gray-400 whitespace-nowrap">
                    {newTask.workType === "BAU" ? "Deadline" : "Stakeholder deadline"}
                  </label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Project metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
              <p className="col-span-full text-xs font-medium text-gray-500 uppercase tracking-wide">Project Details</p>
              {[
                ...(newTask.workType === "BAU" ? [] : [{ key: "channel", label: "Channel", placeholder: "e.g. Engagement" }]),
                {
                  key: "stakeholder", label: "Owner",
                  placeholder: newTask.workType === "BAU" ? "" : "External owner",
                },
                { key: "catNumber",   label: "CAT #",    placeholder: "e.g. CAT-1234" },
              ].map(({ key, label, placeholder }) => (
                <input key={key} type="text" placeholder={placeholder ? label + " — " + placeholder : label}
                  value={(newTask as any)[key]}
                  onChange={(e) => setNewTask({ ...newTask, [key]: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              ))}
              <select value={newTask.priorityLevel}
                onChange={(e) => setNewTask({ ...newTask, priorityLevel: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Priority — select</option>
                <option value="P0 - Critical">P0 - Critical</option>
                <option value="P1 - Important, Urgent">P1 - Important, Urgent</option>
                <option value="P2 - Important, Flexible">P2 - Important, Flexible</option>
                <option value="P3 - Nice to have">P3 - Nice to have</option>
              </select>
              <select value={newTask.urgency}
                onChange={(e) => setNewTask({ ...newTask, urgency: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Urgency — select</option>
                <option value="CRITICAL">Critical — must ship, no flex</option>
                <option value="FIXED">Fixed — date set, small buffer ok</option>
                <option value="FLEXIBLE">Flexible — no hard date, can shift</option>
              </select>
            </div>

            {/* Production */}
            {newTask.workType !== "BAU" && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Production</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newTask.hasBuild}
                      onChange={(e) => setNewTask({ ...newTask, hasBuild: e.target.checked })}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Build</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newTask.hasLocalization}
                      onChange={(e) => setNewTask({ ...newTask, hasLocalization: e.target.checked })}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Localisation</span>
                  </label>
                </div>
              </div>
            )}

            {/* Link fields */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Links</p>
              {newTask.workType === "BAU" ? (
                <div className="space-y-2">
                  {newTask.customLinks.map((link, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Link name (e.g. Design doc)"
                        value={link.name}
                        onChange={(e) => setNewTask({
                          ...newTask,
                          customLinks: newTask.customLinks.map((l, i) => i === idx ? { ...l, name: e.target.value } : l),
                        })}
                        className="w-48 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => setNewTask({
                          ...newTask,
                          customLinks: newTask.customLinks.map((l, i) => i === idx ? { ...l, url: e.target.value } : l),
                        })}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <button
                        onClick={() => setNewTask({
                          ...newTask,
                          customLinks: newTask.customLinks.filter((_, i) => i !== idx),
                        })}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                        title="Remove link"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewTask({ ...newTask, customLinks: [...newTask.customLinks, { name: "", url: "" }] })}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-3 h-3" /> Add link
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "mondayLink", label: "monday.com URL" },
                    { key: "briefLink", label: "Brief URL" },
                    { key: "figmaLink", label: "Figma URL" },
                    { key: "iconikLink", label: "Iconik URL" },
                    { key: "slackThreadLink", label: "SH Slack Thread URL" },
                    { key: "internalSlackLink", label: "Internal Slack Thread URL" },
                  ].map(({ key, label }) => (
                    <input
                      key={key}
                      type="url"
                      placeholder={label}
                      value={(newTask as any)[key]}
                      onChange={(e) => setNewTask({ ...newTask, [key]: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  ))}
                </div>
              )}
            </div>

            {addError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => { setShowAddForm(false); setNewTask(defaultNewTask); setAddError(null); }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTask.name.trim()}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Intake
              </button>
            </div>
          </div>
        )}

        {/* ── Filter bar ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                filtersOpen
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {badgeCount > 0 && (
                <span className="ml-0.5 flex items-center justify-center w-4 h-4 bg-indigo-600 text-white text-[10px] font-semibold rounded-full">
                  {badgeCount}
                </span>
              )}
              {filtersOpen ? (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronRight className="w-3 h-3 ml-0.5" />
              )}
            </button>
            {badgeCount > 0 && !filtersOpen && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Clear
              </button>
            )}

            {/* List / Kanban view toggle */}
            <div className="ml-auto flex items-center bg-gray-100 rounded-lg p-0.5">
              {([
                { key: "list" as const, label: "List", Icon: List },
                { key: "kanban" as const, label: "Kanban", Icon: LayoutGrid },
              ]).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    // Returning to list picks up any phase changes made by
                    // dragging cards in the kanban view.
                    if (key === "list" && viewMode === "kanban") loadData();
                    setViewMode(key);
                  }}
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors",
                    viewMode === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtersOpen && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Work Type</p>
                  <div className="flex gap-1.5">
                    {(["ALL", "STRATEGIC", "TASK", "BAU", "MICRO"] as const).map((wt) => (
                      <button
                        key={wt}
                        onClick={() => setFilters((f) => ({ ...f, workType: wt }))}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                          filters.workType === wt
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {wt === "ALL" ? "All" : wt.charAt(0) + wt.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date Field</p>
                  <select
                    value={filters.dateField}
                    onChange={(e) => setFilters((f) => ({ ...f, dateField: e.target.value as DateField }))}
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700"
                  >
                    {DATE_FIELD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">From</p>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700"
                  />
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">To</p>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700"
                  />
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Owner</p>
                  <input
                    type="text"
                    value={filters.owner}
                    onChange={(e) => setFilters((f) => ({ ...f, owner: e.target.value }))}
                    placeholder="Filter by owner…"
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700 w-40"
                  />
                </div>

                <button
                  onClick={clearFilters}
                  disabled={badgeCount === 0}
                  className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Task list / Kanban ── */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Inbox className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No briefs yet</p>
            <p className="text-xs text-gray-400 mt-1">Sync monday.com or add briefs manually</p>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <KanbanBoard tasks={filteredTasks} members={members} squads={squads} />
          </div>
        ) : (
          <div className="space-y-4">
            {GROUP_ORDER.map((key) => {
              const groupTasks = grouped[key];
              if (groupTasks.length === 0) return null;
              return (
                <GroupSection
                  key={key}
                  groupKey={key}
                  label={GROUP_LABELS[key]}
                  color={GROUP_COLORS[key]}
                  tasks={groupTasks}
                  isCollapsed={collapsed[key]}
                  onToggleCollapse={() => toggleCollapsed(key)}
                  deletingId={deleting}
                  editingNotesId={editingNotesId}
                  notesDraft={notesDraft}
                  setNotesDraft={setNotesDraft}
                  saveNotes={saveNotes}
                  setEditingNotesId={setEditingNotesId}
                  onEdit={(task) => setEditState(taskToEditState(task))}
                  onDelete={handleDelete}
                  onAssign={setSelectedTask}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editState && (
        <EditModal
          edit={editState}
          setEdit={setEditState}
          onSave={handleSaveEdit}
          onClose={() => setEditState(null)}
          saving={saving}
          phaseOrder={phaseOrder}
          phaseMeta={phaseMeta}
          workTypeOrder={workTypeOrder}
          workTypeMeta={workTypeMeta}
        />
      )}

      {selectedTask && (
        <AssignModal
          task={selectedTask}
          members={members}
          capacityChecks={capacityChecks}
          existingAssignments={selectedTask.assignments || []}
          phases={selectedTask.phases || []}
          tempAssignments={selectedTask.tempAssignments || []}
          onRemoveTemp={async (tempId) => {
            await fetch(`/api/assignments/temp/${tempId}`, { method: "DELETE" });
            setSelectedTask((prev) =>
              prev ? { ...prev, tempAssignments: (prev.tempAssignments || []).filter((t) => t.id !== tempId) } : prev
            );
            loadData();
          }}
          onClose={() => setSelectedTask(null)}
          onAssign={handleAssign}
        />
      )}

      {autoPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => {
            setAutoPicker(null); setAutoSelected(new Set()); setShowAddForm(false); setNewTask(defaultNewTask); loadData();
          }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Add automation steps?</h2>
                <p className="text-xs text-gray-500 mt-0.5">Select which steps to add to this brief</p>
              </div>
              <button
                onClick={() => { setAutoPicker(null); setAutoSelected(new Set()); setShowAddForm(false); setNewTask(defaultNewTask); loadData(); }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
              {autoPicker.steps.map((step) => (
                <label key={step.stepId} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded"
                    checked={autoSelected.has(step.stepId)}
                    onChange={() => {
                      setAutoSelected((prev) => {
                        const next = new Set(prev);
                        next.has(step.stepId) ? next.delete(step.stepId) : next.add(step.stepId);
                        return next;
                      });
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{step.description}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {step.automationName} · {step.durationType === "HALF_DAY" ? "Half day" : step.durationType === "TWO_HOURS" ? "2 hrs" : "Full day"}
                      {step.subtasks.length > 0 && ` · ${step.subtasks.length} checklist items`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={() => { setAutoPicker(null); setAutoSelected(new Set()); setShowAddForm(false); setNewTask(defaultNewTask); loadData(); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip all
              </button>
              <button
                onClick={handleConfirmAutomation}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add {autoSelected.size} step{autoSelected.size !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (() => {
        const brief = tasks.find((t) => t.id === confirmDeleteId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteId(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 mx-auto mb-4">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-base font-semibold text-gray-900 text-center">Delete brief?</h2>
                <p className="text-sm text-gray-500 text-center mt-1">
                  <span className="font-medium text-gray-700">&ldquo;{brief?.name}&rdquo;</span> will be permanently deleted. This cannot be undone.
                </p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => performDelete(confirmDeleteId)}
                  disabled={deleting === confirmDeleteId}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting === confirmDeleteId ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
