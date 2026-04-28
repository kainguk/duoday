export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(iso: string): string {
  const d = parseIsoLikeDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function fmtDateWithWeekday(iso: string): string {
  const d = parseIsoLikeDate(iso);
  if (Number.isNaN(d.getTime())) return fmtDate(iso);
  return `${fmtDate(iso)} (${WEEKDAYS_KO[d.getDay()]})`;
}

export function fmtInputDateWithWeekday(iso: string): string {
  const d = parseIsoLikeDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${iso} (${WEEKDAYS_KO[d.getDay()]})`;
}

function parseIsoLikeDate(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

export function toPublicImagePath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/")) return path.replace(/\\/g, "/");
  const fileName = path.split(/[\\/]/).pop();
  return fileName ? `/uploads/${fileName}` : null;
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