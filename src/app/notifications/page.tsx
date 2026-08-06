"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { Bell, Mail, MessageSquare, CheckCircle } from "lucide-react";

interface NotifSettings {
  notifEmail: boolean;
  notifSlack: boolean;
  notifOnIntake: boolean;
  notifOnOverdue: boolean;
  notifOnAtRisk: boolean;
  notifOnCapacity: boolean;
  notifOnAssigned: boolean;
  slackWebhookUrl?: string;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
        value ? "bg-indigo-600" : "bg-gray-200"
      )}
    >
      <span className={cn(
        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
        value ? "translate-x-4" : "translate-x-0.5"
      )} />
    </button>
  );
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotifSettings>({
    notifEmail: false,
    notifSlack: false,
    notifOnIntake: true,
    notifOnOverdue: true,
    notifOnAtRisk: true,
    notifOnCapacity: true,
    notifOnAssigned: true,
  });
  const [loading, setLoading] = useState(true);
  const [channelSaved, setChannelSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          notifEmail: data.notifEmail ?? false,
          notifSlack: data.notifSlack ?? false,
          notifOnIntake: data.notifOnIntake ?? true,
          notifOnOverdue: data.notifOnOverdue ?? true,
          notifOnAtRisk: data.notifOnAtRisk ?? true,
          notifOnCapacity: data.notifOnCapacity ?? true,
          notifOnAssigned: data.notifOnAssigned ?? true,
          slackWebhookUrl: data.slackWebhookUrl ?? "",
        });
        setLoading(false);
      });
  }, []);

  async function saveChannels() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifEmail: settings.notifEmail, notifSlack: settings.notifSlack }),
    });
    setChannelSaved(true);
    setTimeout(() => setChannelSaved(false), 2000);
  }

  async function savePrefs() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notifOnIntake: settings.notifOnIntake,
        notifOnOverdue: settings.notifOnOverdue,
        notifOnAtRisk: settings.notifOnAtRisk,
        notifOnCapacity: settings.notifOnCapacity,
        notifOnAssigned: settings.notifOnAssigned,
      }),
    });
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  function updateSetting<K extends keyof NotifSettings>(key: K, value: NotifSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <Topbar title="Notifications" />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const hasSlack = !!(settings.slackWebhookUrl);

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Notifications" />
      <div className="p-6 flex flex-col gap-6 max-w-2xl">

        {/* Channels card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Channels</h2>
          </div>
          <p className="text-xs text-gray-500">Choose where you want to receive automatic alerts when events occur</p>

          {/* Email */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email notifications</p>
                <p className="text-xs text-gray-400">Receive notifications via email</p>
              </div>
            </div>
            <Toggle value={settings.notifEmail} onChange={(v) => updateSetting("notifEmail", v)} />
          </div>

          {/* Slack */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Slack alerts</p>
                <p className="text-xs text-gray-400">
                  {hasSlack
                    ? "Sends automatic alerts to your Slack channel — no bot, no manual posting"
                    : "Requires an Incoming Webhook URL — configure in Admin → Settings"}
                </p>
              </div>
            </div>
            <Toggle
              value={settings.notifSlack}
              onChange={(v) => updateSetting("notifSlack", v)}
            />
          </div>

          {!hasSlack && settings.notifSlack && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
              No webhook URL set. Add one in{" "}
              <a href="/admin/settings" className="underline font-medium">Admin → Settings</a> under Slack Notifications.
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={saveChannels}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              {channelSaved && <CheckCircle className="w-4 h-4" />}
              {channelSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Notify me when card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Notify me when…</h2>
          </div>
          <p className="text-xs text-gray-500">Choose which events trigger a notification</p>

          {[
            { key: "notifOnIntake" as const, label: "New task added to intake", description: "When a new task lands in Intake" },
            { key: "notifOnOverdue" as const, label: "Task overdue", description: "When a task passes its due date" },
            { key: "notifOnAtRisk" as const, label: "Task at risk", description: "When a task is due within 3 days" },
            { key: "notifOnCapacity" as const, label: "Capacity overloaded", description: "When a team member exceeds their weekly capacity" },
            { key: "notifOnAssigned" as const, label: "Task assigned to me", description: "When a task is assigned to you" },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
              <Toggle value={settings[key] as boolean} onChange={(v) => updateSetting(key, v)} />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={savePrefs}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              {prefsSaved && <CheckCircle className="w-4 h-4" />}
              {prefsSaved ? "Saved" : "Save preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
