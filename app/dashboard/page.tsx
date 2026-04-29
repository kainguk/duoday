import { db } from "@/lib/db";
import { getActiveCouple } from "@/lib/repo";
import { EMOTION_TAGS, emotionMeta } from "@/lib/emotions";
import { ymLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const couple = getActiveCouple();

  const totalDates = (db
    .prepare(`SELECT COUNT(*) c FROM date_logs WHERE couple_id = ?`)
    .get(couple.id) as { c: number }).c;
  const bestDates = (db
    .prepare(`SELECT COUNT(*) c FROM date_logs WHERE couple_id = ? AND is_best = 1`)
    .get(couple.id) as { c: number }).c;
  const fullyAnsweredQuestions = (db
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

  const monthly = db
    .prepare(
      `SELECT substr(date,1,7) ym, COUNT(*) c FROM date_logs WHERE couple_id = ?
       GROUP BY ym ORDER BY ym DESC LIMIT 12`
    )
    .all(couple.id) as { ym: string; c: number }[];
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.c));

  const tags = db
    .prepare(
      `SELECT emotion_tag t, COUNT(*) c FROM date_logs
       WHERE couple_id = ? AND emotion_tag IS NOT NULL AND emotion_tag <> ''
       GROUP BY emotion_tag ORDER BY c DESC`
    )
    .all(couple.id) as { t: string; c: number }[];
  const top = tags[0];
  const tagColor: Record<string, string> = {
    happy: "bg-amber-100 text-amber-700 border border-amber-200",
    flutter: "bg-fuchsia-200 text-fuchsia-900 border border-fuchsia-300",
    calm: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    special: "bg-sky-100 text-sky-700 border border-sky-200",
    regret: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h-display text-3xl text-blossom-800">우리 둘의 통계</h1>
        <p className="text-blossom-500 text-sm mt-1">한눈에 보는 함께한 시간들</p>
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="전체 데이트 기록" value={totalDates} suffix="개" href="/dates" />
        <Stat label="베스트 순간" value={bestDates} suffix="개" tone="amber" href="/dates?best=1" />
        <Stat label="함께 답변한 질문" value={fullyAnsweredQuestions} suffix="개" href="/today" />
        <Stat
          label="가장 많이 쓴 감정"
          value={top?.c ?? 0}
          suffix={top ? ` · ${emotionMeta(top.t)?.emoji ?? ""} ${emotionMeta(top.t)?.label ?? top.t}` : ""}
          href={top ? `/dates?tag=${top.t}` : "/dates"}
        />
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="h-display text-xl text-blossom-800 mb-4">월별 데이트 기록 수</h2>
        {monthly.length === 0 ? (
          <p className="text-blossom-500 text-sm">아직 데이트 기록이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {monthly.map((m) => (
              <li key={m.ym} className="flex items-center gap-3">
                <span className="text-xs text-blossom-500 w-24 shrink-0">{ymLabel(m.ym)}</span>
                <div className="flex-1 h-3 rounded-full bg-blossom-50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blossom-300 to-blossom-500"
                    style={{ width: `${(m.c / maxMonthly) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-blossom-700 w-8 text-right">{m.c}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="h-display text-xl text-blossom-800 mb-4">감정 태그 분포</h2>
        {tags.length === 0 ? (
          <p className="text-blossom-500 text-sm">아직 감정 태그를 단 기록이 없어요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map((t) => {
              const found = tags.find((x) => x.t === t.value);
              const c = found?.c ?? 0;
              return (
                <span
                  key={t.value}
                  className={`chip ${tagColor[t.value] ?? "bg-blossom-100 text-blossom-700 border border-blossom-200"} ${c === 0 ? "opacity-50" : ""}`}
                >
                  <span className="mr-1">{t.emoji}</span> {t.label} · {c}
                </span>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  tone,
  href,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "amber";
  href: string;
}) {
  return (
    <a href={href} className="card p-5 block hover:border-blossom-300 transition">
      <p className="text-blossom-500 text-sm">{label}</p>
      <p className="mt-1">
        <span className={`h-display text-3xl ${tone === "amber" ? "text-amber-600" : "text-blossom-700"}`}>
          {value}
        </span>
        <span className="ml-1 text-blossom-500 text-sm">{suffix}</span>
      </p>
    </a>
  );
}
