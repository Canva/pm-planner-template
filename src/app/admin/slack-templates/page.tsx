"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CheckCircle, Save, RotateCcw, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlackEditor } from "@/components/ui/slack-editor";

interface SlackTemplate {
  key: string;
  label: string;
  content: string;
}

interface EditState {
  label: string;
  content: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
  dirty: boolean;
}

const DEFAULT_KEYS = ["brief-internal", "brief-sh"];

interface NewTemplateForm {
  label: string;
  content: string;
  saving: boolean;
  error: string | null;
}

export default function AdminSlackTemplatesPage() {
  const [templates, setTemplates] = useState<SlackTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<NewTemplateForm>({ label: "", content: "", saving: false, error: null });
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/slack-templates")
      .then((r) => r.json())
      .then((data: SlackTemplate[]) => {
        if (!Array.isArray(data)) return;
        setTemplates(data);
        const init: Record<string, EditState> = {};
        for (const tpl of data) {
          init[tpl.key] = { label: tpl.label, content: tpl.content, saving: false, saved: false, error: null, dirty: false };
        }
        setEdits(init);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function update(key: string, field: "label" | "content", value: string) {
    setEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value, dirty: true, saved: false, error: null },
    }));
  }

  function reset(key: string) {
    const original = templates.find((t) => t.key === key);
    if (!original) return;
    setEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], label: original.label, content: original.content, dirty: false, saved: false, error: null },
    }));
  }

  async function save(key: string) {
    const edit = edits[key];
    if (!edit) return;
    setEdits((prev) => ({ ...prev, [key]: { ...prev[key], saving: true, error: null } }));
    try {
      const res = await fetch(`/api/slack-templates/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: edit.label, content: edit.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      // Update the canonical snapshot so reset goes to the new saved state
      setTemplates((prev) => prev.map((t) => t.key === key ? { ...t, label: edit.label, content: edit.content } : t));
      setEdits((prev) => ({ ...prev, [key]: { ...prev[key], saving: false, saved: true, dirty: false } }));
      setTimeout(() => setEdits((prev) => ({ ...prev, [key]: { ...prev[key], saved: false } })), 2500);
    } catch (e: any) {
      setEdits((prev) => ({ ...prev, [key]: { ...prev[key], saving: false, error: e.message } }));
    }
  }

  function openNewForm() {
    setNewForm({ label: "", content: "", saving: false, error: null });
    setShowNewForm(true);
  }

  function cancelNewForm() {
    setShowNewForm(false);
    setNewForm({ label: "", content: "", saving: false, error: null });
  }

  async function createTemplate() {
    if (!newForm.label.trim()) {
      setNewForm((prev) => ({ ...prev, error: "Template name is required." }));
      return;
    }
    setNewForm((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const res = await fetch("/api/slack-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newForm.label.trim(), content: newForm.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      const created: SlackTemplate = data;
      setTemplates((prev) => [...prev, created]);
      setEdits((prev) => ({
        ...prev,
        [created.key]: { label: created.label, content: created.content, saving: false, saved: false, error: null, dirty: false },
      }));
      setShowNewForm(false);
      setNewForm({ label: "", content: "", saving: false, error: null });
    } catch (e: any) {
      setNewForm((prev) => ({ ...prev, saving: false, error: e.message }));
    }
  }

  async function deleteTemplate(key: string) {
    const tpl = templates.find((t) => t.key === key);
    if (!tpl) return;
    const confirmed = window.confirm(`Delete template "${tpl.label}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingKey(key);
    try {
      const res = await fetch("/api/slack-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setTemplates((prev) => prev.filter((t) => t.key !== key));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Slack Templates — Admin" />

      <div className="p-6 max-w-3xl space-y-6">
        {/* Header row with description and New Template button */}
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-gray-500">
            Edit the content of each Slack template below. Changes are saved per template and take effect immediately on the{" "}
            <a href="/slack-templates" className="text-indigo-600 hover:underline">Slack Templates</a> page.
          </p>
          <button
            onClick={openNewForm}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        {/* New template inline form */}
        {showNewForm && (
          <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">New Template</p>
              <button
                onClick={cancelNewForm}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Template name</p>
              <input
                value={newForm.label}
                onChange={(e) => setNewForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="e.g. Campaign Launch"
                className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Content</p>
              <SlackEditor
                value={newForm.content}
                onChange={(v) => setNewForm((prev) => ({ ...prev, content: v }))}
                minRows={6}
              />
            </div>

            {newForm.error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{newForm.error}</p>
            )}

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={cancelNewForm}
                className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createTemplate}
                disabled={newForm.saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newForm.saving ? "Creating…" : <><Plus className="w-3.5 h-3.5" /> Create</>}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-400">Loading templates…</div>
        ) : templates.length === 0 ? (
          <div className="text-sm text-gray-400">No templates found.</div>
        ) : (
          templates.map((tpl) => {
            const edit = edits[tpl.key];
            if (!edit) return null;
            const isDefault = DEFAULT_KEYS.includes(tpl.key);
            return (
              <div key={tpl.key} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Template name</p>
                    <input
                      value={edit.label}
                      onChange={(e) => update(tpl.key, "label", e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-5">
                    {!isDefault && (
                      <button
                        onClick={() => deleteTemplate(tpl.key)}
                        disabled={deletingKey === tpl.key}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingKey === tpl.key ? "Deleting…" : "Delete"}
                      </button>
                    )}
                    {edit.dirty && (
                      <button
                        onClick={() => reset(tpl.key)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                        title="Discard changes"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => save(tpl.key)}
                      disabled={!edit.dirty || edit.saving}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors",
                        edit.saved
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : edit.dirty
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      {edit.saved
                        ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
                        : edit.saving
                        ? "Saving…"
                        : <><Save className="w-3.5 h-3.5" /> Save</>}
                    </button>
                  </div>
                </div>

                {/* Content editor */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Content</p>
                  <SlackEditor
                    value={edit.content}
                    onChange={(v) => update(tpl.key, "content", v)}
                    minRows={6}
                  />
                </div>

                {/* Error */}
                {edit.error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{edit.error}</p>
                )}

                {/* Dirty indicator */}
                {edit.dirty && !edit.error && (
                  <p className="text-xs text-amber-600">Unsaved changes</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
