/**
 * 감정 태그 (고정 5종). UI/배지 색상도 여기서 통일.
 */
export const EMOTION_TAGS = [
  { value: "happy",   label: "행복",   emoji: "😊", color: "bg-amber-200 text-amber-900 border border-amber-300" },
  { value: "flutter", label: "설렘",   emoji: "💗", color: "bg-fuchsia-200 text-fuchsia-900 border border-fuchsia-300" },
  { value: "calm",    label: "평온",   emoji: "🌿", color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  { value: "special", label: "특별함", emoji: "✨", color: "bg-amber-100 text-amber-700 border border-amber-200" },
  { value: "regret",  label: "아쉬움", emoji: "🌧",  color: "bg-slate-100 text-slate-700 border border-slate-200" },
] as const;

export type EmotionValue = (typeof EMOTION_TAGS)[number]["value"];
export const EMOTION_VALUES = EMOTION_TAGS.map((t) => t.value) as readonly EmotionValue[];

export function emotionMeta(value: string | null | undefined) {
  return EMOTION_TAGS.find((t) => t.value === value);
}
