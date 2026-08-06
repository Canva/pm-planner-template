import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// monday.com webhook challenge verification + event handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // monday.com sends a challenge on webhook creation
    if (body.challenge) {
      return NextResponse.json({ challenge: body.challenge });
    }

    const event = body.event;
    if (!event) return NextResponse.json({ ok: true });

    const { type, pulseId, boardId } = event;

    if (type === "create_pulse" || type === "move_pulse_to_group") {
      const groupId = event.destGroupId || event.groupId;
      if (groupId?.toLowerCase() === "intake") {
        // New item in intake — sync it
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/monday/sync`, { method: "POST" });
      }
    }

    if (type === "change_column_value") {
      const { columnId, value } = event;
      // Update local task if it exists
      const task = await prisma.task.findUnique({ where: { mondayItemId: String(pulseId) } });
      if (task) {
        // Queue a re-sync for this item
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/monday/sync`, { method: "POST" });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
