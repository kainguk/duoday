import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const Body = z.object({
  dqId: z.number().int().positive(),
  author: z.enum(["a", "b"]),
  body: z.string().trim().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { dqId, author, body } = parsed.data;
  db.prepare(
    `INSERT INTO answers (daily_question_id, author, body) VALUES (?,?,?)
     ON CONFLICT(daily_question_id, author) DO UPDATE SET body = excluded.body`
  ).run(dqId, author, body);
  return NextResponse.json({ ok: true });
}
