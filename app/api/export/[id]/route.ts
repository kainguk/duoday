import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveCouple } from "@/lib/repo";
import { buildOrderZipBuffer, type OrderRecord } from "@/lib/order-export";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const couple = getActiveCouple();
  const order = db
    .prepare(`SELECT * FROM book_orders WHERE id = ? AND couple_id = ?`)
    .get(params.id, couple.id) as OrderRecord | undefined;
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  const buf = await buildOrderZipBuffer(order, couple);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${order.id}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
