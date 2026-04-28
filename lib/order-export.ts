import path from "node:path";
import fs from "node:fs/promises";
import JSZip from "jszip";
import { db } from "./db";
import { uploadDir } from "./files";
import type { Couple } from "./repo";

export type OrderRecord = {
  id: string;
  couple_id: string;
  title: string;
  cover_color: string;
  range_start: string;
  range_end: string;
  include_questions: number;
  include_dates: number;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export async function buildOrderZipBuffer(order: OrderRecord, couple: Couple): Promise<Buffer> {
  const questions = order.include_questions
    ? (db
        .prepare(
          `SELECT dq.id as dq_id, dq.date, q.prompt
           FROM daily_questions dq JOIN questions q ON q.id = dq.question_id
           WHERE dq.couple_id = ? AND dq.date BETWEEN ? AND ?
           ORDER BY dq.date ASC`
        )
        .all(couple.id, order.range_start, order.range_end) as {
        dq_id: number;
        date: string;
        prompt: string;
      }[]) 
    : [];

  const questionPayload = questions.map((q) => {
    const ans = db
      .prepare(`SELECT author, body, created_at FROM answers WHERE daily_question_id = ?`)
      .all(q.dq_id) as { author: "a" | "b"; body: string; created_at: string }[];
    return {
      date: q.date,
      prompt: q.prompt,
      answers: {
        partner_a: ans.find((x) => x.author === "a") ?? null,
        partner_b: ans.find((x) => x.author === "b") ?? null,
      },
    };
  });

  const dates = order.include_dates
    ? (db
        .prepare(
          `SELECT id, date, place, title, feeling, photo_path, emotion_tag, is_best, created_at
           FROM date_logs
           WHERE couple_id = ? AND date BETWEEN ? AND ?
           ORDER BY date ASC`
        )
        .all(couple.id, order.range_start, order.range_end) as {
        id: number;
        date: string;
        place: string;
        title: string;
        feeling: string;
        photo_path: string | null;
        emotion_tag: string | null;
        is_best: number;
        created_at: string;
      }[]) 
    : [];

  const zip = new JSZip();
  const photos: { src: string; entry: string }[] = [];

  const datesPayload = dates.map((d) => {
    const extra = db
      .prepare(`SELECT path FROM date_photos WHERE date_log_id = ? ORDER BY sort_order, id`)
      .all(d.id) as { path: string }[];
    const all = extra.length > 0 ? extra.map((x) => x.path) : d.photo_path ? [d.photo_path] : [];
    const entries: string[] = [];
    for (const p of all) {
      const fname = p.split("/").pop()!;
      const entry = `content/photos/${d.id}/${fname}`;
      entries.push(entry);
      photos.push({ src: p, entry });
    }
    return {
      date: d.date,
      title: d.title,
      place: d.place,
      feeling: d.feeling,
      emotion_tag: d.emotion_tag,
      is_best: !!d.is_best,
      photo_files: entries,
    };
  });

  for (const p of photos) {
    const fname = p.src.split("/").pop()!;
    try {
      const buf = await fs.readFile(path.join(uploadDir(), fname));
      zip.file(p.entry, buf);
    } catch {
      // 사진이 없으면 무시
    }
  }

  const orderJson = {
    schema_version: "1.1",
    exported_at: new Date().toISOString(),
    order: {
      id: order.id,
      title: order.title,
      cover_color: order.cover_color,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      note: order.note,
      range: { start: order.range_start, end: order.range_end },
      include: {
        questions: !!order.include_questions,
        dates: !!order.include_dates,
      },
    },
    couple: {
      id: couple.id,
      name: couple.name,
      partner_a: couple.partner_a,
      partner_b: couple.partner_b,
      started_on: couple.started_on,
    },
    counts: {
      questions: questionPayload.length,
      answered_questions: questionPayload.filter((q) => q.answers.partner_a || q.answers.partner_b).length,
      dates: datesPayload.length,
      best_dates: datesPayload.filter((d) => d.is_best).length,
      photos: photos.length,
    },
    manifest: {
      "content/questions.json": "질문/답변 데이터",
      "content/dates.json": "데이트 기록 데이터 (감정 태그/베스트 포함)",
      "content/photos/<dateId>/": "각 데이트 기록의 사진 원본",
    },
  };

  zip.file("order.json", JSON.stringify(orderJson, null, 2));
  zip.file("content/questions.json", JSON.stringify(questionPayload, null, 2));
  zip.file("content/dates.json", JSON.stringify(datesPayload, null, 2));
  zip.file(
    "README.txt",
    [
      "DuoDay — 책 주문 익스포트 패키지 (v1.1)",
      `주문 ID: ${order.id}`,
      `생성 시각: ${orderJson.exported_at}`,
      "",
      "이 ZIP은 가상의 인쇄 파트너에게 전달되는 1건의 주문 패키지입니다.",
      "- order.json: 주문 메타데이터, 커플 정보, 매니페스트",
      "- content/questions.json: 기간 내 매일의 질문과 두 사람의 답변",
      "- content/dates.json: 데이트 기록 (감정 태그/베스트 표시 포함)",
      "- content/photos/<dateId>/: 각 데이트 기록의 사진 원본",
      "",
      "본 데모는 실제 인쇄/배송을 수행하지 않습니다.",
    ].join("\n")
  );

  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}
