"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Plus, Trash2, ChevronUp, ChevronDown, Check, X } from "lucide-react";
import { usePhases, type PhaseConfigEntry } from "@/lib/phases-context";
import { cn } from "@/lib/utils";

// Fixed capacity choices, in hours per working day the phase is active.
// ASSIGNEE_SELECTED (-1) defers to whatever Full Day/Half Day/2 Hours the
// PM picked for that assignment in the brief's Assignee section, instead of
// a flat per-phase rate.
const ASSIGNEE_SELECTED = -1;
const CAPACITY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "0 hrs" },
  { value: 1, label: "1 hr" },
  { value: 2, label: "2 hrs" },
  { value: 4, label: "Half day" },
  { value: 8, label: "Full day" },
  { value: ASSIGNEE_SELECTED, label: "Based on assignee selection" },
];

function labelToKey(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function AdminPhasesPage() {
  const { reload: reloadContext } = usePhases();
  const [phases, setPhases] = useState<PhaseConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PhaseConfigEntry>>({});

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete warning state: key -> error message
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadPhases() {
    setLoading(true);
    const data = await fetch("/api/admin/phases").then((r) => r.json());
    if (Array.isArray(data)) setPhases(data);
    setLoading(false);
  }

  useEffect(() => { loadPhases(); }, []);

  async function movePhase(key: string, direction: "up" | "down") {
    const idx = phases.findIndex((p) => p.key === key);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= phases.length) return;

    const current = phases[idx];
    const swap = phases[swapIdx];

    // Optimistic update
    const updated = [...phases];
    updated[idx] = { ...current, sortOrder: swap.sortOrder };
    updated[swapIdx] = { ...swap, sortOrder: current.sortOrder };
    updated.sort((a, b) => a.sortOrder - b.sortOrder);
    setPhases(updated);

    await Promise.all([
      fetch(`/api/admin/phases/${current.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swap.sortOrder }),
      }),
      fetch(`/api/admin/phases/${swap.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);

    await loadPhases();
    reloadContext();
  }

  function startEdit(phase: PhaseConfigEntry) {
    setEditingId(phase.key);
    setEditDraft({
      label: phase.label,
      color: phase.color,
      estMin: phase.estMin,
      estMax: phase.estMax,
      supportsRoundTag: phase.supportsRoundTag,
    });
  }

  async function updateCapacity(key: string, capacityHoursPerDay: number) {
    setPhases((prev) => prev.map((p) => (p.key === key ? { ...p, capacityHoursPerDay } : p)));
    await fetch(`/api/admin/phases/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capacityHoursPerDay }),
    });
    reloadContext();
  }

  async function saveEdit(key: string) {
    await fetch(`/api/admin/phases/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    setEditingId(null);
    await loadPhases();
    reloadContext();
  }

  async function handleDelete(key: string) {
    setDeleting(key);
    setDeleteErrors((prev) => ({ ...prev, [key]: "" }));
    const res = await fetch(`/api/admin/phases/${key}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const data = await res.json();
      setDeleteErrors((prev) => ({
        ...prev,
        [key]: data.error === "Phase is in use"
          ? `Cannot delete — ${data.count} task phase record${data.count !== 1 ? "s" : ""} reference this phase.`
          : (data.error ?? "Failed to delete"),
      }));
      return;
    }
    await loadPhases();
    reloadContext();
  }

  async function handleAdd() {
    if (!newLabel.trim()) { setAddError("Name is required"); return; }
    const key = labelToKey(newLabel);
    if (!key) { setAddError("Cannot derive a valid key from that name"); return; }
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/admin/phases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label: newLabel.trim(), color: newColor }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error ?? "Failed to create phase");
      return;
    }
    setNewLabel("");
    setNewColor("#6366f1");
    setShowAdd(false);
    await loadPhases();
    reloadContext();
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Phases" />
      <div className="p-6 max-w-2xl space-y-6">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Phase Order</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage the phases used in task timelines and kanban board. Changes apply immediately.
                  </p>
                </div>
                <button
                  onClick={() => { setShowAdd((v) => !v); setAddError(null); }}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add Phase
                </button>
              </div>

              {/* Add form */}
              {showAdd && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-gray-700">New Phase</p>
                  {addError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{addError}</p>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Phase name…"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                      className="flex-1 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label className="text-xs text-gray-500">Color</label>
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-8 h-8 rounded border border-indigo-200 cursor-pointer"
                      />
                    </div>
                  </div>
                  {newLabel.trim() && (
                    <p className="text-[11px] text-gray-400">
                      Key: <code className="bg-gray-100 px-1 rounded">{labelToKey(newLabel)}</code>
                    </p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setShowAdd(false); setAddError(null); setNewLabel(""); }}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdd}
                      disabled={adding || !newLabel.trim()}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {adding ? "Adding…" : "Add Phase"}
                    </button>
                  </div>
                </div>
              )}

              {/* Phase list */}
              <div className="space-y-1">
                {phases.map((phase, idx) => (
                  <div key={phase.key}>
                    {editingId === phase.key ? (
                      /* ── Inline edit row ── */
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editDraft.color ?? phase.color}
                            onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })}
                            className="w-8 h-8 rounded border border-indigo-200 cursor-pointer shrink-0"
                          />
                          <input
                            autoFocus
                            type="text"
                            value={editDraft.label ?? ""}
                            onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(phase.key); if (e.key === "Escape") setEditingId(null); }}
                            className="flex-1 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Est. min</label>
                            <input
                              type="number"
                              min={0}
                              placeholder="—"
                              value={editDraft.estMin ?? ""}
                              onChange={(e) => setEditDraft({ ...editDraft, estMin: e.target.value === "" ? null : parseInt(e.target.value) })}
                              className="w-16 border border-indigo-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Est. max</label>
                            <input
                              type="number"
                              min={0}
                              placeholder="—"
                              value={editDraft.estMax ?? ""}
                              onChange={(e) => setEditDraft({ ...editDraft, estMax: e.target.value === "" ? null : parseInt(e.target.value) })}
                              className="w-16 border border-indigo-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            />
                          </div>
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editDraft.supportsRoundTag ?? false}
                              onChange={(e) => setEditDraft({ ...editDraft, supportsRoundTag: e.target.checked })}
                              className="accent-indigo-600"
                            />
                            Round tags (R1/R2/R3)
                          </label>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg bg-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => saveEdit(phase.key)}
                            className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Display row ── */
                      <div className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0 shrink-0">
                          <button
                            onClick={() => movePhase(phase.key, "up")}
                            disabled={idx === 0}
                            className="text-gray-300 hover:text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => movePhase(phase.key, "down")}
                            disabled={idx === phases.length - 1}
                            className="text-gray-300 hover:text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Color dot */}
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: phase.color }}
                        />

                        {/* Label + key tag */}
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => startEdit(phase)}
                            className="text-sm font-medium text-gray-900 hover:text-indigo-700 transition-colors text-left"
                            title="Click to edit"
                          >
                            {phase.label}
                          </button>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                            {phase.key}
                          </span>
                          {phase.supportsRoundTag && (
                            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                              R1/R2/R3
                            </span>
                          )}
                          {(phase.estMin !== null || phase.estMax !== null) && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              est.{" "}
                              {phase.estMin !== null ? phase.estMin : "?"}
                              {phase.estMax !== phase.estMin ? `–${phase.estMax ?? "+"}` : ""}
                              {" "}day{(phase.estMin ?? 1) !== 1 ? "s" : ""}
                            </span>
                          )}
                          <select
                            value={phase.capacityHoursPerDay}
                            onChange={(e) => updateCapacity(phase.key, parseFloat(e.target.value))}
                            title="Capacity contribution per working day"
                            className={cn(
                              "text-[10px] font-medium pl-1.5 pr-1 py-0.5 rounded-full shrink-0 border-none focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer",
                              phase.capacityHoursPerDay === 0
                                ? "bg-gray-100 text-gray-400"
                                : phase.capacityHoursPerDay === ASSIGNEE_SELECTED
                                ? "bg-indigo-50 text-indigo-600"
                                : "bg-emerald-50 text-emerald-600"
                            )}
                          >
                            {CAPACITY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(phase.key)}
                          disabled={deleting === phase.key}
                          title="Delete phase"
                          className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Inline delete error */}
                    {deleteErrors[phase.key] && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mt-1 ml-12">
                        {deleteErrors[phase.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {phases.length === 0 && !showAdd && (
                <p className="text-xs text-gray-400 text-center py-4">No phases configured.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
