"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Copy, Check, Zap, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { WeeklySummary, Task, Squad, TeamMember, Holiday } from "@/types";
import { SlackEditor } from "@/components/ui/slack-editor";

interface SlackTemplate {
  key: string;
  label: string;
  content: string;
}

// Fallback defaults — used when the API is unavailable (e.g. stale server after schema change)
const FALLBACK_TEMPLATES: SlackTemplate[] = [
  {
    key: "brief-internal",
    label: "New Brief Internal",
    content: `:thread: *Brief*
*Creatives/* :brand-copywriting:  :brand-design:  :localisation: :canva-in-review: *Owner/*
> :monday: Ticket
:docs: Brief
:slack: SH thread`,
  },
  {
    key: "brief-sh",
    label: "New Brief SH",
    content: `:thread: *Brief*

*Creatives/* :brand-copywriting:  :brand-design:  :localisation: :canva-in-review: *Owner/*

> :monday: Ticket

:docs: Brief

:slack: Marketer thread`,
  },
];

const DEFAULT_KEYS = ["brief-internal", "brief-sh", "monday-summary"];

// ── Weekly summary text builder ───────────────────────────────────────────────

function buildMondaySummary(
  summary: WeeklySummary,
  squads: Squad[],
  members: TeamMember[],
  holidays: Holiday[],
): string {
  const wStart      = new Date(summary.weekStart);
  const wEnd        = new Date(summary.weekEnd);
  const activeTasks = summary.activeTasks ?? [];

  const weekStart = format(wStart, "MMM d");
  const weekEnd   = format(wEnd,   "MMM d, yyyy");

  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(`📅 Week of ${weekStart} – ${weekEnd}`);
  lines.push("");

  // ── Team section ──────────────────────────────────────────────────────────
  lines.push("Team");
  lines.push("");

  const teamEntries: string[] = [];

  // Holidays that overlap this week
  for (const h of holidays) {
    const hStart = new Date(h.date);
    const hEnd   = h.endDate ? new Date(h.endDate) : hStart;
    if (hStart <= wEnd && hEnd >= wStart) {
      teamEntries.push(`* ${h.name}`);
    }
  }

  // Members on leave this week
  for (const member of members) {
    const isOOO = (member.leaves ?? []).some((l) => {
      const ls = new Date(l.startDate);
      const le = new Date(l.endDate);
      return ls <= wEnd && le >= wStart;
    });
    if (isOOO) teamEntries.push(`* ${member.name} OOO`);
  }

  for (const entry of teamEntries) lines.push(entry);
  if (teamEntries.length > 0) lines.push("");

  // ── Active briefs count ───────────────────────────────────────────────────
  lines.push(`Active briefs: ${activeTasks.length}`);

  // ── Squad-grouped briefs ──────────────────────────────────────────────────
  // Build memberId → squad names map
  const memberSquadMap: Record<string, string[]> = {};
  for (const squad of squads) {
    for (const sm of squad.members) {
      if (!memberSquadMap[sm.teamMemberId]) memberSquadMap[sm.teamMemberId] = [];
      memberSquadMap[sm.teamMemberId].push(squad.name);
    }
  }

  // For each active task, find which squads are active this week
  const tasksBySquad: Record<string, Task[]> = {};
  for (const task of activeTasks) {
    // Only consider assignments that overlap with this week
    const weekAssignments = (task.assignments ?? []).filter((a) => {
      const aStart = new Date(a.startDate);
      const aEnd   = new Date(a.dueDate);
      return aStart <= wEnd && aEnd >= wStart;
    });

    const taskSquadNames = new Set<string>();
    for (const a of weekAssignments) {
      for (const squadName of (memberSquadMap[a.teamMemberId] ?? [])) {
        taskSquadNames.add(squadName);
      }
    }

    for (const squadName of taskSquadNames) {
      if (!tasksBySquad[squadName]) tasksBySquad[squadName] = [];
      if (!tasksBySquad[squadName].find((t) => t.id === task.id)) {
        tasksBySquad[squadName].push(task);
      }
    }
  }

  // Sort: Production last, everything else alphabetical
  const squadNames = Object.keys(tasksBySquad).sort((a, b) => {
    if (a.toLowerCase() === "production") return 1;
    if (b.toLowerCase() === "production") return -1;
    return a.localeCompare(b);
  });

  for (const squadName of squadNames) {
    lines.push(`${squadName}:`);
    lines.push("");
    for (const task of tasksBySquad[squadName]) {
      lines.push(`* ${task.name}`);
    }
    // No trailing blank after last bullet — squads run directly into each other
  }

  return lines.join("\n");
}

