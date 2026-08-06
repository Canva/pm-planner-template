import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSlackMessage, buildWeeklySummaryBlocks } from "@/lib/slack";
import type { WeeklySummary } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { summary }: { summary: WeeklySummary } = await req.json();

    const settings = await prisma.appSettings.findFirst();
    if (!settings?.slackBotToken || !settings?.slackChannelId) {
      return NextResponse.json({ error: "Slack not configured" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const mondayBoardUrl = settings.mondayBoardId
      ? `https://monday.com/boards/${settings.mondayBoardId}`
      : undefined;

    const teamName = settings.appTitle || "Lifecycle Team";
    const blocks = buildWeeklySummaryBlocks(summary, appUrl, mondayBoardUrl, teamName);
    const text = `${teamName} Weekly Summary — ${new Date(summary.weekStart).toLocaleDateString()}`;

    await sendSlackMessage(settings.slackChannelId, text, blocks, settings.slackBotToken);

    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send Slack message" }, { status: 500 });
  }
}
