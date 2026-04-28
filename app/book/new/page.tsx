import BookForm from "@/components/BookForm";
import { db } from "@/lib/db";
import { getActiveCouple } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default function NewBookPage() {
  const couple = getActiveCouple();
  const earliest = (db
    .prepare(
      `SELECT MIN(d) as m FROM (
         SELECT date d FROM daily_questions WHERE couple_id = ?
         UNION SELECT date FROM date_logs WHERE couple_id = ?
       )`
    )
    .get(couple.id, couple.id) as { m: string | null }).m;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full space-y-0">
      <h1 className="h-display text-3xl text-blossom-800 mb-2">새 책 주문</h1>
      <p className="text-blossom-500 mb-6">
        선택한 기간의 질문 답변과 데이트 기록이 한 권으로 묶입니다. <br className="hidden sm:block" />
        주문 전에 <span className="text-blossom-700 font-medium">📖 미리보기</span>로 표지/내지/마지막 페이지를 확인할 수 있어요.
      </p>
      <div className="card p-6 md:p-8">
        <BookForm defaultStart={earliest ?? today} defaultEnd={today} />
      </div>
    </div>
  );
}
