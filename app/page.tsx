import Link from "next/link";
import { getActiveCouple, getOrAssignTodayQuestion } from "@/lib/repo";
import { todayISO, fmtDate } from "@/lib/utils";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const couple = getActiveCouple();
  const q = getOrAssignTodayQuestion(couple.id, todayISO());

  const answeredTogetherCount = (db
    .prepare(
      `SELECT COUNT(*) c
       FROM (
         SELECT a.daily_question_id
         FROM answers a
         JOIN (
           SELECT id
           FROM daily_questions
           WHERE couple_id = ?
           ORDER BY date DESC, id DESC
           LIMIT 8
         ) latest ON latest.id = a.daily_question_id
         GROUP BY a.daily_question_id
         HAVING COUNT(DISTINCT a.author) = 2
       ) done`
    )
    .get(couple.id) as { c: number }).c;
  const datesCount = (db
    .prepare("SELECT COUNT(*) c FROM date_logs WHERE couple_id = ?")
    .get(couple.id) as { c: number }).c;
  const bestCount = (db
    .prepare("SELECT COUNT(*) c FROM date_logs WHERE couple_id = ? AND is_best = 1")
    .get(couple.id) as { c: number }).c;

  return (
    <div className="space-y-10">
      <section className="card p-8 md:p-12 text-center">
        <p className="text-blossom-500 text-sm tracking-widest mb-3">
          D+{Math.floor((Date.now() - new Date(couple.started_on).getTime()) / 86400000)} ·{" "}
          {couple.partner_a} & {couple.partner_b}
        </p>
        <h1 className="h-display text-4xl md:text-5xl text-blossom-800 mb-4">
          오늘 우리, 어떤 하루를 보냈어?
        </h1>
        <p className="text-blossom-700/80 max-w-xl mx-auto">
          매일 한 가지 질문에 둘이 답하고, 함께한 데이트를 타임라인으로 쌓아가요.
          쌓인 이야기는 한 권의 책으로 남길 수 있어요.
        </p>
        <div className="mt-7 flex flex-wrap gap-3 justify-center">
          <Link className="btn-primary" href="/today">오늘의 질문 답하기</Link>
          <Link className="btn-ghost" href="/dates/new">데이트 기록하기</Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <Stat label="함께 답변한 질문" value={answeredTogetherCount} suffix="개" href="/today" />
        <Stat label="기록한 데이트" value={datesCount} suffix="번" href="/dates" />
        <Stat label="베스트 순간" value={bestCount} suffix="개" href="/dates?best=1" />
      </section>

      <section className="card p-6 md:p-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="h-display text-2xl text-blossom-800">오늘의 질문</h2>
          <span className="chip bg-blossom-100 text-blossom-700">{fmtDate(q.date)}</span>
        </div>
        <p className="text-lg text-ink/90 leading-relaxed">{q.prompt}</p>
        <div className="mt-5">
          <Link className="btn-primary" href="/today">답변 작성하러 가기 →</Link>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  href,
}: {
  label: string;
  value: number;
  suffix: string;
  href: string;
}) {
  return (
    <Link href={href} className="card p-6 hover:border-blossom-300 transition block">
      <p className="text-blossom-500 text-sm">{label}</p>
      <p className="mt-1">
        <span className="h-display text-4xl text-blossom-700">{value}</span>
        <span className="ml-1 text-blossom-500">{suffix}</span>
      </p>
    </Link>
  );
}
