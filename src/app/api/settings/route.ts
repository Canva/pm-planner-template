import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst();
    if (!settings) return NextResponse.json({});
    return NextResponse.json({
      appTitle: settings.appTitle ?? "Lifecycle Planner",
      mondayBoardId: settings.mondayBoardId ?? "",
      mondayApiToken: settings.mondayApiToken ? "***" : "",
      slackBotToken: settings.slackBotToken ? "***" : "",
      slackChannelId: settings.slackChannelId ?? "",
      weeklyCapacityDefault: settings.weeklyCapacityDefault,
      weeklyHoursCapacity: settings.weeklyHoursCapacity,
      notifEmail: settings.notifEmail,
      notifSlack: settings.notifSlack,
      notifOnIntake: settings.notifOnIntake,
      notifOnOverdue: settings.notifOnOverdue,
      notifOnAtRisk: settings.notifOnAtRisk,
      notifOnCapacity: settings.notifOnCapacity,
      notifOnAssigned: settings.notifOnAssigned,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = await prisma.appSettings.findFirst();

    const data: any = {
      appTitle: body.appTitle?.trim() || "Lifecycle Planner",
      mondayBoardId: body.mondayBoardId || null,
      slackChannelId: body.slackChannelId || null,
      weeklyCapacityDefault: body.weeklyCapacityDefault ?? 5.0,
      weeklyHoursCapacity: body.weeklyHoursCapacity ?? 40,
      ...(body.notifEmail !== undefined && { notifEmail: body.notifEmail }),
      ...(body.notifSlack !== undefined && { notifSlack: body.notifSlack }),
      ...(body.notifOnIntake !== undefined && { notifOnIntake: body.notifOnIntake }),
      ...(body.notifOnOverdue !== undefined && { notifOnOverdue: body.notifOnOverdue }),
      ...(body.notifOnAtRisk !== undefined && { notifOnAtRisk: body.notifOnAtRisk }),
      ...(body.notifOnCapacity !== undefined && { notifOnCapacity: body.notifOnCapacity }),
      ...(body.notifOnAssigned !== undefined && { notifOnAssigned: body.notifOnAssigned }),
    };

    // Only update tokens if user provided a real value (not masked ***)
    if (body.mondayApiToken && !body.mondayApiToken.includes("*")) {
      data.mondayApiToken = body.mondayApiToken;
    }
    if (body.slackBotToken && !body.slackBotToken.includes("*")) {
      data.slackBotToken = body.slackBotToken;
    }

    if (existing) {
      await prisma.appSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.appSettings.create({ data });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

export { POST as PATCH };
