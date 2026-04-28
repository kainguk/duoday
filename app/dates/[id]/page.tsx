import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveCouple, getDateLog, getDatePhotos, getPrimaryPhoto } from "@/lib/repo";
import { fmtDateWithWeekday, toPublicImagePath } from "@/lib/utils";
import { EmotionBadge, BestBadge } from "@/components/Badges";
import DeleteDateButton from "@/components/DeleteDateButton";
import { Placeholder } from "@/components/Placeholder";

export const dynamic = "force-dynamic";

export default function DateDetail({ params }: { params: { id: string } }) {
  const couple = getActiveCouple();
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const log = getDateLog(couple.id, id);
  if (!log) notFound();

  const photos = getDatePhotos(log.id);
  const primary = getPrimaryPhoto(log);
  const gallery =
    photos.length > 0
      ? photos.map((p) => toPublicImagePath(p.path)).filter((x): x is string => !!x)
      : primary
      ? [primary]
      : [];

  return (
    <div className="space-y-6">
      <Link href="/dates" className="text-sm text-blossom-500">← 타임라인으로</Link>

      <article className="card overflow-hidden">
        <div className="w-full aspect-[16/9] bg-blossom-50 relative">
          {gallery[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gallery[0]} alt={log.title} className="w-full h-full object-contain bg-blossom-50 p-1" />
          ) : (
            <Placeholder label={log.title} />
          )}
          {log.is_best ? (
            <div className="absolute top-3 left-3"><BestBadge /></div>
          ) : null}
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-blossom-500 mb-2">
            <span>{fmtDateWithWeekday(log.date)}</span>
            <span aria-hidden>·</span>
            <span>{log.place}</span>
            <EmotionBadge tag={log.emotion_tag} />
          </div>
          <h1 className="h-display text-2xl sm:text-3xl text-blossom-800 mb-4">{log.title}</h1>
          <p className="text-ink/90 whitespace-pre-wrap leading-relaxed">{log.feeling}</p>

          {gallery.length > 1 && (
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {gallery.slice(1).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="w-full h-24 object-contain rounded-lg bg-blossom-50 p-1" />
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 justify-end">
            <DeleteDateButton id={log.id} />
            <Link href={`/dates/${log.id}/edit`} className="btn-primary">수정하기</Link>
          </div>
        </div>
      </article>
    </div>
  );
}
