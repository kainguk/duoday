"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteDateButton({ id }: { id: number }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!confirm("이 기록을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setBusy(true);
    const res = await fetch(`/api/dates/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return alert("삭제 실패");
    r.push("/dates");
    r.refresh();
  }
  return (
    <button onClick={go} disabled={busy} className="btn-ghost text-red-600 hover:bg-red-50">
      삭제
    </button>
  );
}
