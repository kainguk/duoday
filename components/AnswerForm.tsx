"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnswerForm({
  dqId,
  author,
  initial,
}: {
  dqId: number;
  author: "a" | "b";
  initial: string;
}) {
  const r = useRouter();
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(initial.length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dqId, author, body }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      r.refresh();
    } else {
      alert("저장 실패");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        className="input min-h-[110px] resize-y"
        placeholder="오늘의 답을 적어주세요…"
        value={body}
        maxLength={1000}
        onChange={(e) => {
          setBody(e.target.value);
          setSaved(false);
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-blossom-400">{body.length}/1000</span>
        <button className="btn-primary" disabled={busy || !body.trim()}>
          {saved ? "수정 저장" : "답변 저장"}
        </button>
      </div>
    </form>
  );
}
