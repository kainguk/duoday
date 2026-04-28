import Link from "next/link";
import { db } from "@/lib/db";
import { getActiveCouple, getPrimaryPhoto } from "@/lib/repo";
import { fmtDateWithWeekday } from "@/lib/utils";
import { EmotionBadge, BestBadge } from "@/components/Badges";
import { Placeholder } from "@/components/Placeholder";

export const dynamic = "force-dynamic";

type SP = {
  title?: string;
  cover_color?: string;
  start?: string;
  end?: string;
  iq?: string;
  id?: string;
};

export default function BookPreviewPage({ searchParams }: { searchParams: SP }) {
  const couple = getActiveCouple();
  const title = searchParams.title?.trim() || "우리의 기록";
  const cover_color = /^#[0-9a-fA-F]{6}$/.test(searchParams.cover_color ?? "")
    ? (searchParams.cover_color as string)
    : "#e35c8a";
  const today = new Date().toISOString().slice(0, 10);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.start ?? "") ? searchParams.start! : "2000-01-01";
  const end = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.end ?? "") ? searchParams.end! : today;
  const iq = searchParams.iq !== "0";
  const includeDates = searchParams.id !== "0";

  const dates = includeDates
    ? (db
        .prepare(
          `SELECT id, date, place, title, feeling, photo_path, emotion_tag, is_best
           FROM date_logs WHERE couple_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC`
        )
        .all(couple.id, start, end) as {
        id: number;
        date: string;
        place: string;
        title: string;
        feeling: string;
        photo_path: string | null;
        emotion_tag: string | null;
        is_best: number;
      }[])
    : [];

  const questions = iq
    ? (db
        .prepare(
          `SELECT dq.id as dq_id, dq.date, q.prompt
           FROM daily_questions dq JOIN questions q ON q.id = dq.question_id
           WHERE dq.couple_id = ? AND dq.date BETWEEN ? AND ? ORDER BY dq.date ASC`
        )
        .all(couple.id, start, end) as { dq_id: number; date: string; prompt: string }[])
    : [];

  const totalRecords = dates.length + questions.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Link href="/book/new" className="text-sm text-blossom-500">← 주문 화면으로</Link>
          <h1 className="h-display text-3xl text-blossom-800 mt-1">책 미리보기</h1>
          <p className="text-blossom-500 text-sm">실제 책의 표지와 내지 구조를 시뮬레이션해 보여드려요.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* COVER */}
        <Page label="표지">
          <div
            className="aspect-[3/4] sm:aspect-[3/2] w-full rounded-xl shadow-soft flex items-center justify-center text-white p-8 sm:p-14 text-center"
            style={{ background: cover_color }}
          >
            <div>
              <p className="text-xs sm:text-sm tracking-widest opacity-80 mb-3">DUODAY · 우리 둘의 하루</p>
              <h2 className="h-display text-3xl sm:text-5xl mb-4">{title}</h2>
              <p className="opacity-90 text-sm sm:text-base">
                {couple.partner_a} <span className="opacity-60">&</span> {couple.partner_b}
              </p>
              <p className="mt-6 text-xs sm:text-sm opacity-80">
                {fmtDateWithWeekday(start)} ~ {fmtDateWithWeekday(end)}
              </p>
              <p className="mt-1 text-xs opacity-70">총 {totalRecords}개의 기록</p>
            </div>
          </div>
        </Page>

        {/* CONTENT PAGES */}
        {dates.length === 0 && questions.length === 0 ? (
          <Page label="내지">
            <div className="p-12 text-center text-blossom-500">이 기간에 표시할 기록이 없어요.</div>
          </Page>
        ) : (
          <>
            {dates.map((d, i) => (
              <Page key={`d-${d.id}`} label={`내지 ${i + 1} · 데이트 기록`}>
                <DatePage row={d} />
              </Page>
            ))}
            {questions.length > 0 && (
              <Page label={`내지 ${dates.length + 1} · 질문 답변 모음`}>
                <QuestionsPage items={questions} aName={couple.partner_a} bName={couple.partner_b} />
              </Page>
            )}
          </>
        )}

        {/* CLOSING */}
        <Page label="마지막 페이지">
          <div
            className="aspect-[3/4] sm:aspect-[3/2] w-full rounded-xl shadow-soft flex items-center justify-center bg-white border border-blossom-100 p-8 sm:p-14 text-center"
          >
            <div>
              <p className="h-display text-2xl sm:text-3xl text-blossom-800 mb-3">고마운 날들</p>
              <p className="text-ink/70 text-sm sm:text-base max-w-md mx-auto">
                {couple.partner_a}와 {couple.partner_b}가 함께한 {fmtDateWithWeekday(start)}부터 {fmtDateWithWeekday(end)}까지의
                기록 {totalRecords}편을 한 권에 담았습니다.
              </p>
              <p className="mt-6 text-xs text-blossom-400">made with 💗 by DuoDay</p>
            </div>
          </div>
        </Page>
      </div>
    </div>
  );
}

