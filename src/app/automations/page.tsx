"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Zap,
  Copy,
  Pencil,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  Users,
  Clock,
  CheckCircle,
  Save,
} from "lucide-react";
import { useWorkTypes } from "@/lib/work-types-context";

type TriggerType = "INTAKE_ADDED" | "WORK_TYPE" | "STATUS_CHANGE";

interface AutomationSubtask {
  id?: string;
  description: string;
  sortOrder: number;
}

interface AutomationStep {
  id?: string;
  description: string;
  durationType: string;
  assignedToId?: string | null;
  sortOrder: number;
  subtasks: AutomationSubtask[];
}

interface Automation {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: TriggerType;
  triggerValue?: string | null;
  steps: AutomationStep[];
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

function describeTrigger(triggerType: TriggerType, triggerValue: string | null | undefined, workTypeLabels: Record<string, string>): string {
  if (triggerType === "INTAKE_ADDED") return "When any task is added to Intake";
  if (triggerType === "WORK_TYPE") {
    return `When work type is ${workTypeLabels[triggerValue ?? ""] ?? triggerValue ?? "..."}`;
  }
  if (triggerType === "STATUS_CHANGE") {
    const labels: Record<string, string> = {
      INTAKE: "Intake",
      IN_PROGRESS: "In Progress",
      REVIEW: "Review",
      BLOCKED: "Blocked",
      DONE: "Done",
      CANCELLED: "Cancelled",
    };
    return `When status changes to ${labels[triggerValue ?? ""] ?? triggerValue ?? "..."}`;
  }
  return triggerType;
}

function emptyStep(sortOrder: number): AutomationStep {
  return { description: "", durationType: "FULL_DAY", assignedToId: null, sortOrder, subtasks: [] };
}

// ─── AutomationForm ──────────────────────────────────────────────────────────

interface AutomationFormProps {
  initial?: Automation;
  members: TeamMember[];
  onSave: (data: Partial<Automation> & { steps: AutomationStep[] }) => Promise<void>;
  onCancel: () => void;
}

function AutomationForm({ initial, members, onSave, onCancel }: AutomationFormProps) {
  const { workTypeOrder, workTypeMeta } = useWorkTypes();
  const [name, setName] = useState(initial?.name ?? "");
  const [triggerType, setTriggerType] = useState<TriggerType>(initial?.triggerType ?? "INTAKE_ADDED");
  const [triggerValue, setTriggerValue] = useState(initial?.triggerValue ?? "");
  const [steps, setSteps] = useState<AutomationStep[]>(
    initial?.steps && initial.steps.length > 0 ? initial.steps : [emptyStep(0)]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<number, boolean>>({});

  const isEdit = !!initial;

  function toggleSubtasks(index: number) {
    setExpandedSubtasks((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function addStep() {
    setSteps((prev) => [...prev, emptyStep(prev.length)]);
  }

  function updateStep(index: number, field: keyof AutomationStep, value: string | null) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
    setExpandedSubtasks((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k);
        if (ki < index) next[ki] = v;
        else if (ki > index) next[ki - 1] = v;
      });
      return next;
    });
  }

  function addSubtask(stepIndex: number) {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== stepIndex) return s;
        return {
          ...s,
          subtasks: [...s.subtasks, { description: "", sortOrder: s.subtasks.length }],
        };
      })
    );
    setExpandedSubtasks((prev) => ({ ...prev, [stepIndex]: true }));
  }

  function updateSubtask(stepIndex: number, subIndex: number, value: string) {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== stepIndex) return s;
        return {
          ...s,
          subtasks: s.subtasks.map((sub, j) =>
            j === subIndex ? { ...sub, description: value } : sub
          ),
        };
      })
    );
  }

  function removeSubtask(stepIndex: number, subIndex: number) {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== stepIndex) return s;
        return {
          ...s,
          subtasks: s.subtasks
            .filter((_, j) => j !== subIndex)
            .map((sub, j) => ({ ...sub, sortOrder: j })),
        };
      })
    );
  }

  async function handleSubmit() {
    if (!name.trim()) { setError("Name is required."); return; }
    const validSteps = steps.filter((s) => s.description.trim());
    if (validSteps.length === 0) { setError("Add at least one step."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name,
        triggerType,
        triggerValue: triggerType === "INTAKE_ADDED" ? null : triggerValue || null,
        steps: validSteps.map((s, i) => ({
          ...s,
          sortOrder: i,
          subtasks: s.subtasks
            .filter((sub) => sub.description.trim())
            .map((sub, j) => ({ ...sub, sortOrder: j })),
        })),
      });
    } catch {
      setError("Failed to save automation.");
    } finally {
      setSaving(false);
    }
  }

  const showTriggerValue = triggerType !== "INTAKE_ADDED";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{isEdit ? "Edit Automation" : "New Automation"}</h3>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Strategic intake checklist"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Trigger</label>
          <select
            value={triggerType}
            onChange={(e) => { setTriggerType(e.target.value as TriggerType); setTriggerValue(""); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="INTAKE_ADDED">When a task is added to intake</option>
            <option value="WORK_TYPE">When work type is...</option>
            <option value="STATUS_CHANGE">When status changes to...</option>
          </select>
        </div>

        {showTriggerValue && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {triggerType === "WORK_TYPE" ? "Work Type" : "Status"}
            </label>
            {triggerType === "WORK_TYPE" ? (
              <select
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select...</option>
                {workTypeOrder.map((key) => (
                  <option key={key} value={key}>{workTypeMeta[key]?.label ?? key}</option>
                ))}
              </select>
            ) : (
              <select
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select...</option>
                <option value="INTAKE">Intake</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* Steps */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Steps</label>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-2">
              {/* Step row */}
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab" />
                <span className="text-xs text-gray-400 w-5 text-center shrink-0">{i + 1}</span>
                <input
                  value={step.description}
                  onChange={(e) => updateStep(i, "description", e.target.value)}
                  placeholder="Step description"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
                {/* Assignee picker */}
                <div className="flex items-center gap-1 shrink-0">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={step.assignedToId ?? ""}
                    onChange={(e) => updateStep(i, "assignedToId", e.target.value || null)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white max-w-[130px]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                {/* Subtask toggle */}
                <button
                  type="button"
                  onClick={() => toggleSubtasks(i)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 border border-gray-200 rounded-lg bg-white shrink-0"
                >
                  {expandedSubtasks[i] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>{step.subtasks.length > 0 ? `${step.subtasks.length} sub` : "sub-tasks"}</span>
                </button>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(i)} className="text-gray-400 hover:text-red-500 p-1 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Subtasks (collapsible) */}
              {expandedSubtasks[i] && (
                <div className="pl-9 space-y-1.5">
                  {step.subtasks.map((sub, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">·</span>
                      <input
                        value={sub.description}
                        onChange={(e) => updateSubtask(i, j, e.target.value)}
                        placeholder="Sub-task description"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                      />
                      <button
                        onClick={() => removeSubtask(i, j)}
                        className="text-gray-300 hover:text-red-400 p-0.5 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSubtask(i)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1"
                  >
                    <Plus className="w-3 h-3" />
                    sub-task
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addStep}
          className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add step
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Automation"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const { workTypeMeta } = useWorkTypes();
  const workTypeLabels = Object.fromEntries(Object.entries(workTypeMeta).map(([k, v]) => [k, v.label]));
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

  // ── Auto-archive behavior settings (stored in localStorage) ──
  const [archiveEnabled, setArchiveEnabled] = useState(true);
  const [archiveMins, setArchiveMins] = useState(10);
  const [archiveSaved, setArchiveSaved] = useState(false);

  useEffect(() => {
    loadAutomations();
    loadMembers();
    try {
      const enabled = localStorage.getItem("lc-auto-archive-enabled");
      if (enabled !== null) setArchiveEnabled(enabled !== "false");
      const mins = parseInt(localStorage.getItem("lc-auto-archive-mins") ?? "10", 10);
      if (!isNaN(mins) && mins >= 1) setArchiveMins(mins);
    } catch {}
  }, []);

  function saveArchiveSettings() {
    try {
      localStorage.setItem("lc-auto-archive-enabled", String(archiveEnabled));
      localStorage.setItem("lc-auto-archive-mins", String(archiveMins));
    } catch {}
    setArchiveSaved(true);
    setTimeout(() => setArchiveSaved(false), 2500);
  }

  async function loadAutomations() {
    setLoading(true);
    const res = await fetch("/api/automations");
    const data = await res.json();
    setAutomations(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadMembers() {
    const res = await fetch("/api/team");
    const data = await res.json();
    setMembers(Array.isArray(data) ? data : []);
  }

  async function handleCreate(data: Partial<Automation> & { steps: AutomationStep[] }) {
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed");
    const created = await res.json();
    setAutomations((prev) => [created, ...prev]);
    setShowCreateForm(false);
  }

  async function handleEdit(data: Partial<Automation> & { steps: AutomationStep[] }) {
    if (!editingAutomation) return;
    const res = await fetch(`/api/automations/${editingAutomation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed");
    const updated = await res.json();
    setAutomations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditingAutomation(null);
  }

  async function handleToggle(automation: Automation) {
    const updated = await fetch(`/api/automations/${automation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !automation.isActive }),
    }).then((r) => r.json());
    setAutomations((prev) => prev.map((a) => (a.id === automation.id ? updated : a)));
  }

  async function handleDuplicate(automation: Automation) {
    const res = await fetch(`/api/automations/${automation.id}/duplicate`, { method: "POST" });
    if (!res.ok) return;
    const copy = await res.json();
    setAutomations((prev) => [copy, ...prev]);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this automation?")) return;
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  }

  const totalSubtasks = (automation: Automation) =>
    automation.steps.reduce((acc, s) => acc + s.subtasks.length, 0);

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Automations" />
      <div className="p-6 flex flex-col gap-6 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Set up trigger-based workflows for your team</p>
          </div>
          <button
            onClick={() => { setShowCreateForm(true); setEditingAutomation(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            New Automation
          </button>
        </div>

        {/* ── Behavior settings ─────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Auto-archive completed steps</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Next steps and sub-items are automatically removed from My Work a set time after being checked off.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setArchiveEnabled((v) => !v)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  archiveEnabled ? "bg-indigo-600" : "bg-gray-200"
                )}
              >
                <span className={cn(
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                  archiveEnabled ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
              <span className="text-xs text-gray-500 w-14">{archiveEnabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>

          {archiveEnabled && (
            <div className="flex items-center gap-3 pl-11">
              <span className="text-sm text-gray-600">Archive after</span>
              <input
                type="number"
                min={1}
                max={1440}
                value={archiveMins}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n) && n >= 1) setArchiveMins(n);
                }}
                className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <span className="text-sm text-gray-600">minutes</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={saveArchiveSettings}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors",
                archiveSaved
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              {archiveSaved
                ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
                : <><Save className="w-3.5 h-3.5" /> Save</>}
            </button>
          </div>
        </div>

        {/* ── Trigger-based automations ──────────────────────────────────── */}

        {/* Create form */}
        {showCreateForm && !editingAutomation && (
          <AutomationForm
            members={members}
            onSave={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Automations list */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
        ) : automations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <Zap className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No automations yet</p>
            <p className="text-xs text-gray-400 mt-1">Create a trigger-based workflow to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => (
              <div key={automation.id}>
                {/* Edit form inline */}
                {editingAutomation?.id === automation.id ? (
                  <AutomationForm
                    initial={editingAutomation}
                    members={members}
                    onSave={handleEdit}
                    onCancel={() => setEditingAutomation(null)}
                  />
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      automation.isActive ? "bg-indigo-100" : "bg-gray-100"
                    )}>
                      <Zap className={cn("w-4 h-4", automation.isActive ? "text-indigo-600" : "text-gray-400")} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{automation.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{describeTrigger(automation.triggerType, automation.triggerValue, workTypeLabels)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {automation.steps.length} step{automation.steps.length !== 1 ? "s" : ""}
                        {totalSubtasks(automation) > 0 && ` · ${totalSubtasks(automation)} sub-task${totalSubtasks(automation) !== 1 ? "s" : ""}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggle(automation)}
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          automation.isActive ? "bg-indigo-600" : "bg-gray-200"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                          automation.isActive ? "translate-x-4" : "translate-x-0.5"
                        )} />
                      </button>
                      <span className="text-xs text-gray-500">{automation.isActive ? "Active" : "Inactive"}</span>

                      {/* Edit */}
                      <button
                        onClick={() => { setEditingAutomation(automation); setShowCreateForm(false); }}
                        className="text-gray-400 hover:text-indigo-500 p-1"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(automation)}
                        className="text-gray-400 hover:text-indigo-500 p-1"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(automation.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
