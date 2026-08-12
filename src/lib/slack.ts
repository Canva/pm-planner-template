import { WebClient } from "@slack/web-api";
import type { WeeklySummary, CapacityCheck } from "@/types";
import { format } from "date-fns";

let slackClient: WebClient | null = null;

export function getSlackClient(token?: string): WebClient {
  const botToken = token || process.env.SLACK_BOT_TOKEN;
  if (!botToken) throw new Error("Slack bot token not configured");
  if (!slackClient) slackClient = new WebClient(botToken);
  return slackClient;
}

export async function sendSlackMessage(
  channel: string,
  text: string,
  blocks?: object[],
  token?: string
): Promise<void> {
  const client = getSlackClient(token);
  await client.chat.postMessage({
    channel,
    text,
    blocks: blocks as any,
  });
}

export async function sendNotification(
  channel: string,
  title: string,
  body: string,
  urgency: "info" | "warning" | "error" = "info",
  token?: string
): Promise<void> {
  const emoji = urgency === "error" ? ":red_circle:" : urgency === "warning" ? ":warning:" : ":white_check_mark:";

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji} *${title}*\n${body}`,
      },
    },
  ];

  await sendSlackMessage(channel, `${emoji} ${title}: ${body}`, blocks, token);
}

export function buildWeeklySummaryBlocks(
  summary: WeeklySummary,
  appUrl?: string,
  mondayBoardUrl?: string,
  teamName = "Lifecycle Team",
  workTypeLabels: Record<string, string> = {}
): object[] {
  const weekLabel = `${format(new Date(summary.weekStart), "MMM d")} – ${format(new Date(summary.weekEnd), "MMM d, yyyy")}`;

  const blocks: object[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📋 ${teamName} — Week of ${weekLabel}`,
        emoji: true,
      },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Active tasks:*\n${summary.activeTasks.length}` },
        { type: "mrkdwn", text: `*Due this week:*\n${summary.dueTasks.length}` },
        { type: "mrkdwn", text: `*Starting this week:*\n${summary.startingTasks.length}` },
        { type: "mrkdwn", text: `*Overdue:*\n${summary.overdueTasks.length > 0 ? `⚠️ ${summary.overdueTasks.length}` : "0"}` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Work Type Breakdown*\n${Object.entries(summary.workTypeBreakdown)
          .map(([key, count]) => `• ${workTypeLabels[key] ?? key}: ${count}`)
          .join("  ")}`,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: "*Team Assignments This Week*" },
    },
  ];

  // Member summaries
  for (const ms of summary.memberSummaries) {
    const taskNames = ms.tasks.slice(0, 3).map((t) => `• ${t.name}`).join("\n");
    const extra = ms.tasks.length > 3 ? `\n_+${ms.tasks.length - 3} more_` : "";
    const utilizationPct = ms.capacityTotal > 0
      ? Math.round((ms.capacityUsed / ms.capacityTotal) * 100)
      : 0;
    const overloaded = ms.capacityUsed > ms.capacityTotal;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${overloaded ? "🔴" : "🟢"} *${ms.member.name}* (${ms.member.role.replace("_", " ")})\n${taskNames || "_No tasks_"}${extra}\n_Capacity: ${utilizationPct}%_`,
      },
    });
  }

  // Capacity risks
  if (summary.capacityRisks.length > 0) {
    blocks.push({ type: "divider" });
    const riskText = summary.capacityRisks
      .map((r) => `⚠️ *${r.teamMember.name}*: Over capacity (${r.utilizationPercent}%)`)
      .join("\n");
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*⚠️ Capacity Risks*\n${riskText}` },
    });
  }

  // At-risk tasks
  if (summary.atRiskTasks.length > 0) {
    const riskTaskText = summary.atRiskTasks.slice(0, 5).map((t) => `• ${t.name}`).join("\n");
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*🚨 At-Risk Tasks*\n${riskTaskText}` },
    });
  }

  // Links
  const actions: object[] = [];
  if (appUrl) {
    actions.push({
      type: "button",
      text: { type: "plain_text", text: "Open Planner", emoji: true },
      url: appUrl,
    });
  }
  if (mondayBoardUrl) {
    actions.push({
      type: "button",
      text: { type: "plain_text", text: "Open monday.com", emoji: true },
      url: mondayBoardUrl,
    });
  }
  if (actions.length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({ type: "actions", elements: actions });
  }

  return blocks;
}
