import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getActiveCouple, getDateLog, getDatePhotos } from "@/lib/repo";
import { saveImageFile, unlinkUpload } from "@/lib/files";
import { EMOTION_VALUES } from "@/lib/emotions";

export const runtime = "nodejs";

const PutSchema = z.object({
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const couple = getActiveCouple();
  const id = Number(params.id);
  const log = getDateLog(couple.id, id);
  if (!log) return NextResponse.json({ error: "not found" }, { status: 404 });

  const fd = await req.formData();
  const primaryRef = (fd.get("primary_photo_ref") ?? "").toString();
  const parsed = PutSchema.safeParse({
    date: fd.get("date"),
    place: fd.get("place"),
    title: fd.get("title"),
    feeling: fd.get("feeling"),
    emotion_tag: (fd.get("emotion_tag") ?? "") as string,
    is_best: (fd.get("is_best") ?? "0") as string,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // remove existing photos
  const removeIds = fd
    .getAll("remove_photo_ids")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  // add new photos
  const newFiles = fd.getAll("photos").filter((x): x is File => x instanceof File && x.size > 0);
  const newPaths: string[] = [];
  try {
    for (const f of newFiles) newPaths.push(await saveImageFile(f));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Delete files for removed photos
  if (removeIds.length > 0) {
    const toDelete = db
      .prepare(
        `SELECT id, path FROM date_photos WHERE date_log_id = ? AND id IN (${removeIds.map(() => "?").join(",")})`
      )
      .all(log.id, ...removeIds) as { id: number; path: string }[];
    for (const p of toDelete) await unlinkUpload(p.path);
  }

  const updateLog = db.prepare(
    `UPDATE date_logs SET date=?, place=?, title=?, feeling=?, emotion_tag=?, is_best=?, updated_at=datetime('now')
     WHERE id=? AND couple_id=?`
  );
  const delPhotos = db.prepare(
    `DELETE FROM date_photos WHERE date_log_id = ? AND id IN (${removeIds.length ? removeIds.map(() => "?").join(",") : "NULL"})`
  );
  const maxSortRow = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) m FROM date_photos WHERE date_log_id = ?`);
  const insPhoto = db.prepare(`INSERT INTO date_photos (date_log_id, path, sort_order) VALUES (?,?,?)`);
  const reorderPhotoSort = db.prepare(`UPDATE date_photos SET sort_order = ? WHERE id = ?`);

  const tx = db.transaction(() => {
    updateLog.run(
      parsed.data.date,
      parsed.data.place,
      parsed.data.title,
      parsed.data.feeling,
      parsed.data.emotion_tag,
      parsed.data.is_best,
      log.id,
      couple.id
    );
    if (removeIds.length > 0) delPhotos.run(log.id, ...removeIds);
    let next = ((maxSortRow.get(log.id) as { m: number }).m ?? -1) + 1;
    const newInsertedIds: number[] = [];
    for (const p of newPaths) {
      const r = insPhoto.run(log.id, p, next++);
      newInsertedIds.push(Number(r.lastInsertRowid));
    }

    const current = db
      .prepare(`SELECT id, path, sort_order FROM date_photos WHERE date_log_id = ? ORDER BY sort_order, id`)
      .all(log.id) as { id: number; path: string; sort_order: number }[];

    let primaryId: number | null = null;
    if (primaryRef.startsWith("existing:")) {
      const target = Number(primaryRef.slice("existing:".length));
      if (current.some((p) => p.id === target)) primaryId = target;
    } else if (primaryRef.startsWith("new:")) {
      const idx = Number(primaryRef.slice("new:".length));
      if (Number.isFinite(idx) && idx >= 0 && idx < newInsertedIds.length) {
        primaryId = newInsertedIds[idx];
      }
    }
    const ordered = primaryId
      ? [current.find((p) => p.id === primaryId)!, ...current.filter((p) => p.id !== primaryId)]
      : current;
    ordered.forEach((p, i) => reorderPhotoSort.run(i, p.id));

    // Recompute legacy photo_path = first remaining photo (for backwards compat & thumbnail fallback)
    const first = db
      .prepare(`SELECT path FROM date_photos WHERE date_log_id = ? ORDER BY sort_order, id LIMIT 1`)
      .get(log.id) as { path: string } | undefined;
    db.prepare(`UPDATE date_logs SET photo_path = ? WHERE id = ?`).run(first?.path ?? null, log.id);
  });

  tx();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const couple = getActiveCouple();
  const id = Number(params.id);
  const log = getDateLog(couple.id, id);
  if (!log) return NextResponse.json({ error: "not found" }, { status: 404 });
  const photos = getDatePhotos(log.id);
  for (const p of photos) await unlinkUpload(p.path);
  if (log.photo_path && !photos.some((p) => p.path === log.photo_path)) {
    await unlinkUpload(log.photo_path);
  }
  db.prepare(`DELETE FROM date_logs WHERE id = ? AND couple_id = ?`).run(log.id, couple.id);
  return NextResponse.json({ ok: true });
}
