import Link from "next/link";
import { db } from "@/lib/db";
import { getActiveCouple } from "@/lib/repo";
import { fmtDateWithWeekday } from "@/lib/utils";
import { StatusChip } from "@/components/StatusChip";

export const dynamic = "force-dynamic";

export default function BookListPage() {
  const couple = getActiveCouple();
  const orders = db
    .prepare(
      `SELECT id, title, cover_color, range_start, range_end, status, created_at
       FROM book_orders WHERE couple_id = ? ORDER BY created_at DESC`
    )
    .all(couple.id) as {
    id: string;
    title: string;
    cover_color: string;
    range_start: string;
    range_end: string;
    status: string;
    created_at: string;
  }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="h-display text-3xl text-blossom-800">책 만들기</h1>
          <p className="text-blossom-500 mt-1 text-sm">
            우리의 기록을 한 권으로. (데모: 결제·배송·실제 인쇄는 포함되지 않음)
          </p>
        </div>
        <Link href="/book/new" className="btn-primary whitespace-nowrap self-start sm:self-auto">+ 새 책 주문</Link>
      </div>

      {orders.length === 0 ? (
        <div className="card p-10 text-center text-blossom-500">아직 만든 책이 없어요.</div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-5">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/book/${o.id}`} className="card p-5 flex gap-4 hover:border-blossom-300 transition">
                <div
                  className="w-20 h-28 rounded-md shrink-0 shadow-soft text-white h-display text-xs leading-tight p-2 flex items-center justify-center text-center"
                  style={{ background: o.cover_color }}
                >
                  <span className="line-clamp-4">{o.title}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blossom-500 mb-1">
                    {fmtDateWithWeekday(o.range_start)} ~ {fmtDateWithWeekday(o.range_end)}
                  </p>
                  <h3 className="h-display text-xl text-blossom-800 truncate">{o.title}</h3>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <StatusChip status={o.status} />
                    <span className="text-xs text-blossom-400">주문: {fmtDateWithWeekday(o.created_at)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
