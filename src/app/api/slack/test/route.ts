import { NextRequest, NextResponse } from "next/server";
import { sendSlackMessage } from "@/lib/slack";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { botToken, channelId } = await req.json();

    if (!botToken || !channelId) {
      return NextResponse.json({ error: "botToken and channelId are required" }, { status: 400 });
    }

    const settings = await prisma.appSettings.findFirst();
    const teamName = settings?.appTitle || "Lifecycle Planner";

    await sendSlackMessage(
      channelId,
      `:white_check_mark: ${teamName} is connected! Slack notifications are working.`,
      [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:white_check_mark: *${teamName} notifications are active.*\nYou'll receive alerts here when briefs are added, tasks go overdue, or the team hits capacity.`,
          },
        },
      ],
      botToken,
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Slack test error", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
