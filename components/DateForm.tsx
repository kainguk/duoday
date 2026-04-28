"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EMOTION_TAGS } from "@/lib/emotions";
import { todayISO, fmtInputDateWithWeekday, normalizeDateInput, toPublicImagePath } from "@/lib/utils";

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
  const datePickerRef = useRef<HTMLInputElement>(null);
  const editing = !!initial?.id;
  const [date, setDate] = useState(normalizeDateInput(initial?.date ?? todayISO()));
  const [place, setPlace] = useState(initial?.place ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [feeling, setFeeling] = useState(initial?.feeling ?? "");
  const [emotion, setEmotion] = useState<string>(initial?.emotion_tag ?? "");
  const [isBest, setIsBest] = useState<boolean>(!!initial?.is_best);
  const [files, setFiles] = useState<File[]>([]);
  const [removeIds, setRemoveIds] = useState<number[]>([]);
  const [existingPhotos] = useState(initial?.photos ?? []);
  const [primaryPhotoRef, setPrimaryPhotoRef] = useState<string | null>(
    existingPhotos.length > 0 ? `existing:${existingPhotos[0].id}` : null
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const hasExisting = existingPhotos.some((p) => !removeIds.includes(p.id));
    const hasNew = files.length > 0;
    if (!hasExisting && !hasNew) {
      setPrimaryPhotoRef(null);
      return;
    }
    if (!primaryPhotoRef) {
      if (hasExisting) {
        const firstExisting = existingPhotos.find((p) => !removeIds.includes(p.id));
        if (firstExisting) setPrimaryPhotoRef(`existing:${firstExisting.id}`);
      } else {
        setPrimaryPhotoRef("new:0");
      }
      return;
    }
    if (primaryPhotoRef.startsWith("existing:")) {
      const id = Number(primaryPhotoRef.slice("existing:".length));
      if (!existingPhotos.some((p) => p.id === id && !removeIds.includes(p.id))) {
        if (hasExisting) {
          const firstExisting = existingPhotos.find((p) => !removeIds.includes(p.id));
          if (firstExisting) setPrimaryPhotoRef(`existing:${firstExisting.id}`);
        } else if (hasNew) {
          setPrimaryPhotoRef("new:0");
        } else {
          setPrimaryPhotoRef(null);
        }
      }
      return;
    }
    if (primaryPhotoRef.startsWith("new:")) {
      const idx = Number(primaryPhotoRef.slice("new:".length));
      if (!Number.isFinite(idx) || idx < 0 || idx >= files.length) {
        if (hasExisting) {
          const firstExisting = existingPhotos.find((p) => !removeIds.includes(p.id));
          if (firstExisting) setPrimaryPhotoRef(`existing:${firstExisting.id}`);
        } else if (hasNew) {
          setPrimaryPhotoRef("new:0");
        } else {
          setPrimaryPhotoRef(null);
        }
      }
    }
  }, [existingPhotos, files, primaryPhotoRef, removeIds]);

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
    if (primaryPhotoRef) fd.set("primary_photo_ref", primaryPhotoRef);
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
          <div className="relative">
            <input
              className="input pr-11"
              type="text"
              readOnly
              value={fmtInputDateWithWeekday(date)}
              aria-label="선택된 날짜"
            />
            <input
              ref={datePickerRef}
              className="sr-only"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(normalizeDateInput(e.target.value))}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost px-2 py-1"
              onClick={() => {
                if (datePickerRef.current?.showPicker) datePickerRef.current.showPicker();
                else datePickerRef.current?.click();
              }}
              aria-label="날짜 선택"
            >
              📅
            </button>
          </div>
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
              const isPrimary = primaryPhotoRef === `existing:${p.id}`;
              return (
                <div key={p.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={toPublicImagePath(p.path) ?? ""}
                    alt=""
                    className={`w-full h-24 object-cover rounded-lg border-2 ${
                      removed ? "opacity-30 border-transparent" : isPrimary ? "border-blossom-500" : "border-transparent"
                    }`}
                  />
                  {!removed ? (
                    <button
                      type="button"
                      onClick={() => setPrimaryPhotoRef(`existing:${p.id}`)}
                      className={`absolute bottom-1 left-1 text-xs rounded-full px-2 py-0.5 shadow ${
                        isPrimary ? "bg-blossom-500 text-white" : "bg-white/90 text-blossom-700"
                      }`}
                    >
                      대표
                    </button>
                  ) : null}
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
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <p className="text-sm text-blossom-700">클릭해서 사진 선택</p>
          <p className="text-xs text-blossom-500 mt-1">여러 장 업로드 가능 · 장당 최대 5MB</p>
          {files.length > 0 ? (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-blossom-600">{files.length}장 선택됨</p>
              <ul className="space-y-1">
                {files.map((f, idx) => {
                  const isPrimary = primaryPhotoRef === `new:${idx}`;
                  return (
                    <li key={`${f.name}-${idx}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-blossom-700">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setPrimaryPhotoRef(`new:${idx}`)}
                        className={`rounded-full px-2 py-0.5 ${
                          isPrimary ? "bg-blossom-500 text-white" : "bg-white text-blossom-700 border border-blossom-200"
                        }`}
                      >
                        대표
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
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