// ── Mrkdwn → HTML converter (for rich-text clipboard paste into Slack) ────────
//
// Slack's new compose box is a rich-text editor. Pasting plain text with *bold*
// markers inserts literal asterisks. Writing text/html to the ClipboardItem lets
// Slack convert <b>, <i>, <blockquote> to its internal rich-text format.

function inlineFormat(text: string): string {
  // Escape HTML entities first so we don't double-encode
  text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Bold: *text*  (non-greedy, won't span newlines)
  text = text.replace(/\*([^*\n]+)\*/g, "<b>$1</b>");
  // Italic: _text_
  text = text.replace(/_([^_\n]+)_/g, "<i>$1</i>");
  return text;
}

function mrkdwnToHtml(mrkdwn: string): string {
  const lines = mrkdwn.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("> ")) {
      // Collect consecutive blockquote lines
      const qLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        qLines.push(inlineFormat(lines[i].slice(2)));
        i++;
      }
      out.push(`<blockquote>${qLines.join("<br>")}</blockquote>`);
      continue;
    }

    if (line === "") {
      out.push("<br>");
    } else {
      out.push(`<p style="margin:0">${inlineFormat(line)}</p>`);
    }
    i++;
  }

  return `<meta charset="utf-8">${out.join("")}`;
}

async function copyRichText(plain: string): Promise<void> {
  // Prefer ClipboardItem (writes both text/plain + text/html) so that
  // Slack's rich-text compose box receives formatted content.
  if (typeof ClipboardItem !== "undefined") {
    const html = mrkdwnToHtml(plain);
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html":  new Blob([html],  { type: "text/html"  }),
      }),
    ]);
  } else {
    // Fallback for browsers that don't support ClipboardItem
    await navigator.clipboard.writeText(plain);
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface NewTemplateForm {
  label: string;
  content: string;
  saving: boolean;
  error: string | null;
}

function SlackTemplatesContent() {
  const searchParams = useSearchParams();
  const [templates, setTemplates]   = useState<SlackTemplate[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [text, setText]             = useState("");
  const [copied, setCopied]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<NewTemplateForm>({ label: "", content: "", saving: false, error: null });
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Load stored templates on mount; fall back to hardcoded defaults if API fails
  useEffect(() => {
    fetch("/api/slack-templates")
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) && data.length > 0 ? data : FALLBACK_TEMPLATES))
      .catch(() => setTemplates(FALLBACK_TEMPLATES));
  }, []);

  // Auto-select template from query param (e.g. ?t=monday-summary from dashboard)
  useEffect(() => {
    const t = searchParams.get("t");
    if (t && !selected) {
      selectTemplate(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function selectTemplate(key: string) {
    setSelected(key);
    setCopied(false);
    setFetchError(null);
    // Load stored content from DB for all templates (including monday-summary).
    // Use Fill to populate monday-summary with live data.
    const tpl = templates.find((t) => t.key === key);
    setText(tpl?.content ?? "");
  }

  async function fillMondaySummary() {
    setLoading(true);
    setFetchError(null);
    try {
      const [summaryRes, squadsRes, teamRes, holidaysRes] = await Promise.all([
        fetch(`/api/weekly-summary?week=${new Date().toISOString()}`),
        fetch("/api/squads"),
        fetch("/api/team"),
        fetch("/api/holidays"),
      ]);
      const [summary, squads, teamMembers, holidays] = await Promise.all([
        summaryRes.json(),
        squadsRes.json(),
        teamRes.json(),
        holidaysRes.json(),
      ]);
      if (summary.error) throw new Error(summary.error);
      const generated = buildMondaySummary(
        summary as WeeklySummary,
        Array.isArray(squads) ? squads : [],
        Array.isArray(teamMembers) ? teamMembers : [],
        Array.isArray(holidays) ? holidays : [],
      );
      setText(generated);
      // Persist so the last-filled version survives a page reload
      fetch("/api/slack-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "monday-summary", content: generated }),
      }).then((r) => r.json()).then((updated) => {
        if (updated.key) {
          setTemplates((prev) =>
            prev.map((t) => (t.key === "monday-summary" ? { ...t, content: updated.content } : t))
          );
        }
      }).catch(() => {});
    } catch (e: any) {
      setFetchError(e.message ?? "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!text) return;
    await copyRichText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
      setShowNewForm(false);
      setNewForm({ label: "", content: "", saving: false, error: null });
      // Auto-select the new template
      setSelected(created.key);
      setText(created.content);
      setCopied(false);
      setFetchError(null);
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
      // Deselect if the deleted template was selected
      if (selected === key) {
        setSelected(null);
        setText("");
        setFetchError(null);
      }
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    } finally {
      setDeletingKey(null);
    }
  }

  const hasContent = !!text && !loading;

  // All template tabs — monday-summary is now seeded into the DB like the rest
  const allTabs = [...templates];

  const isDeletableTab = (key: string) => !DEFAULT_KEYS.includes(key);

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Slack Templates" />

      <div className="p-6 flex-1 flex flex-col gap-5 max-w-3xl">
        {/* ── New template inline form ── */}
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
                className="w-full text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Content</p>
              <textarea
                value={newForm.content}
                onChange={(e) => setNewForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your template content…"
                rows={6}
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y font-mono"
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
                {newForm.saving ? "Saving…" : <><Check className="w-3.5 h-3.5" /> Save</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Template selector ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Choose a template</p>
            {!showNewForm && (
              <button
                onClick={openNewForm}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Template
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {allTabs.map(({ key, label }) => (
              <div key={key} className="relative flex items-center">
                <button
                  onClick={() => selectTemplate(key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                    isDeletableTab(key) ? "pr-8" : "",
                    selected === key
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700"
                  )}
                >
                  {label}
                </button>
                {isDeletableTab(key) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTemplate(key); }}
                    disabled={deletingKey === key}
                    className={cn(
                      "absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 rounded-full text-xs transition-colors disabled:opacity-50",
                      selected === key
                        ? "text-indigo-200 hover:text-white hover:bg-indigo-500"
                        : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    )}
                    title={`Delete "${label}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Template output ── */}
        {selected && (
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                {allTabs.find((t) => t.key === selected)?.label}
              </p>
              <div className="flex items-center gap-2">
                {selected === "monday-summary" && (
                  <button
                    onClick={fillMondaySummary}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
                  >
                    <Zap className={cn("w-3.5 h-3.5", loading && "animate-pulse")} />
                    {loading ? "Filling…" : "Fill"}
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  disabled={!hasContent}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    copied
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5" /> Copied!</>
                    : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center h-48 bg-white border border-gray-200 rounded-xl">
                <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            )}

            {fetchError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {fetchError}
              </div>
            )}

            {hasContent && (
              <>
                <SlackEditor
                  value={text}
                  onChange={setText}
                  minRows={12}
                />
                <p className="text-xs text-gray-400">Edit above before copying. Use the toolbar for Slack formatting.</p>
              </>
            )}
          </div>
        )}

        {!selected && (
          <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-400">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Copy className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Pick a template above</p>
            <p className="text-xs mt-1">The text will appear here ready to copy into Slack</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SlackTemplatesPage() {
  return (
    <Suspense fallback={<div className="flex flex-col flex-1" />}>
      <SlackTemplatesContent />
    </Suspense>
  );
}
