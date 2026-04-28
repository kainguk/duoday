import Link from "next/link";
import { db } from "@/lib/db";
import { getActiveCouple, getPrimaryPhoto } from "@/lib/repo";
import { fmtDateWithWeekday, ymKey, ymLabel } from "@/lib/utils";
import { EmotionBadge, BestBadge } from "@/components/Badges";
import { Placeholder } from "@/components/Placeholder";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  date: string;
  place: string;
  title: string;
  feeling: string;
  photo_path: string | null;
  emotion_tag: string | null;
  is_best: number;
};

export default function DatesPage({ searchParams }: { searchParams: { best?: string; tag?: string } }) {
  const couple = getActiveCouple();
  const onlyBest = searchParams.best === "1";
  const tag = searchParams.tag ?? "";

  const where: string[] = ["couple_id = ?"];
  const params: unknown[] = [couple.id];
  if (onlyBest) where.push("is_best = 1");
  if (tag) {
    where.push("emotion_tag = ?");
    params.push(tag);
  }

  const rows = db
    .prepare(
      `SELECT id, date, place, title, feeling, photo_path, emotion_tag, is_best
       FROM date_logs WHERE ${where.join(" AND ")} ORDER BY date DESC, id DESC`
    )
    .all(...params) as Row[];

  // 그룹핑: YYYY-MM 단위 (이미 date DESC라 그룹 순서도 자연스럽게 최신 → 과거)
  const groups: { ym: string; year: string; rows: Row[] }[] = [];
  for (const r of rows) {
    const key = ymKey(r.date);
    let g = groups[groups.length - 1];
    if (!g || g.ym !== key) {
      g = { ym: key, year: r.date.slice(0, 4), rows: [] };
      groups.push(g);
    }
    g.rows.push(r);
  }

  // 연도 헤더 분리
  let lastYear = "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="h-display text-3xl text-blossom-800">우리의 기록 타임라인</h1>
          <p className="text-blossom-500 mt-1 text-sm">
            함께한 날들을 가까운 순서대로 묶어 보여드려요.
          </p>
        </div>
        <Link href="/dates/new" className="btn-primary whitespace-nowrap self-start sm:self-auto">
          + 새 기록
        </Link>
      </div>

      <Filters onlyBest={onlyBest} tag={tag} />

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-blossom-500">
          {onlyBest || tag ? "조건에 맞는 기록이 없어요." : "아직 기록이 없어요. 첫 데이트를 남겨보세요!"}
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => {
            const showYear = g.year !== lastYear;
            lastYear = g.year;
            return (
              <section key={g.ym}>
                {showYear && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-display text-2xl text-blossom-800">{g.year}년</span>
                    <span className="flex-1 h-px bg-blossom-100" />
                  </div>
                )}
                <h3 className="text-blossom-600 text-sm font-semibold mb-3 ml-12 sm:ml-14">
                  {ymLabel(g.ym)} · {g.rows.length}개의 기록
                </h3>
                <ol className="relative pl-12 sm:pl-14">
                  <span className="timeline-rail" aria-hidden />
                  {g.rows.map((r) => (
                    <li key={r.id} className="relative pb-5 last:pb-0">
                      <span className="timeline-dot">{r.date.slice(8, 10)}</span>
                      <Card row={r} />
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Filters({ onlyBest, tag }: { onlyBest: boolean; tag: string }) {
  const Pill = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
    <Link
      href={href}
      className={`chip border ${
        active
          ? "bg-blossom-500 text-white border-blossom-500"
          : "bg-white border-blossom-200 text-blossom-700 hover:bg-blossom-50"
      }`}
    >
      {children}
    </Link>
  );
  const tags = [
    { v: "", label: "전체" },
    { v: "happy", label: "😊 행복" },
    { v: "flutter", label: "💗 설렘" },
    { v: "calm", label: "🌿 평온" },
    { v: "special", label: "✨ 특별함" },
    { v: "regret", label: "🌧 아쉬움" },
  ];
  return (
    <div className="card p-3 sm:p-4 flex flex-wrap gap-2 items-center">
      <Pill href={`/dates${onlyBest ? "?best=1" : ""}`} active={!tag && !onlyBest}>전체 보기</Pill>
      <Pill
        href={`/dates?best=1${tag ? `&tag=${tag}` : ""}`}
        active={onlyBest}
      >
        ⭐ 베스트만
      </Pill>
      <span className="mx-1 h-5 w-px bg-blossom-100 hidden sm:block" />
      {tags.map((t) => (
        <Pill
          key={t.v || "all"}
          href={`/dates?${new URLSearchParams({
            ...(onlyBest ? { best: "1" } : {}),
            ...(t.v ? { tag: t.v } : {}),
          }).toString()}`}
          active={tag === t.v && (t.v !== "" || !!tag)}
        >
          {t.label}
        </Pill>
      ))}
    </div>
  );
}

function Card({ row }: { row: Row }) {
  const photo = getPrimaryPhoto(row);
  return (
    <Link
      href={`/dates/${row.id}`}
      className="block ml-2 card overflow-hidden hover:border-blossom-300 transition flex flex-col sm:flex-row"
    >
      <div className="w-full sm:w-44 h-40 sm:h-auto shrink-0 relative">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={row.title} className="w-full h-full object-contain bg-blossom-50 p-1" />
        ) : (
          <Placeholder label={row.title} />
        )}
        {row.is_best ? (
          <div className="absolute top-2 left-2"><BestBadge /></div>
        ) : null}
      </div>
      <div className="p-4 sm:p-5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-blossom-500 mb-1">
          <span>{fmtDateWithWeekday(row.date)}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{row.place}</span>
        </div>
        <h3 className="h-display text-xl text-blossom-800 mb-2 truncate">{row.title}</h3>
        <p className="text-ink/80 text-sm line-clamp-2 whitespace-pre-wrap">{row.feeling}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <EmotionBadge tag={row.emotion_tag} />
        </div>
      </div>
    </Link>
  );
}
