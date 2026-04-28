import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveCouple } from "@/lib/repo";
import { fmtDate } from "@/lib/utils";
import { StatusChip } from "@/components/StatusChip";
import OrderActions from "@/components/OrderActions";

export const dynamic = "force-dynamic";

export default function BookDetail({ params }: { params: { id: string } }) {
  const couple = getActiveCouple();
  const order = db
    .prepare(`SELECT * FROM book_orders WHERE id = ? AND couple_id = ?`)
    .get(params.id, couple.id) as
    | {
        id: string;
        title: string;
        cover_color: string;
        range_start: string;
        range_end: string;
        include_questions: number;
        include_dates: number;
        status: string;
        note: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  if (!order) notFound();

  const sweetbookEnabled = ["1", "true", "yes"].includes(
    String(process.env.SWEETBOOK_ENABLED ?? "").toLowerCase()
  ) && !!process.env.SWEETBOOK_API_URL;

  const qPreview = order.include_questions
    ? (db
        .prepare(
          `SELECT dq.date, q.prompt
           FROM daily_questions dq JOIN questions q ON q.id = dq.question_id
           WHERE dq.couple_id = ? AND dq.date BETWEEN ? AND ?
           ORDER BY dq.date DESC LIMIT 5`
        )
        .all(couple.id, order.range_start, order.range_end) as { date: string; prompt: string }[])
    : [];
  const dPreview = order.include_dates
    ? (db
        .prepare(
          `SELECT date, title, place FROM date_logs
           WHERE couple_id = ? AND date BETWEEN ? AND ?
           ORDER BY date DESC LIMIT 5`
        )
        .all(couple.id, order.range_start, order.range_end) as { date: string; title: string; place: string }[])
    : [];

  const previewParams = new URLSearchParams({
    title: order.title,
    cover_color: order.cover_color,
    start: order.range_start,
    end: order.range_end,
    iq: order.include_questions ? "1" : "0",
    id: order.include_dates ? "1" : "0",
  }).toString();

  return (
    <div className="space-y-6">
      <Link href="/book" className="text-sm text-blossom-500">← 책 목록</Link>

      <div className="card p-6 md:p-8 flex flex-col sm:flex-row gap-6">
        <div
          className="w-32 h-44 rounded-md shadow-soft shrink-0 flex items-center justify-center text-white h-display text-lg p-3 text-center self-start"
          style={{ background: order.cover_color }}
        >
          {order.title}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blossom-500 mb-1">주문번호 {order.id}</p>
          <h1 className="h-display text-2xl md:text-3xl text-blossom-800">{order.title}</h1>
          <p className="text-sm text-blossom-600 mt-1">
            {fmtDate(order.range_start)} ~ {fmtDate(order.range_end)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip status={order.status} />
            {order.include_questions ? <span className="chip bg-blossom-100 text-blossom-700">질문 답변 포함</span> : null}
            {order.include_dates ? <span className="chip bg-blossom-100 text-blossom-700">데이트 기록 포함</span> : null}
          </div>
          {order.note && (
            <p className="mt-4 text-sm text-ink/70 whitespace-pre-wrap bg-blossom-50 rounded-xl p-3">
              📝 {order.note}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/book/preview?${previewParams}`} className="btn-ghost">📖 책 미리보기</Link>
            <OrderActions id={order.id} status={order.status} sweetbookEnabled={sweetbookEnabled} />
          </div>
          {sweetbookEnabled ? (
            <p className="mt-3 text-sm text-blossom-500">
              Sweetbook 연동이 활성화되어 있습니다. 주문을 ZIP으로 내보내거나 Sweetbook으로 직접 전송할 수 있습니다.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <PreviewCard
          title="포함될 질문 (최근 5개)"
          empty="이 기간에 포함될 질문 답변이 없어요."
          rows={qPreview.map((q) => ({ left: fmtDate(q.date), right: q.prompt }))}
        />
        <PreviewCard
          title="포함될 데이트 (최근 5개)"
          empty="이 기간에 포함될 데이트 기록이 없어요."
          rows={dPreview.map((d) => ({ left: fmtDate(d.date), right: `${d.title} · ${d.place}` }))}
        />
      </div>
    </div>
  );
}

function PreviewCard({ title, rows, empty }: { title: string; rows: { left: string; right: string }[]; empty: string }) {
  return (
    <div className="card p-5">
      <h3 className="h-display text-lg text-blossom-800 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-blossom-400 text-sm">{empty}</p>
      ) : (
        <ul className="divide-y divide-blossom-100 text-sm">
          {rows.map((r, i) => (
            <li key={i} className="py-2 flex gap-3">
              <span className="text-blossom-500 w-24 shrink-0">{r.left}</span>
              <span className="text-ink/80 truncate">{r.right}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
