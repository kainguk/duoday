"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMOTION_TAGS } from "@/lib/emotions";
import { todayISO, fmtInputDateWithWeekday, toPublicImagePath } from "@/lib/utils";

type Initial = {
  id?: number;
  date?: string;
  place?: string;
  title?: string;
  feeling?: string;
  emotion_tag?: string | null;
  is_best?: number | boolean;
  photos?: { id: number; path: string }[];
};

export default function DateForm({ initial }: { initial?: Initial }) {
  const r = useRouter();
  const editing = !!initial?.id;
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [place, setPlace] = useState(initial?.place ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [feeling, setFeeling] = useState(initial?.feeling ?? "");
  const [emotion, setEmotion] = useState<string>(initial?.emotion_tag ?? "");
  const [isBest, setIsBest] = useState<boolean>(!!initial?.is_best);
  const [files, setFiles] = useState<File[]>([]);
  const [removeIds, setRemoveIds] = useState<number[]>([]);
  const [existingPhotos] = useState(initial?.photos ?? []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.set("date", date);
    fd.set("place", place);
    fd.set("title", title);
    fd.set("feeling", feeling);
    fd.set("emotion_tag", emotion);
    fd.set("is_best", isBest ? "1" : "0");
    for (const f of files) fd.append("photos", f);
    for (const id of removeIds) fd.append("remove_photo_ids", String(id));

    const url = editing ? `/api/dates/${initial!.id}` : `/api/dates`;
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, body: fd });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error?.toString() || "저장 실패");
      return;
    }
    const j = await res.json().catch(() => ({}));
    const id = editing ? initial!.id : j.id;
    r.push(`/dates/${id}`);
    r.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">날짜</label>
          <input
            className="input"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <p className="mt-1 text-xs text-blossom-500">{fmtInputDateWithWeekday(date)}</p>
        </div>
        <div>
          <label className="label">장소</label>
          <input
            className="input"
            required
            placeholder="예) 서울숲"
            maxLength={100}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">제목</label>
        <input
          className="input"
          required
          placeholder="예) 벚꽃 산책"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="label">소감 / 메모</label>
        <textarea
          className="input min-h-[140px] resize-y"
          required
          placeholder="그날의 분위기, 대화, 작은 발견들…"
          maxLength={2000}
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
        />
      </div>

      <div>
        <label className="label">감정 태그</label>
        <div className="flex flex-wrap gap-2">
          {EMOTION_TAGS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setEmotion(emotion === t.value ? "" : t.value)}
              className={`chip border transition ${
                emotion === t.value
                  ? "bg-blossom-500 text-white border-blossom-500"
                  : "bg-white text-blossom-700 border-blossom-200 hover:bg-blossom-50"
              }`}
            >
              <span className="mr-1">{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isBest}
          onChange={(e) => setIsBest(e.target.checked)}
          className="w-4 h-4 accent-blossom-500"
        />
        <span className="text-sm text-blossom-800">⭐ 베스트 순간으로 표시하기</span>
      </label>

      {existingPhotos.length > 0 && (
        <div>
          <label className="label">기존 사진</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {existingPhotos.map((p) => {
              const removed = removeIds.includes(p.id);
              return (
                <div key={p.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={toPublicImagePath(p.path) ?? ""}
                    alt=""
                    className={`w-full h-24 object-cover rounded-lg ${
                      removed ? "opacity-30" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRemoveIds((prev) =>
                        removed ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                      )
                    }
                    className="absolute top-1 right-1 bg-white/90 text-xs rounded-full px-2 py-0.5 shadow"
                  >
                    {removed ? "복구" : "삭제"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="label">사진 추가 (여러 장 선택 가능)</label>
        <label className="block rounded-xl border border-dashed border-blossom-300 bg-blossom-50/60 p-4 cursor-pointer hover:bg-blossom-50 transition">
          <input
            className="hidden"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <p className="text-sm text-blossom-700">클릭해서 사진 선택</p>
          <p className="text-xs text-blossom-500 mt-1">여러 장 업로드 가능 · 장당 최대 5MB</p>
          {files.length > 0 ? (
            <p className="text-xs text-blossom-600 mt-2">{files.length}장 선택됨</p>
          ) : null}
        </label>
      </div>

      {err && <p className="text-sm text-red-500">{err}</p>}

      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" className="btn-ghost" onClick={() => r.back()}>
          취소
        </button>
        <button className="btn-primary" disabled={busy}>
          {busy ? "저장 중…" : editing ? "수정 저장" : "기록 저장"}
        </button>
      </div>
    </form>
  );
}
