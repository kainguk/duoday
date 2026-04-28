import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getActiveCouple, canTransition, type OrderStatus } from "@/lib/repo";

const Schema = z.object({
  status: z.enum(["pending", "processing", "completed", "cancelled"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const couple = getActiveCouple();
  const order = db
    .prepare(`SELECT id, status FROM book_orders WHERE id = ? AND couple_id = ?`)
    .get(params.id, couple.id) as { id: string; status: OrderStatus } | undefined;
  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const next = parsed.data.status;

  if (order.status === next) return NextResponse.json({ ok: true, status: next });
  if (!canTransition(order.status, next)) {
    return NextResponse.json(
      { error: `허용되지 않은 상태 전환입니다 (${order.status} → ${next})` },
      { status: 409 }
    );
  }
  db.prepare(`UPDATE book_orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
    next,
    order.id
  );
  return NextResponse.json({ ok: true, status: next });
}
