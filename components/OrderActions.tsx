"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/repo";

const NEXT: Record<OrderStatus, { label: string; status: OrderStatus; cls: string }[]> = {
  pending: [
    { label: "제작 시작", status: "processing", cls: "btn-primary" },
    { label: "주문 취소", status: "cancelled", cls: "btn-ghost" },
  ],
  processing: [
    { label: "제작 완료", status: "completed", cls: "btn-primary" },
    { label: "주문 취소", status: "cancelled", cls: "btn-ghost" },
  ],
  completed: [],
  cancelled: [],
};

export default function OrderActions({
  id,
  status,
  sweetbookEnabled = false,
}: {
  id: string;
  status: string;
  sweetbookEnabled?: boolean;
}) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const actions = NEXT[(status as OrderStatus) ?? "pending"] ?? [];

  async function patch(next: OrderStatus) {
    if (!confirm(`상태를 "${next}"로 변경할까요?`)) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error?.toString?.() ?? "변경 실패");
      return;
    }
    r.refresh();
  }

  async function sendToSweetbook() {
    if (!confirm("이 주문을 Sweetbook으로 전송하시겠습니까?")) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${id}/send`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error?.toString?.() ?? "Sweetbook 전송 실패");
      return;
    }
    const j = await res.json();
    alert(j.result?.message ? `Sweetbook 전송 성공: ${j.result.message}` : "Sweetbook 전송이 완료되었습니다.");
    r.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.length === 0 ? (
        <span className="text-sm text-blossom-500">최종 상태입니다.</span>
      ) : (
        actions.map((a) => (
          <button key={a.status} className={a.cls} disabled={busy} onClick={() => patch(a.status)}>
            {a.label}
          </button>
        ))
      )}
      <a href={`/api/export/${id}`} className="btn-ghost">⬇ ZIP 내보내기</a>
      {sweetbookEnabled ? (
        <button type="button" className="btn-ghost" disabled={busy} onClick={sendToSweetbook}>
          📤 Sweetbook 전송
        </button>
      ) : null}
    </div>
  );
}
