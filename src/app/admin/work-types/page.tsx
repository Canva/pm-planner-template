"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Plus, Trash2, ChevronUp, ChevronDown, Check, X, Lock } from "lucide-react";
import { useWorkTypes, type WorkTypeConfigEntry } from "@/lib/work-types-context";
import { isProtectedWorkType } from "@/types";

function labelToKey(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function AdminWorkTypesPage() {
  const { reload: reloadContext } = useWorkTypes();
  const [workTypes, setWorkTypes] = useState<WorkTypeConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<WorkTypeConfigEntry>>({});

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete warning state: key -> error message
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadWorkTypes() {
    setLoading(true);
    const data = await fetch("/api/admin/work-types").then((r) => r.json());
    if (Array.isArray(data)) setWorkTypes(data);
    setLoading(false);
  }

  useEffect(() => { loadWorkTypes(); }, []);

  async function moveWorkType(key: string, direction: "up" | "down") {
    const idx = workTypes.findIndex((w) => w.key === key);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= workTypes.length) return;

    const current = workTypes[idx];
    const swap = workTypes[swapIdx];

    // Optimistic update
    const updated = [...workTypes];
    updated[idx] = { ...current, sortOrder: swap.sortOrder };
    updated[swapIdx] = { ...swap, sortOrder: current.sortOrder };
    updated.sort((a, b) => a.sortOrder - b.sortOrder);
    setWorkTypes(updated);

    await Promise.all([
      fetch(`/api/admin/work-types/${current.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swap.sortOrder }),
      }),
      fetch(`/api/admin/work-types/${swap.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);

    await loadWorkTypes();
    reloadContext();
  }

  function startEdit(workType: WorkTypeConfigEntry) {
    setEditingId(workType.key);
    setEditDraft({ label: workType.label, color: workType.color });
  }

  async function saveEdit(key: string) {
    await fetch(`/api/admin/work-types/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    setEditingId(null);
    await loadWorkTypes();
    reloadContext();
  }

  async function handleDelete(key: string) {
    setDeleting(key);
    setDeleteErrors((prev) => ({ ...prev, [key]: "" }));
    const res = await fetch(`/api/admin/work-types/${key}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const data = await res.json();
      setDeleteErrors((prev) => ({
        ...prev,
        [key]: data.error === "Brief type is in use"
          ? `Cannot delete — ${data.count} brief${data.count !== 1 ? "s" : ""} use this type.`
          : (data.error ?? "Failed to delete"),
      }));
      return;
    }
    await loadWorkTypes();
    reloadContext();
  }

  async function handleAdd() {
    if (!newLabel.trim()) { setAddError("Name is required"); return; }
    const key = labelToKey(newLabel);
    if (!key) { setAddError("Cannot derive a valid key from that name"); return; }
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/admin/work-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label: newLabel.trim(), color: newColor }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error ?? "Failed to create brief type");
      return;
    }
    setNewLabel("");
    setNewColor("#6366f1");
    setShowAdd(false);
    await loadWorkTypes();
    reloadContext();
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Brief Types" />
      <div className="p-6 max-w-2xl space-y-6">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Brief Types</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Rename, recolor, reorder, add, or remove the types used to categorize briefs.
                    Changes apply immediately.{" "}
                    <span className="inline-flex items-center gap-0.5 text-gray-400">
                      <Lock className="w-3 h-3" /> BAU
                    </span>{" "}
                    is protected — it skips the phase pipeline everywhere else in the app, so it
                    can't be renamed, recolored, or deleted.
                  </p>
                </div>
                <button
                  onClick={() => { setShowAdd((v) => !v); setAddError(null); }}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add Brief Type
                </button>
              </div>

              {/* Add form */}
              {showAdd && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-gray-700">New Brief Type</p>
                  {addError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{addError}</p>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Brief type name…"
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
                      {adding ? "Adding…" : "Add Brief Type"}
                    </button>
                  </div>
                </div>
              )}

              {/* Brief type list */}
              <div className="space-y-1">
                {workTypes.map((workType, idx) => {
                  const locked = isProtectedWorkType(workType.key);
                  return (
                    <div key={workType.key}>
                      {editingId === workType.key ? (
                        /* ── Inline edit row ── */
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editDraft.color ?? workType.color}
                              onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })}
                              className="w-8 h-8 rounded border border-indigo-200 cursor-pointer shrink-0"
                            />
                            <input
                              autoFocus
                              type="text"
                              value={editDraft.label ?? ""}
                              onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(workType.key); if (e.key === "Escape") setEditingId(null); }}
                              className="flex-1 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg bg-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => saveEdit(workType.key)}
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
                              onClick={() => moveWorkType(workType.key, "up")}
                              disabled={idx === 0}
                              className="text-gray-300 hover:text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveWorkType(workType.key, "down")}
                              disabled={idx === workTypes.length - 1}
                              className="text-gray-300 hover:text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Color dot */}
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: workType.color }}
                          />

                          {/* Label + key tag */}
                          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                            {locked ? (
                              <span className="text-sm font-medium text-gray-500">{workType.label}</span>
                            ) : (
                              <button
                                onClick={() => startEdit(workType)}
                                className="text-sm font-medium text-gray-900 hover:text-indigo-700 transition-colors text-left"
                                title="Click to edit"
                              >
                                {workType.label}
                              </button>
                            )}
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                              {workType.key}
                            </span>
                            {locked && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                <Lock className="w-2.5 h-2.5" /> protected
                              </span>
                            )}
                          </div>

                          {/* Delete button */}
                          {!locked && (
                            <button
                              onClick={() => handleDelete(workType.key)}
                              disabled={deleting === workType.key}
                              title="Delete brief type"
                              className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Inline delete error */}
                      {deleteErrors[workType.key] && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5 mt-1 ml-12">
                          {deleteErrors[workType.key]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {workTypes.length === 0 && !showAdd && (
                <p className="text-xs text-gray-400 text-center py-4">No brief types configured.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