function Page({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs text-blossom-500 mb-2 ml-1">{label}</p>
      <div className="card overflow-hidden book-spread">{children}</div>
    </section>
  );
}

function DatePage({
  row,
}: {
  row: {
    id: number;
    date: string;
    place: string;
    title: string;
    feeling: string;
    photo_path: string | null;
    emotion_tag: string | null;
    is_best: number;
  };
}) {
  const photo = getPrimaryPhoto(row);
  return (
    <div className="grid sm:grid-cols-2 gap-0">
      <div className="aspect-[4/3] sm:aspect-auto sm:min-h-[260px] relative">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={row.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Placeholder label={row.title} />
        )}
        {row.is_best ? <div className="absolute top-3 left-3"><BestBadge /></div> : null}
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-blossom-500 mb-2">
          <span>{fmtDateWithWeekday(row.date)}</span>
          <span aria-hidden>·</span>
          <span>{row.place}</span>
          <EmotionBadge tag={row.emotion_tag} />
        </div>
        <h3 className="h-display text-xl sm:text-2xl text-blossom-800 mb-3">{row.title}</h3>
        <p className="text-ink/85 text-sm leading-relaxed whitespace-pre-wrap">{row.feeling}</p>
      </div>
    </div>
  );
}

function QuestionsPage({
  items,
  aName,
  bName,
}: {
  items: { dq_id: number; date: string; prompt: string }[];
  aName: string;
  bName: string;
}) {
  return (
    <div className="p-6 sm:p-8">
      <h3 className="h-display text-xl sm:text-2xl text-blossom-800 mb-4">우리의 질문 답변</h3>
      <ul className="space-y-4">
        {items.map((q) => {
          const ans = db
            .prepare(`SELECT author, body FROM answers WHERE daily_question_id = ?`)
            .all(q.dq_id) as { author: "a" | "b"; body: string }[];
          const a = ans.find((x) => x.author === "a");
          const b = ans.find((x) => x.author === "b");
          return (
            <li key={q.dq_id} className="border-b border-blossom-100 pb-3 last:border-0">
              <div className="text-xs text-blossom-500 mb-1">{fmtDateWithWeekday(q.date)}</div>
              <p className="text-ink/90 text-sm font-medium mb-2">Q. {q.prompt}</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <div className="bg-blossom-50 rounded-lg p-2">
                  <p className="text-xs text-blossom-500 mb-0.5">{aName}</p>
                  <p className="text-ink/80">{a?.body ?? <span className="text-blossom-400">미작성</span>}</p>
                </div>
                <div className="bg-blossom-50 rounded-lg p-2">
                  <p className="text-xs text-blossom-500 mb-0.5">{bName}</p>
                  <p className="text-ink/80">{b?.body ?? <span className="text-blossom-400">미작성</span>}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
