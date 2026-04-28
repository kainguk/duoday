import { db } from "./db";

export type Couple = {
  id: string;
  name: string;
  partner_a: string;
  partner_b: string;
  started_on: string;
};

export type DateLog = {
  id: number;
  couple_id: string;
  date: string;
  place: string;
  title: string;
  feeling: string;
  photo_path: string | null;
  emotion_tag: string | null;
  is_best: number;
  created_at: string;
  updated_at: string;
};

export type DatePhoto = { id: number; date_log_id: number; path: string; sort_order: number };

export function getActiveCouple(): Couple {
  const row = db.prepare(`SELECT id, name, partner_a, partner_b, started_on FROM couples LIMIT 1`).get() as
    | Couple
    | undefined;
  if (!row) {
    throw new Error("커플 데이터가 없습니다. seed 스크립트를 실행해주세요.");
  }
  return row;
}

/**
 * 그날의 질문이 없으면 라운드로빈으로 1개 배정한다.
 */
export function getOrAssignTodayQuestion(coupleId: string, date: string) {
  const row = db
    .prepare(
      `SELECT dq.id as dq_id, dq.date, q.id as q_id, q.prompt
       FROM daily_questions dq JOIN questions q ON q.id = dq.question_id
       WHERE dq.couple_id = ? AND dq.date = ?`
    )
    .get(coupleId, date) as { dq_id: number; date: string; q_id: number; prompt: string } | undefined;
  if (row) return row;

  const used = (db.prepare(`SELECT COUNT(*) c FROM daily_questions WHERE couple_id = ?`).get(coupleId) as {
    c: number;
  }).c;
  const total = (db.prepare(`SELECT COUNT(*) c FROM questions`).get() as { c: number }).c;
  if (total === 0) throw new Error("질문 풀이 비어있습니다.");
  const offset = used % total;
  const q = db.prepare(`SELECT id, prompt FROM questions ORDER BY id LIMIT 1 OFFSET ?`).get(offset) as {
    id: number;
    prompt: string;
  };
  const info = db
    .prepare(`INSERT INTO daily_questions (couple_id, date, question_id) VALUES (?,?,?)`)
    .run(coupleId, date, q.id);
  return { dq_id: Number(info.lastInsertRowid), date, q_id: q.id, prompt: q.prompt };
}

export function getAnswers(dqId: number) {
  return db
    .prepare(`SELECT author, body, created_at FROM answers WHERE daily_question_id = ?`)
    .all(dqId) as { author: "a" | "b"; body: string; created_at: string }[];
}

export function getDateLog(coupleId: string, id: number): DateLog | undefined {
  return db.prepare(`SELECT * FROM date_logs WHERE id = ? AND couple_id = ?`).get(id, coupleId) as
    | DateLog
    | undefined;
}

export function getDatePhotos(dateLogId: number): DatePhoto[] {
  return db
    .prepare(`SELECT id, date_log_id, path, sort_order FROM date_photos WHERE date_log_id = ? ORDER BY sort_order, id`)
    .all(dateLogId) as DatePhoto[];
}

/**
 * 대표 썸네일 = date_photos 첫 장, 없으면 legacy date_logs.photo_path
 */
export function getPrimaryPhoto(log: Pick<DateLog, "id" | "photo_path">): string | null {
  const first = db
    .prepare(`SELECT path FROM date_photos WHERE date_log_id = ? ORDER BY sort_order, id LIMIT 1`)
    .get(log.id) as { path: string } | undefined;
  return first?.path ?? log.photo_path ?? null;
}

/* ---------- Order state machine (Lv2 강화) ---------- */
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed:  [],          // 종료 상태
  cancelled:  [],          // 종료 상태
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
