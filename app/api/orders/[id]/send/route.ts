import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveCouple } from "@/lib/repo";
import { sendOrderToSweetbook } from "@/lib/sweetbook";
import type { OrderRecord } from "@/lib/order-export";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const couple = getActiveCouple();
  const order = db
    .prepare(`SELECT * FROM book_orders WHERE id = ? AND couple_id = ?`)
    .get(params.id, couple.id) as OrderRecord | undefined;
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const result = await sendOrderToSweetbook(order, couple);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sweetbook 전송 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
