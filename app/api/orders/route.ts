import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { getActiveCouple } from "@/lib/repo";

const Schema = z.object({
  title: z.string().trim().min(1).max(80),
  cover_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  range_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  range_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  include_questions: z.boolean(),
  include_dates: z.boolean(),
  note: z.string().max(500).optional().default(""),
});

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  if (d.range_start > d.range_end)
    return NextResponse.json({ error: "시작일이 종료일보다 늦습니다" }, { status: 400 });
  if (!d.include_questions && !d.include_dates)
    return NextResponse.json({ error: "최소 한 가지 콘텐츠는 포함되어야 합니다" }, { status: 400 });

  const couple = getActiveCouple();
  const id = "ORD-" + nanoid(8).toUpperCase();
  db.prepare(
    `INSERT INTO book_orders
     (id, couple_id, title, cover_color, range_start, range_end,
      include_questions, include_dates, note)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    couple.id,
    d.title,
    d.cover_color,
    d.range_start,
    d.range_end,
    d.include_questions ? 1 : 0,
    d.include_dates ? 1 : 0,
    d.note || null
  );
  return NextResponse.json({ id });
}
