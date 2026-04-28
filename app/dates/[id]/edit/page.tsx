import { notFound } from "next/navigation";
import { getActiveCouple, getDateLog, getDatePhotos } from "@/lib/repo";
import DateForm from "@/components/DateForm";

export const dynamic = "force-dynamic";

export default function EditDatePage({ params }: { params: { id: string } }) {
  const couple = getActiveCouple();
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const log = getDateLog(couple.id, id);
  if (!log) notFound();
  const photos = getDatePhotos(log.id);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="h-display text-3xl text-blossom-800 mb-2">기록 수정</h1>
      <p className="text-blossom-500 mb-6">필요한 항목만 바꾸고 저장해주세요.</p>
      <div className="card p-6 md:p-8">
        <DateForm
          initial={{
            id: log.id,
            date: log.date,
            place: log.place,
            title: log.title,
            feeling: log.feeling,
            emotion_tag: log.emotion_tag,
            is_best: log.is_best,
            photos: photos.map((p) => ({ id: p.id, path: p.path })),
          }}
        />
      </div>
    </div>
  );
}
