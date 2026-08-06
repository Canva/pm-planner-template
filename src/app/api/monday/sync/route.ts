import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIntakeItems, parseMondayItem } from "@/lib/monday";

export async function POST(_req: NextRequest) {
  try {
    const settings = await prisma.appSettings.findFirst();
    if (!settings?.mondayBoardId || !settings?.mondayApiToken) {
      return NextResponse.json({ error: "monday.com not configured" }, { status: 400 });
    }

    const items = await getIntakeItems(settings.mondayBoardId, settings.mondayApiToken);
    const results = { created: 0, updated: 0, errors: 0 };

    for (const item of items) {
      try {
        const parsed = parseMondayItem(item);
        const existing = await prisma.task.findUnique({ where: { mondayItemId: item.id } });

        if (existing) {
          await prisma.task.update({
            where: { mondayItemId: item.id },
            data: {
              name: parsed.name ?? existing.name,
              status: parsed.status ?? existing.status,
              effort: parsed.effort ?? existing.effort,
              dueDate: parsed.dueDate ? new Date(parsed.dueDate) : existing.dueDate,
              mondayUpdates: parsed.mondayUpdates ? (parsed.mondayUpdates as any) : existing.mondayUpdates,
            },
          });
          results.updated++;
        } else {
          const task = await prisma.task.create({
            data: {
              mondayItemId: item.id,
              mondayBoardId: settings.mondayBoardId!,
              name: parsed.name ?? item.name,
              status: parsed.status ?? "INTAKE",
              effort: parsed.effort ?? 2,
              workType: "TASK",
              dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
              mondayLink: `https://monday.com/boards/${settings.mondayBoardId}/pulses/${item.id}`,
              mondayUpdates: parsed.mondayUpdates ? (parsed.mondayUpdates as any) : undefined,
              isInIntake: true,
            },
          });

          await prisma.notification.create({
            data: {
              type: "NEW_INTAKE",
              title: "New intake task from monday.com",
              body: `"${task.name}" has been synced to your intake queue`,
              taskId: task.id,
            },
          });
          results.created++;
        }
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({ synced: true, ...results });
  } catch (e) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
