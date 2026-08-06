"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { CheckCircle, Moon, Sun, Send, ExternalLink, Plus, Trash2, Globe, Building2, Pencil, X, Check, Shield, UserCircle, KeyRound } from "lucide-react";
import { useTheme } from "@/lib/use-theme";
import { format, parseISO } from "date-fns";
import type { Holiday, HolidayType, UserAccount, UserRole } from "@/types";

interface Settings {
  appTitle: string;
  mondayBoardId: string;
  mondayApiToken: string;
  slackBotToken: string;
  slackChannelId: string;
  weeklyCapacityDefault: number;
  weeklyHoursCapacity: number;
}

const defaults: Settings = {
  appTitle: "Lifecycle Planner",
  mondayBoardId: "",
  mondayApiToken: "",
  slackBotToken: "",
  slackChannelId: "",
  weeklyCapacityDefault: 5.0,
  weeklyHoursCapacity: 40,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const { dark, setDarkMode } = useTheme();

  // ── User Accounts (Access & Permissions) ─────────────────────────────────
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "VIEWER" as UserRole, teamMemberId: "" });
  const [savingUser, setSavingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserDraft, setEditUserDraft] = useState<{ name: string; email: string; role: UserRole; teamMemberId: string }>({ name: "", email: "", role: "USER", teamMemberId: "" });
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);

  // ── Set Password modal ────────────────────────────────────────────────────
  const [settingPasswordForId, setSettingPasswordForId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function loadUsers() {
    const data = await fetch("/api/auth/users").then((r) => r.json());
    if (Array.isArray(data)) setUserAccounts(data);
  }

  async function loadTeamMembers() {
    const data = await fetch("/api/team").then((r) => r.json());
    if (Array.isArray(data)) setTeamMembers(data);
  }

  async function addUser() {
    if (!newUser.name.trim() || !newUser.email.trim()) { setUserError("Name and email are required."); return; }
    setSavingUser(true); setUserError(null);
    const res = await fetch("/api/auth/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newUser, teamMemberId: newUser.teamMemberId || null }),
    });
    const data = await res.json();
    setSavingUser(false);
    if (!res.ok) { setUserError(data.error ?? "Failed to add user"); return; }
    setNewUser({ name: "", email: "", role: "USER", teamMemberId: "" });
    setShowAddUser(false);
    await loadUsers();
  }

  async function saveEditUser() {
    if (!editingUserId) return;
    await fetch("/api/auth/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingUserId, ...editUserDraft, teamMemberId: editUserDraft.teamMemberId || null }),
    });
    setEditingUserId(null);
    await loadUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm("Remove this user? They will lose access.")) return;
    await fetch("/api/auth/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await loadUsers();
  }

  function startEditUser(u: UserAccount) {
    setEditingUserId(u.id);
    setEditUserDraft({ name: u.name, email: u.email, role: u.role, teamMemberId: u.teamMemberId ?? "" });
  }

  function openSetPassword(userId: string) {
    setSettingPasswordForId(userId);
    setPasswordInput("");
    setPasswordError(null);
  }

  function closeSetPassword() {
    setSettingPasswordForId(null);
    setPasswordInput("");
    setPasswordError(null);
  }

  async function savePassword() {
    if (!settingPasswordForId || !passwordInput.trim()) return;
    setSavingPassword(true);
    setPasswordError(null);
    try {
      const res = await fetch("/api/auth/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: settingPasswordForId, plainPassword: passwordInput }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error ?? "Failed to set password");
      } else {
        closeSetPassword();
        await loadUsers();
      }
    } catch {
      setPasswordError("An error occurred. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  // ── Holiday state ─────────────────────────────────────────────────────────
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayEnd, setNewHolidayEnd] = useState("");
  const [newHolidayType, setNewHolidayType] = useState<HolidayType>("PUBLIC");
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editHolidayDraft, setEditHolidayDraft] = useState<{ name: string; date: string; endDate: string; type: HolidayType }>({ name: "", date: "", endDate: "", type: "PUBLIC" });

  async function loadHolidays() {
    const data = await fetch("/api/holidays").then((r) => r.json());
    if (Array.isArray(data)) setHolidays(data);
  }

  async function addHoliday() {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    setSavingHoliday(true);
    await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newHolidayName.trim(),
        date: newHolidayDate,
        endDate: newHolidayEnd || null,
        type: newHolidayType,
      }),
    });
    setSavingHoliday(false);
    setShowHolidayForm(false);
    setNewHolidayName("");
    setNewHolidayDate("");
    setNewHolidayEnd("");
    setNewHolidayType("PUBLIC");
    loadHolidays();
  }

  async function deleteHoliday(id: string) {
    await fetch("/api/holidays", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadHolidays();
  }

  function startEditHoliday(h: Holiday) {
    setEditingHolidayId(h.id);
    setEditHolidayDraft({
      name: h.name,
      date: h.date.slice(0, 10),
      endDate: h.endDate ? h.endDate.slice(0, 10) : "",
      type: h.type as HolidayType,
    });
  }

  async function saveEditHoliday() {
    if (!editingHolidayId || !editHolidayDraft.name.trim() || !editHolidayDraft.date) return;
    await fetch("/api/holidays", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingHolidayId,
        name: editHolidayDraft.name,
        date: editHolidayDraft.date,
        endDate: editHolidayDraft.endDate || null,
        type: editHolidayDraft.type,
      }),
    });
    setEditingHolidayId(null);
    loadHolidays();
  }

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setSettings({ ...defaults, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
    loadHolidays();
    loadUsers();
    loadTeamMembers();
  }, []);

  async function handleSave() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function sendTestNotification() {
    if (!settings.slackBotToken || !settings.slackChannelId) return;
    setTestStatus("sending");
    try {
      const res = await fetch("/api/slack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: settings.slackBotToken,
          channelId: settings.slackChannelId,
        }),
      });
      setTestStatus(res.ok ? "ok" : "error");
    } catch {
      setTestStatus("error");
    }
    setTimeout(() => setTestStatus("idle"), 4000);
  }

  function field(label: string, key: keyof Settings, type = "text", placeholder = "") {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={String(settings[key])}
          onChange={(e) => setSettings({ ...settings, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value })}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">
        {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
          <>
            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Branding</h2>
                <p className="text-xs text-gray-500 mt-0.5">Shown in the browser tab and in Slack notifications from this instance</p>
              </div>
              {field("Tool / Team Name", "appTitle", "text", "e.g. Localization Team Planner")}
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">monday.com Integration</h2>
                <p className="text-xs text-gray-500 mt-0.5">Connect to your monday.com board to sync intake tasks automatically</p>
              </div>
              {field("Board ID", "mondayBoardId", "text", "1234567890")}
              {field("API Token", "mondayApiToken", "password", "eyJ...")}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Webhook URL (configure in monday.com)</p>
                <code className="text-xs text-gray-500 break-all">
                  {typeof window !== "undefined" ? window.location.origin : "https://your-app.com"}/api/monday/webhook
                </code>
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Slack Notifications</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Post alerts and weekly summaries to a Slack channel via a bot token.
                </p>
              </div>

              {/* Setup steps */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-700">How to set up</p>
                <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                  <li>Go to <span className="font-medium text-gray-700">api.slack.com/apps</span> → Create New App → From scratch</li>
                  <li>Under <span className="font-medium text-gray-700">OAuth & Permissions</span>, add the scope <code className="bg-gray-200 rounded px-1">chat:write</code></li>
                  <li>Click <span className="font-medium text-gray-700">Install to Workspace</span> and copy the <span className="font-medium text-gray-700">Bot User OAuth Token</span> (starts with <code className="bg-gray-200 rounded px-1">xoxb-</code>)</li>
                  <li>Invite the bot to your target channel: <code className="bg-gray-200 rounded px-1">/invite @your-bot-name</code></li>
                  <li>Copy the channel ID from the channel URL or right-click → Copy link</li>
                </ol>
                <a
                  href="https://api.slack.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                >
                  Slack App dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bot Token</label>
                <input
                  type="password"
                  value={settings.slackBotToken}
                  onChange={(e) => setSettings({ ...settings, slackBotToken: e.target.value })}
                  placeholder="xoxb-..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Channel ID</label>
                <input
                  type="text"
                  value={settings.slackChannelId}
                  onChange={(e) => setSettings({ ...settings, slackChannelId: e.target.value })}
                  placeholder="C0123456789"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <p className="text-[11px] text-gray-400 mt-1">The channel ID (not name) — found in the channel URL or by right-clicking the channel → Copy link.</p>
              </div>

              {/* Test button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={sendTestNotification}
                  disabled={!settings.slackBotToken || !settings.slackChannelId || testStatus === "sending"}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3 h-3" />
                  {testStatus === "sending" ? "Sending…" : "Send test message"}
                </button>
                {testStatus === "ok" && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> Delivered to Slack
                  </span>
                )}
                {testStatus === "error" && (
                  <span className="text-xs text-red-500">Failed — check token and channel ID</span>
                )}
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Capacity Rules</h2>
                <p className="text-xs text-gray-500 mt-0.5">Default capacity settings applied across the team</p>
              </div>
              {field("Default Weekly Capacity (days)", "weeklyCapacityDefault", "number")}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Weekly Hours Cap <span className="text-gray-400 font-normal">(flag capacity when exceeded)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={settings.weeklyHoursCapacity}
                    onChange={(e) => setSettings({ ...settings, weeklyHoursCapacity: parseInt(e.target.value) || 40 })}
                    className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <span className="text-sm text-gray-500">hrs / week</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Team members exceeding this threshold will be flagged in the capacity view and weekly summary.
                </p>
              </div>
            </section>

            {/* ── Holidays & Closures ── */}
            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Holidays & Closures</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Public and company holidays shown on the calendar. Multi-day ranges supported.
                  </p>
                </div>
                <button
                  onClick={() => setShowHolidayForm((v) => !v)}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add Holiday
                </button>
              </div>

              {/* Add form */}
              {showHolidayForm && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Holiday name (e.g. Australia Day, Team offsite)"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* Type */}
                    <div className="flex border border-indigo-200 rounded-lg overflow-hidden bg-white">
                      {([["PUBLIC", "Public", Globe], ["COMPANY", "Company", Building2]] as [HolidayType, string, any][]).map(
                        ([val, label, Icon]) => (
                          <button
                            key={val}
                            onClick={() => setNewHolidayType(val)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                              newHolidayType === val
                                ? val === "PUBLIC" ? "bg-rose-500 text-white" : "bg-violet-500 text-white"
                                : "text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {label}
                          </button>
                        )
                      )}
                    </div>
                    {/* Start date */}
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide">Date</label>
                      <input
                        type="date"
                        value={newHolidayDate}
                        onChange={(e) => { setNewHolidayDate(e.target.value); if (!newHolidayEnd) setNewHolidayEnd(e.target.value); }}
                        className="border border-indigo-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                    {/* End date */}
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide">End (optional)</label>
                      <input
                        type="date"
                        value={newHolidayEnd}
                        onChange={(e) => setNewHolidayEnd(e.target.value)}
                        className="border border-indigo-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                    <button
                      onClick={addHoliday}
                      disabled={!newHolidayName.trim() || !newHolidayDate || savingHoliday}
                      className="ml-auto px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {savingHoliday ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              )}

              {/* Holiday list */}
              {holidays.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No holidays added yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {holidays.map((h) => (
                    editingHolidayId === h.id ? (
                      /* ── Inline edit form ── */
                      <div key={h.id} className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                        <input
                          type="text"
                          value={editHolidayDraft.name}
                          onChange={(e) => setEditHolidayDraft({ ...editHolidayDraft, name: e.target.value })}
                          className="w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <div className="flex gap-2 flex-wrap items-center">
                          <div className="flex border border-indigo-200 rounded-lg overflow-hidden bg-white">
                            {([["PUBLIC", "Public", Globe], ["COMPANY", "Company", Building2]] as [HolidayType, string, any][]).map(([val, label, Icon]) => (
                              <button key={val} onClick={() => setEditHolidayDraft({ ...editHolidayDraft, type: val })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${editHolidayDraft.type === val ? (val === "PUBLIC" ? "bg-rose-500 text-white" : "bg-violet-500 text-white") : "text-gray-500 hover:bg-gray-50"}`}>
                                <Icon className="w-3 h-3" />{label}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Date</label>
                            <input type="date" value={editHolidayDraft.date}
                              onChange={(e) => setEditHolidayDraft({ ...editHolidayDraft, date: e.target.value })}
                              className="border border-indigo-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                          </div>
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wide">End</label>
                            <input type="date" value={editHolidayDraft.endDate}
                              onChange={(e) => setEditHolidayDraft({ ...editHolidayDraft, endDate: e.target.value })}
                              className="border border-indigo-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                          </div>
                          <div className="ml-auto flex items-center gap-1.5">
                            <button onClick={() => setEditingHolidayId(null)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg bg-white">
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={saveEditHoliday}
                              className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── Display row ── */
                      <div key={h.id} className="group flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${h.type === "PUBLIC" ? "bg-rose-400" : "bg-violet-400"}`}
                          title={h.type === "PUBLIC" ? "Public holiday" : "Company holiday"}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
                          <p className="text-xs text-gray-400">
                            {format(parseISO(h.date), "d MMM yyyy")}
                            {h.endDate && h.endDate !== h.date && ` → ${format(parseISO(h.endDate), "d MMM yyyy")}`}
                            <span className={`ml-2 text-[10px] font-medium ${h.type === "PUBLIC" ? "text-rose-500" : "text-violet-500"}`}>
                              {h.type === "PUBLIC" ? "Public" : "Company"}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEditHoliday(h)} title="Edit holiday"
                            className="p-1 text-gray-300 hover:text-indigo-500 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteHoliday(h.id)} title="Delete holiday"
                            className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </section>

            {/* ── Access & Permissions ── */}
            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Access & Permissions</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage who can access the planner and what they can do</p>
                  </div>
                </div>
                <button onClick={() => { setShowAddUser((v) => !v); setUserError(null); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">
                  <Plus className="w-3 h-3" /> Add User
                </button>
              </div>

              {/* Role legend */}
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="font-semibold text-indigo-700 mb-0.5">ADMIN</p>
                  <p className="text-gray-500 leading-tight">Full access — all pages, all settings</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="font-semibold text-emerald-700 mb-0.5">USER</p>
                  <p className="text-gray-500 leading-tight">Can edit a brief's description/links — not timelines or assignees</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="font-semibold text-gray-700 mb-0.5">VIEWER</p>
                  <p className="text-gray-500 leading-tight">All planning pages — no admin settings</p>
                </div>
              </div>

              {/* Add user form */}
              {showAddUser && (
                <div className="border border-indigo-200 rounded-xl p-4 space-y-3 bg-indigo-50/30">
                  <p className="text-xs font-semibold text-gray-700">New User</p>
                  {userError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{userError}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Full name *" value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <input type="email" placeholder="Email *" value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                      <option value="VIEWER">Viewer</option>
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <select value={newUser.teamMemberId} onChange={(e) => setNewUser({ ...newUser, teamMemberId: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                      <option value="">Link to team member (optional)</option>
                      {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setShowAddUser(false); setUserError(null); }} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900">Cancel</button>
                    <button onClick={addUser} disabled={savingUser} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {savingUser ? "Adding…" : "Add User"}
                    </button>
                  </div>
                </div>
              )}

              {/* User list */}
              <div className="divide-y divide-gray-100">
                {userAccounts.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No user accounts yet. Add users above to restrict access.</p>
                ) : userAccounts.map((u) => (
                  <div key={u.id} className="py-2.5">
                    {editingUserId === u.id ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={editUserDraft.name}
                          onChange={(e) => setEditUserDraft({ ...editUserDraft, name: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                        <input type="email" value={editUserDraft.email}
                          onChange={(e) => setEditUserDraft({ ...editUserDraft, email: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                        <select value={editUserDraft.role} onChange={(e) => setEditUserDraft({ ...editUserDraft, role: e.target.value as UserRole })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none">
                          <option value="VIEWER">Viewer</option>
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <select value={editUserDraft.teamMemberId} onChange={(e) => setEditUserDraft({ ...editUserDraft, teamMemberId: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none">
                          <option value="">No team member link</option>
                          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <div className="col-span-2 flex gap-2 justify-end">
                          <button onClick={() => setEditingUserId(null)} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                          <button onClick={saveEditUser} className="p-1.5 text-emerald-500 hover:text-emerald-700"><Check className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${u.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                            {u.name[0]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}{u.teamMember ? ` · ${u.teamMember.name}` : ""}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                            {u.role}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${u.hasPassword ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                            title={u.hasPassword ? "Password set" : "No password"}
                          >
                            {u.hasPassword ? "pw set" : "no pw"}
                          </span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${u.isActive ? "bg-emerald-400" : "bg-gray-300"}`} title={u.isActive ? "Active" : "Inactive"} />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openSetPassword(u.id)}
                              title="Set password"
                              className="p-1 text-gray-300 hover:text-indigo-500 transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => startEditUser(u)} className="p-1 text-gray-300 hover:text-indigo-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteUser(u.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>

                        {/* Inline set-password modal */}
                        {settingPasswordForId === u.id && (
                          <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                            <p className="text-xs font-semibold text-gray-700">Set password for {u.name}</p>
                            {passwordError && (
                              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{passwordError}</p>
                            )}
                            <div className="flex gap-2">
                              <input
                                type="password"
                                placeholder="New password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") savePassword(); if (e.key === "Escape") closeSetPassword(); }}
                                autoFocus
                                className="flex-1 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              />
                              <button
                                onClick={closeSetPassword}
                                className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg bg-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={savePassword}
                                disabled={savingPassword || !passwordInput.trim()}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {savingPassword ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
                <p className="text-xs text-gray-500 mt-0.5">Customize how the planner looks for you</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Dark mode</p>
                  <p className="text-xs text-gray-400 mt-0.5">Switch between light and dark interface</p>
                </div>
                <button
                  onClick={() => setDarkMode(!dark)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                    dark ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                  aria-label="Toggle dark mode"
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                      dark ? "translate-x-8" : "translate-x-1"
                    }`}
                  >
                    {dark ? (
                      <Moon className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <Sun className="w-3 h-3 text-amber-500" />
                    )}
                  </span>
                </button>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                  <CheckCircle className="w-4 h-4" /> Saved
                </span>
              )}
              <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                Save Settings
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
