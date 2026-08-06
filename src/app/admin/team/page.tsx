"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { formatRole, formatDate, cn } from "@/lib/utils";
import {
  Plus, Pencil, X, Check, CalendarOff, Trash2, AlertCircle, Users, ChevronUp, ChevronDown,
} from "lucide-react";
import type { TeamMember, Role, Leave, Squad } from "@/types";

const PRESET_ROLES: string[] = ["CREATIVE", "CONTENT_ADMIN", "COPYWRITER", "MANAGER", "PROGRAM_MANAGER"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SQUAD_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#f59e0b", "#10b981", "#14b8a6", "#0ea5e9", "#3b82f6",
];
const defaultForm = {
  name: "", email: "", role: "COPYWRITER",
  weeklyCapacity: 5.0, workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
};

// ── Member form ───────────────────────────────────────────────────────────────
function MemberForm({
  initial, onSave, onCancel,
}: {
  initial: typeof defaultForm;
  onSave: (data: typeof defaultForm) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: string) {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day],
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    setSaving(true);
    setError(null);
    const err = await onSave(form);
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {initial.name ? `Edit ${initial.name}` : "Add Team Member"}
      </h3>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Smith"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@company.com" type="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
          {/* Free-text with preset suggestions */}
          <input
            list="role-suggestions"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Creative, Copywriter, Strategist…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <datalist id="role-suggestions">
            {PRESET_ROLES.map((r) => <option key={r} value={r}>{formatRole(r)}</option>)}
          </datalist>
          <p className="text-[10px] text-gray-400 mt-0.5">Type a role or pick a suggestion</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Weekly Capacity (days)</label>
          <input type="number" min="0.5" max="7" step="0.5" value={form.weeklyCapacity}
            onChange={(e) => setForm({ ...form, weeklyCapacity: parseFloat(e.target.value) || 5 })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Working Days</label>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map((day) => (
            <button key={day} type="button" onClick={() => toggleDay(day)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                form.workingDays.includes(day)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
              {day}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving…" : initial.name ? "Save Changes" : "Add Member"}
        </button>
      </div>
    </div>
  );
}

// ── Leaves panel ─────────────────────────────────────────────────────────────
function LeavesPanel({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const [leaves, setLeaves] = useState<Leave[]>(member.leaves ?? []);
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "", isHalfDay: false });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [editLeaveDraft, setEditLeaveDraft] = useState({ startDate: "", endDate: "", reason: "", isHalfDay: false });

  async function handleAdd() {
    if (!form.startDate || !form.endDate) { setError("Start and end dates are required."); return; }
    if (form.endDate < form.startDate) { setError("End date must be after start date."); return; }
    setAdding(true);
    setError(null);
    const res = await fetch(`/api/team/${member.id}/leaves`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to add leave"); setAdding(false); return; }
    setLeaves((l) => [...l, data]);
    setForm({ startDate: "", endDate: "", reason: "", isHalfDay: false });
    setAdding(false);
  }

  async function handleDelete(leaveId: string) {
    await fetch(`/api/team/${member.id}/leaves`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leaveId }),
    });
    setLeaves((l) => l.filter((lv) => lv.id !== leaveId));
  }

  function startEditLeave(lv: Leave) {
    setEditingLeaveId(lv.id);
    setEditLeaveDraft({
      startDate: lv.startDate.slice(0, 10),
      endDate: lv.endDate.slice(0, 10),
      reason: lv.reason ?? "",
      isHalfDay: lv.isHalfDay,
    });
  }

  async function saveEditLeave() {
    if (!editingLeaveId) return;
    const res = await fetch(`/api/team/${member.id}/leaves`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveId: editingLeaveId, ...editLeaveDraft }),
    });
    const updated = await res.json();
    if (res.ok) {
      setLeaves((l) => l.map((lv) => lv.id === editingLeaveId ? updated : lv));
      setEditingLeaveId(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Leave & OOO</h2>
            <p className="text-xs text-gray-500 mt-0.5">{member.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {leaves.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No leave periods recorded</p>
          ) : (
            <div className="space-y-2">
              {leaves.map((lv) => (
                editingLeaveId === lv.id ? (
                  /* ── Inline edit ── */
                  <div key={lv.id} className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2.5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Start</label>
                        <input type="date" value={editLeaveDraft.startDate}
                          onChange={(e) => setEditLeaveDraft({ ...editLeaveDraft, startDate: e.target.value })}
                          className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">End</label>
                        <input type="date" value={editLeaveDraft.endDate}
                          onChange={(e) => setEditLeaveDraft({ ...editLeaveDraft, endDate: e.target.value })}
                          className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                    </div>
                    <input value={editLeaveDraft.reason}
                      onChange={(e) => setEditLeaveDraft({ ...editLeaveDraft, reason: e.target.value })}
                      placeholder="Reason (optional)"
                      className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    {editLeaveDraft.startDate === editLeaveDraft.endDate && editLeaveDraft.startDate && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editLeaveDraft.isHalfDay}
                          onChange={(e) => setEditLeaveDraft({ ...editLeaveDraft, isHalfDay: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-indigo-600"
                        />
                        <span className="text-xs text-gray-600">Half day</span>
                      </label>
                    )}
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingLeaveId(null)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button onClick={saveEditLeave}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display row ── */
                  <div key={lv.id} className="group flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-gray-700">
                          {formatDate(lv.startDate, "MMM d")} – {formatDate(lv.endDate, "MMM d, yyyy")}
                        </p>
                        {lv.isHalfDay && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">½ day</span>
                        )}
                      </div>
                      {lv.reason && <p className="text-xs text-gray-400 mt-0.5">{lv.reason}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      <button onClick={() => startEditLeave(lv)} title="Edit" className="text-gray-300 hover:text-indigo-500">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(lv.id)} title="Delete" className="text-gray-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-700">Add leave period</p>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-3 h-3 shrink-0" /> {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            {form.startDate && form.startDate === form.endDate && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isHalfDay}
                  onChange={(e) => setForm({ ...form, isHalfDay: e.target.checked })}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-gray-700">Half day</span>
              </label>
            )}
            <button onClick={handleAdd} disabled={adding}
              className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {adding ? "Adding…" : "Add Leave"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Squad form ────────────────────────────────────────────────────────────────
function SquadForm({
  initial,
  members,
  onSave,
  onCancel,
}: {
  initial: { name: string; color: string; memberIds: string[] };
  members: TeamMember[];
  onSave: (data: { name: string; color: string; memberIds: string[] }) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleMember(id: string) {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter((m) => m !== id)
        : [...f.memberIds, id],
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("Squad name is required."); return; }
    setSaving(true);
    setError(null);
    const err = await onSave(form);
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {initial.name ? `Edit "${initial.name}"` : "New Squad"}
      </h3>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Squad name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Creatives, Copy Squad"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Colour</label>
        <div className="flex gap-2 flex-wrap">
          {SQUAD_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-all",
                form.color === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Members <span className="text-gray-400 font-normal">({form.memberIds.length} selected)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {members.filter((m) => m.isActive).map((m) => {
            const selected = form.memberIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors",
                  selected
                    ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: selected ? form.color : "#d1d5db" }}
                />
                <span className="truncate text-xs font-medium">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
        <button onClick={handleSubmit} disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving…" : initial.name ? "Save Changes" : "Create Squad"}
        </button>
      </div>
    </div>
  );
}

// ── Squads section ────────────────────────────────────────────────────────────
function SquadsSection({ members }: { members: TeamMember[] }) {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { loadSquads(); }, []);

  async function loadSquads() {
    setLoading(true);
    const res = await fetch("/api/squads");
    const data = await res.json();
    setSquads(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleCreate(form: { name: string; color: string; memberIds: string[] }): Promise<string | null> {
    const sortOrder = squads.length; // append to end
    const res = await fetch("/api/squads", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, sortOrder }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Failed to create squad";
    setSquads((s) => [...s, data]);
    setShowAddForm(false);
    return null;
  }

  async function handleReorder(index: number, dir: -1 | 1) {
    const newSquads = [...squads];
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= newSquads.length) return;
    // Swap positions
    [newSquads[index], newSquads[swapIdx]] = [newSquads[swapIdx], newSquads[index]];
    // Assign sequential sortOrders
    const updated = newSquads.map((sq, i) => ({ ...sq, sortOrder: i }));
    setSquads(updated);
    // Persist both changed squads
    await Promise.all([
      fetch(`/api/squads/${updated[index].id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: updated[index].sortOrder }),
      }),
      fetch(`/api/squads/${updated[swapIdx].id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: updated[swapIdx].sortOrder }),
      }),
    ]);
  }

  async function handleEdit(form: { name: string; color: string; memberIds: string[] }): Promise<string | null> {
    if (!editingSquad) return null;
    const res = await fetch(`/api/squads/${editingSquad.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Failed to update squad";
    setSquads((s) => s.map((sq) => sq.id === editingSquad.id ? data : sq));
    setEditingSquad(null);
    return null;
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/squads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSquads((s) => s.filter((sq) => sq.id !== id));
      setConfirmDelete(null);
    } else {
      setError("Failed to delete squad");
    }
  }

  const defaultSquadForm = { name: "", color: "#6366f1", memberIds: [] as string[] };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Squads</h2>
          <span className="text-xs text-gray-400">Group members for quick filtering in Views</span>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingSquad(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-3.5 h-3.5" /> Add Squad
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {showAddForm && !editingSquad && (
        <SquadForm
          initial={defaultSquadForm}
          members={members}
          onSave={handleCreate}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingSquad && (
        <SquadForm
          initial={{
            name: editingSquad.name,
            color: editingSquad.color,
            memberIds: editingSquad.members.map((m) => m.teamMemberId),
          }}
          members={members}
          onSave={handleEdit}
          onCancel={() => setEditingSquad(null)}
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-4 text-center">Loading squads…</p>
      ) : squads.length === 0 && !showAddForm ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No squads yet</p>
          <p className="text-xs text-gray-300 mt-1">Create a squad to filter Views by group</p>
        </div>
      ) : (
        <div className="space-y-2">
          {squads.map((squad, idx) => {
            const squadMembers = squad.members
              .map((m) => members.find((mb) => mb.id === m.teamMemberId))
              .filter(Boolean) as TeamMember[];
            const isDeleting = confirmDelete === squad.id;

            return (
              <div key={squad.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
                {/* Reorder arrows */}
                <div className="flex flex-col gap-0.5 shrink-0 justify-center">
                  <button
                    onClick={() => handleReorder(idx, -1)}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleReorder(idx, 1)}
                    disabled={idx === squads.length - 1}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: squad.color }} />
                    <p className="text-sm font-semibold text-gray-900 truncate">{squad.name}</p>
                    <span className="text-xs text-gray-400 shrink-0">
                      {squadMembers.length} member{squadMembers.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingSquad(squad); setShowAddForm(false); }}
                      className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(squad.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Member avatars */}
                {squadMembers.length > 0 ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {squadMembers.map((m) => (
                      <div
                        key={m.id}
                        title={m.name}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                        style={{ backgroundColor: squad.color }}
                      >
                        {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No members assigned</p>
                )}

                {/* Delete confirmation */}
                {isDeleting && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <p className="text-xs text-red-600">Delete this squad?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      <button onClick={() => handleDelete(squad.id)} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded">Delete</button>
                    </div>
                  </div>
                )}
                </div> {/* end flex-1 */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [leaveMember, setLeaveMember] = useState<TeamMember | null>(null);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/team");
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to load team"); setLoading(false); return; }
    setMembers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleAdd(form: typeof defaultForm): Promise<string | null> {
    const res = await fetch("/api/team", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Failed to create member";
    setMembers((m) => [...m, data].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddForm(false);
    return null;
  }

  async function handleEdit(form: typeof defaultForm): Promise<string | null> {
    if (!editingMember) return null;
    const res = await fetch(`/api/team/${editingMember.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Failed to update member";
    setMembers((m) => m.map((mb) => mb.id === editingMember.id ? { ...mb, ...data } : mb));
    setEditingMember(null);
    return null;
  }

  async function toggleActive(member: TeamMember) {
    const res = await fetch(`/api/team/${member.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    if (res.ok) setMembers((m) => m.map((mb) => mb.id === member.id ? { ...mb, isActive: !mb.isActive } : mb));
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Team Management"
        actions={
          <button onClick={() => { setShowAddForm(true); setEditingMember(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        }
      />

      <div className="p-6 space-y-6 flex-1">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {showAddForm && !editingMember && (
          <MemberForm initial={defaultForm} onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
        )}
        {editingMember && (
          <MemberForm
            initial={{
              name: editingMember.name, email: editingMember.email, role: editingMember.role as string,
              weeklyCapacity: editingMember.weeklyCapacity, workingDays: editingMember.workingDays as string[],
            }}
            onSave={handleEdit}
            onCancel={() => setEditingMember(null)}
          />
        )}

        {/* Members table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Member", "Role", "Capacity", "Working Days", "Leave", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Loading…</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No team members yet</td></tr>
              ) : members.map((member) => (
                <tr key={member.id} className={cn("hover:bg-gray-50 transition-colors", !member.isActive && "opacity-50")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={member.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatRole(member.role)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.weeklyCapacity}d/wk</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(member.workingDays as string[]).map((d) => (
                        <span key={d} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{d}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setLeaveMember(member)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                      <CalendarOff className="w-3.5 h-3.5" />
                      {(member.leaves?.length ?? 0) > 0
                        ? <span className="text-indigo-600 font-medium">{member.leaves!.length} period{member.leaves!.length !== 1 ? "s" : ""}</span>
                        : "Add"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                      member.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditingMember(member); setShowAddForm(false); }}
                        className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border transition-colors",
                          editingMember?.id === member.id
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-600")}>
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => toggleActive(member)}
                        className={cn("text-xs px-2 py-1 rounded-lg border transition-colors",
                          member.isActive
                            ? "border-gray-200 text-amber-600 hover:bg-amber-50"
                            : "border-gray-200 text-emerald-600 hover:bg-emerald-50")}>
                        {member.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Squads section */}
        <div className="border-t border-gray-100 pt-6">
          <SquadsSection members={members} />
        </div>
      </div>

      {leaveMember && (
        <LeavesPanel member={leaveMember} onClose={() => { setLeaveMember(null); loadMembers(); }} />
      )}
    </div>
  );
}
