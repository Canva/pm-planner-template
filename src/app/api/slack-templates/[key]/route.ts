import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await req.json();

    const updated = await prisma.slackTemplate.update({
      where: { key },
      data: {
        ...(body.label   !== undefined && { label:   body.label }),
        ...(body.content !== undefined && { content: body.content }),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
