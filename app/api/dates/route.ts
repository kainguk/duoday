import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getActiveCouple } from "@/lib/repo";
import { saveImageFile } from "@/lib/files";
import { EMOTION_VALUES } from "@/lib/emotions";

export const runtime = "nodejs";

const BaseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  place: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(100),
  feeling: z.string().trim().min(1).max(2000),
  emotion_tag: z
    .string()
    .optional()
    .transform((v) => (v && (EMOTION_VALUES as readonly string[]).includes(v) ? v : null)),
  is_best: z
    .string()
    .optional()
    .transform((v) => (v === "1" || v === "true" ? 1 : 0)),
});

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const parsed = BaseSchema.safeParse({
    date: fd.get("date"),
    place: fd.get("place"),
    title: fd.get("title"),
    feeling: fd.get("feeling"),
    emotion_tag: (fd.get("emotion_tag") ?? "") as string,
    is_best: (fd.get("is_best") ?? "0") as string,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // 사진 (여러 장)
  const files = fd.getAll("photos").filter((x): x is File => x instanceof File && x.size > 0);
  // 단일 photo 호환 (옛 폼)
  const legacy = fd.get("photo");
  if (legacy instanceof File && legacy.size > 0) files.push(legacy);

  const paths: string[] = [];
  try {
    for (const f of files) paths.push(await saveImageFile(f));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const couple = getActiveCouple();
  const insLog = db.prepare(
    `INSERT INTO date_logs (couple_id, date, place, title, feeling, photo_path, emotion_tag, is_best, updated_at)
     VALUES (?,?,?,?,?,?,?,?, datetime('now'))`
  );
  const insPhoto = db.prepare(
    `INSERT INTO date_photos (date_log_id, path, sort_order) VALUES (?,?,?)`
  );

  const tx = db.transaction(() => {
    const r = insLog.run(
      couple.id,
      parsed.data.date,
      parsed.data.place,
      parsed.data.title,
      parsed.data.feeling,
      paths[0] ?? null, // 대표 = 첫 장 (legacy 호환)
      parsed.data.emotion_tag,
      parsed.data.is_best
    );
    const dateLogId = Number(r.lastInsertRowid);
    paths.forEach((p, i) => insPhoto.run(dateLogId, p, i));
    return dateLogId;
  });

  const id = tx();
  return NextResponse.json({ id });
}
