"use client";
export function Placeholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blossom-100 to-blossom-200 flex items-center justify-center text-blossom-400 h-display text-2xl">
      {label.slice(0, 2) || "💗"}
    </div>
  );
}
