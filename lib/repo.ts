import { db } from "./db";
import { toPublicImagePath } from "./utils";

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
  const rows = db
    .prepare(`SELECT author, body, created_at FROM answers WHERE daily_question_id = ?`)
    .all(dqId) as { author: "a" | "b"; body: string; created_at: string }[];
  const fallbackA = [
    "퇴근하고 네 목소리 들었을 때 하루 피로가 싹 풀렸어.",
    "아무 말 없이도 편안했던 저녁 산책이 제일 좋았어.",
    "네가 챙겨준 따뜻한 커피 한 잔이 오늘의 하이라이트였어.",
    "같이 웃다가 배 아팠던 순간이 아직도 생각나.",
    "작은 일인데도 네가 진심으로 공감해줘서 고마웠어.",
    "오늘은 평범했지만 너랑 있어서 특별한 하루였어.",
    "우산 하나 같이 쓰고 걷던 길이 괜히 영화 같았어.",
    "대화가 길어질수록 더 가까워지는 느낌이라 좋았어.",
  ];
  const fallbackB = [
    "나도! 네가 웃어주면 분위기가 확 밝아져.",
    "오늘 네 배려 덕분에 마음이 되게 편했어.",
    "우리 이렇게 사소한 하루도 잘 쌓아가는 게 좋아.",
    "네 얘기 듣는 시간이 제일 재밌었어.",
    "고맙다는 말, 오늘은 꼭 하고 싶었어.",
    "다음엔 우리가 말한 그 장소 꼭 같이 가보자.",
    "오늘 하루를 한 줄로 적으면: 너 덕분에 따뜻함.",
    "나도 같은 순간이 제일 좋았어 : )",
  ];
  return rows.map((r) => {
    if (r.author === "a" && r.body === "오늘은 너랑 같이 있어서 정말 좋았어 :)") {
      return { ...r, body: fallbackA[dqId % fallbackA.length] };
    }
    if (r.author === "b" && r.body === "응, 나도 너의 웃음이 가장 좋았어.") {
      return { ...r, body: fallbackB[dqId % fallbackB.length] };
    }
    return r;
  });
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
  return toPublicImagePath(first?.path ?? log.photo_path ?? null);
}

/* ---------- Order state machine (Lv2 강화) ---------- */
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed:  ["pending", "processing", "cancelled"], // 테스트 버전: 재수정 허용
  cancelled:  ["pending", "processing"],              // 테스트 버전: 재개 허용
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
