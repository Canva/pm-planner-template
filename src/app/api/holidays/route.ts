import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json(holidays);
  } catch (e) {
    console.error("GET /api/holidays", e);
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const holiday = await prisma.holiday.create({
      data: {
        name: body.name.trim(),
        date: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        type: body.type ?? "PUBLIC",
      },
    });
    return NextResponse.json(holiday, { status: 201 });
  } catch (e) {
    console.error("POST /api/holidays", e);
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, date, endDate, type } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });
    const updated = await prisma.holiday.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(type !== undefined && { type }),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/holidays", e);
    return NextResponse.json({ error: "Failed to update holiday" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/holidays", e);
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
  }
}
