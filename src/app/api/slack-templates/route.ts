import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS = [
  {
    key: "brief-internal",
    label: "New Brief Internal",
    content: `:thread: *Brief*
*Creatives/* :brand-copywriting:  :brand-design:  :localisation: :canva-in-review: *Owner/*
> :monday: Ticket
:docs: Brief
:slack: SH thread`,
  },
  {
    key: "brief-sh",
    label: "New Brief SH",
    content: `:thread: *Brief*

*Creatives/* :brand-copywriting:  :brand-design:  :localisation: :canva-in-review: *Owner/*

> :monday: Ticket

:docs: Brief

:slack: Marketer thread`,
  },
  {
    key: "monday-summary",
    label: "Monday Summary",
    content: `📅 Week of [date]

Team

Active briefs: 0`,
  },
];

/** Seed default templates if they don't exist yet. */
async function ensureDefaults() {
  for (const tpl of DEFAULTS) {
    await prisma.slackTemplate.upsert({
      where: { key: tpl.key },
      update: {},          // don't overwrite user edits
      create: tpl,
    });
  }
}

export async function GET() {
  try {
    await ensureDefaults();
    const templates = await prisma.slackTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(templates);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.label?.trim()) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    // Generate a unique key from the label
    const baseKey = body.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = await prisma.slackTemplate.findMany({ where: { key: { startsWith: baseKey } } });
    const key = existing.length === 0 ? baseKey : `${baseKey}-${Date.now()}`;

    const template = await prisma.slackTemplate.create({
      data: { key, label: body.label.trim(), content: body.content ?? "" },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { key, content } = await req.json();
    if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });
    const updated = await prisma.slackTemplate.update({
      where: { key },
      data: { content: content ?? "" },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { key } = await req.json();
    // Don't allow deleting the hardcoded defaults
    const isDefault = DEFAULTS.some((d) => d.key === key);
    if (isDefault) {
      return NextResponse.json({ error: "Default templates cannot be deleted" }, { status: 403 });
    }
    await prisma.slackTemplate.delete({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
