import { emotionMeta } from "@/lib/emotions";

export function EmotionBadge({ tag }: { tag: string | null | undefined }) {
  const meta = emotionMeta(tag);
  if (!meta) return null;
  const clsByTag: Record<string, string> = {
    happy: "bg-amber-100 text-amber-700 border border-amber-200",
    flutter: "bg-fuchsia-200 text-fuchsia-900 border border-fuchsia-300",
    calm: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    special: "bg-sky-100 text-sky-700 border border-sky-200",
    regret: "bg-slate-100 text-slate-700 border border-slate-200",
  };
  return (
    <span className={`chip ${clsByTag[meta.value] ?? "bg-blossom-100 text-blossom-700 border border-blossom-200"}`}>
      <span className="mr-1">{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function BestBadge() {
  return (
    <span className="chip bg-amber-400 text-white shadow-sm">
      <span className="mr-1">⭐</span> BEST
    </span>
  );
}
