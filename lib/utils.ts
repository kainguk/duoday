export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(iso: string): string {
  // Accept "YYYY-MM-DD" or full ISO timestamps
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function ymKey(iso: string): string {
  return iso.slice(0, 7); // "YYYY-MM"
}

export function ymLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}년 ${Number(m)}월`;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "대기 중",
    processing: "처리 중",
    completed: "완료",
    cancelled: "취소됨",
  };

  return labels[status] ?? status;
}