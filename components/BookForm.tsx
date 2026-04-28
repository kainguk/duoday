"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtInputDateWithWeekday, normalizeDateInput } from "@/lib/utils";

export default function BookForm({
  defaultStart,
  defaultEnd,
}: {
  defaultStart: string;
  defaultEnd: string;
}) {
  const r = useRouter();
  const startPickerRef = useRef<HTMLInputElement>(null);
  const endPickerRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("우리의 기록");
  const [color, setColor] = useState("#e35c8a");
  const [start, setStart] = useState(normalizeDateInput(defaultStart));
  const [end, setEnd] = useState(normalizeDateInput(defaultEnd));
  const [iq, setIq] = useState(true);
  const [id, setId] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const palette = [
    "#e35c8a",
    "#7a2244",
    "#f7a3bc",
    "#3a1f2b",
    "#c84473",
    "#6d4aff",
    "#4a6fff",
    "#0096a6",
    "#1f7a3a",
    "#d66a00",
    "#374151",
    "#111827",
  ];

  async function preview() {
    if (!iq && !id) {
      setErr("질문 답변 또는 데이트 기록 중 최소 1개는 포함해야 해요.");
      return;
    }
    setErr(null);
    const params = new URLSearchParams({
      title, cover_color: color, start, end,
      iq: iq ? "1" : "0", id: id ? "1" : "0",
    });
    r.push(`/book/preview?${params.toString()}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!iq && !id) {
      setErr("질문 답변 또는 데이트 기록 중 최소 1개는 포함해야 해요.");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        cover_color: color,
        range_start: start,
        range_end: end,
        include_questions: iq,
        include_dates: id,
        note,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error?.toString?.() ?? "주문 생성 실패");
      return;
    }
    const j = await res.json();
    r.push(`/book/${j.id}`);
    r.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label">책 제목</label>
        <input className="input" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="label">표지 색상</label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-14 h-12 rounded-lg border border-blossom-200 cursor-pointer"
          />
          <div className="flex flex-wrap gap-2">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-9 h-9 rounded-full border-2 border-white shadow"
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">시작일</label>
          <div className="relative">
            <input className="input pr-11" type="text" readOnly value={fmtInputDateWithWeekday(start)} />
            <input
              ref={startPickerRef}
              className="sr-only"
              type="date"
              required
              value={start}
              onChange={(e) => setStart(normalizeDateInput(e.target.value))}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost px-2 py-1"
              onClick={() => {
                if (startPickerRef.current?.showPicker) startPickerRef.current.showPicker();
                else startPickerRef.current?.click();
              }}
              aria-label="시작일 선택"
            >
              📅
            </button>
          </div>
        </div>
        <div>
          <label className="label">종료일</label>
          <div className="relative">
            <input className="input pr-11" type="text" readOnly value={fmtInputDateWithWeekday(end)} />
            <input
              ref={endPickerRef}
              className="sr-only"
              type="date"
              required
              value={end}
              onChange={(e) => setEnd(normalizeDateInput(e.target.value))}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost px-2 py-1"
              onClick={() => {
                if (endPickerRef.current?.showPicker) endPickerRef.current.showPicker();
                else endPickerRef.current?.click();
              }}
              aria-label="종료일 선택"
            >
              📅
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={iq} onChange={(e) => setIq(e.target.checked)} className="accent-blossom-500" />
          질문 답변 포함
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={id} onChange={(e) => setId(e.target.checked)} className="accent-blossom-500" />
          데이트 기록 포함
        </label>
      </div>

      <div>
        <label className="label">메모 (선택)</label>
        <textarea
          className="input min-h-[90px] resize-y"
          maxLength={500}
          placeholder="이 메모는 주문 상세 화면에 표시돼요. (예: 꼭 넣고 싶은 문구, 내부 확인용 메모)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {err && <p className="text-sm text-red-500">{err}</p>}

      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" className="btn-ghost" onClick={preview}>
          📖 미리보기
        </button>
        <button className="btn-primary" disabled={busy}>
          {busy ? "주문 중…" : "주문 만들기"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => r.push("/book")}>
          취소
        </button>
      </div>
    </form>
  );
}
