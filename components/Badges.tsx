import { emotionMeta } from "@/lib/emotions";

export function EmotionBadge({ tag }: { tag: string | null | undefined }) {
  const meta = emotionMeta(tag);
  if (!meta) return null;
  return (
    <span className={`chip ${meta.color}`}>
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
