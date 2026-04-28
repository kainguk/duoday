const MAP: Record<string, { label: string; cls: string }> = {
  pending:    { label: "대기 중",   cls: "bg-blossom-100 text-blossom-700" },
  processing: { label: "제작 중",   cls: "bg-amber-100 text-amber-800" },
  completed:  { label: "완료",      cls: "bg-emerald-100 text-emerald-800" },
  cancelled:  { label: "취소됨",    cls: "bg-slate-200 text-slate-700" },
};

export function StatusChip({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, cls: "bg-slate-100 text-slate-700" };
  return <span className={`chip ${m.cls}`}>{m.label}</span>;
}
