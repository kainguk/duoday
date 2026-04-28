import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const Body = z.object({
  dqId: z.number().int().positive(),
  author: z.enum(["a", "b"]),
  actor: z.enum(["a", "b"]).optional(),
  body: z.string().trim().min(1).max(1000),
});
const DeleteBody = z.object({
  dqId: z.number().int().positive(),
  author: z.enum(["a", "b"]),
  actor: z.enum(["a", "b"]).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { dqId, author, body, actor } = parsed.data;
  if (actor && actor !== author) {
    return NextResponse.json({ error: "로그인한 사용자 답변만 작성할 수 있어요." }, { status: 403 });
  }
  db.prepare(
    `INSERT INTO answers (daily_question_id, author, body) VALUES (?,?,?)
     ON CONFLICT(daily_question_id, author) DO UPDATE SET body = excluded.body`
  ).run(dqId, author, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const parsed = DeleteBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { dqId, author, actor } = parsed.data;
  if (actor && actor !== author) {
    return NextResponse.json({ error: "로그인한 사용자 답변만 삭제할 수 있어요." }, { status: 403 });
  }
  db.prepare(`DELETE FROM answers WHERE daily_question_id = ? AND author = ?`).run(dqId, author);
  return NextResponse.json({ ok: true });
}
