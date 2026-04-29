import { db } from "../lib/db";

const QUESTIONS = [
  "오늘 가장 행복했던 순간은?",
  "최근 상대에게 고맙다고 느낀 일은?",
  "이번 주에 같이 해보고 싶은 일은?",
  "내가 좋아하는 너의 모습 한 가지는?",
  "오늘 한 가지 칭찬해주고 싶은 점은?",
  "다시 가보고 싶은 데이트 장소는?",
  "최근에 발견한 새로운 너의 매력은?",
  "둘만의 작은 비밀 같은 약속이 있다면?",
  "내년 이맘때 우리는 어디서 뭘 하고 있을까?",
  "오늘 하루 한 줄로 표현한다면?",
  "최근 가장 웃겼던 사건은?",
  "함께 듣고 싶은 노래 한 곡은?",
  "고마웠지만 말 못 했던 게 있다면?",
  "사소하지만 좋아하는 우리의 습관은?",
  "오늘의 컨디션은 1~10 중 몇 점?",
];

const DATES = [
  // (날짜, 장소, 제목, 감정, 감정태그, 베스트, 사진경로)
  ["2024-12-24", "성수동 카페거리", "크리스마스 이브 산책", "조용한 거리에 우리 둘만 있는 기분이었어.", "special", 1, null],
  ["2025-01-12", "한강 망원지구",   "한강에서 라면",         "차가운 바람에 라면 김이 폴폴.",         "happy",   0, null],
  ["2025-02-14", "이태원 작은 식당", "발렌타인 디너",         "처음 가본 가게인데 너무 맛있었어!",     "flutter", 1, null],
  ["2025-03-30", "서울숲",          "벚꽃 산책",             "사진을 100장 넘게 찍은 날.",           "happy",   0, null],
  ["2025-04-05", "을지로 노포",     "비 오는 날의 막걸리",    "비 소리 들으며 천천히 한 잔.",          "calm",    0, null],
  ["2025-04-19", "종로 영화관",     "심야 영화",             "마지막 회차라 거의 우리뿐이었어.",       "calm",    0, null],
  ["2025-05-05", "양양 바다",       "1박 2일 짧은 여행",      "처음 같이 가본 바다, 잊지 못할 것 같아.","special", 1, null],
] as const;

const SAMPLE_ANSWERS_A = [
  "퇴근하고 네 목소리 들었을 때 하루 피로가 싹 풀렸어.",
  "아무 말 없이도 편안했던 저녁 산책이 제일 좋았어.",
  "네가 챙겨준 따뜻한 커피 한 잔이 오늘의 하이라이트였어.",
  "같이 웃다가 배 아팠던 순간이 아직도 생각나.",
  "작은 일인데도 네가 진심으로 공감해줘서 고마웠어.",
  "오늘은 평범했지만 너랑 있어서 특별한 하루였어.",
  "우산 하나 같이 쓰고 걷던 길이 괜히 영화 같았어.",
  "대화가 길어질수록 더 가까워지는 느낌이라 좋았어.",
] as const;

const SAMPLE_ANSWERS_B = [
  "나도! 네가 웃어주면 분위기가 확 밝아져.",
  "오늘 네 배려 덕분에 마음이 되게 편했어.",
  "우리 이렇게 사소한 하루도 잘 쌓아가는 게 좋아.",
  "네 얘기 듣는 시간이 제일 재밌었어.",
  "고맙다는 말, 오늘은 꼭 하고 싶었어.",
  "다음엔 우리가 말한 그 장소 꼭 같이 가보자.",
  "오늘 하루를 한 줄로 적으면: 너 덕분에 따뜻함.",
  "나도 같은 순간이 제일 좋았어 : )",
] as const;

function seed() {
  const couple = db.prepare(`SELECT id FROM couples LIMIT 1`).get() as { id: string } | undefined;
  let coupleId: string;
  if (!couple) {
    coupleId = "couple-demo";
    db.prepare(
      `INSERT INTO couples (id, name, partner_a, partner_b, started_on)
       VALUES (?,?,?,?,?)`
    ).run(coupleId, "지원 ❤︎ 도윤", "지원", "도윤", "2024-09-14");
    console.log("[seed] couple created");
  } else {
    coupleId = couple.id;
  }

  const insQ = db.prepare(`INSERT OR IGNORE INTO questions (prompt) VALUES (?)`);
  for (const p of QUESTIONS) insQ.run(p);
  console.log(`[seed] questions: ${QUESTIONS.length}`);

  const haveDates = (db.prepare(`SELECT COUNT(*) c FROM date_logs WHERE couple_id = ?`).get(coupleId) as {
    c: number;
  }).c;
  if (haveDates === 0) {
    const insD = db.prepare(
      `INSERT INTO date_logs (couple_id, date, place, title, feeling, photo_path, emotion_tag, is_best)
       VALUES (?,?,?,?,?,?,?,?)`
    );
    for (const [date, place, title, feeling, tag, best, photo] of DATES) {
      insD.run(coupleId, date, place, title, feeling, photo, tag, best);
    }
    console.log(`[seed] date_logs: ${DATES.length}`);
  }

  // 질문 14일치 자동 배정 + 일부 답변 채워두기
  const haveDQ = (db.prepare(`SELECT COUNT(*) c FROM daily_questions WHERE couple_id = ?`).get(coupleId) as {
    c: number;
  }).c;
  if (haveDQ === 0) {
    const total = (db.prepare(`SELECT COUNT(*) c FROM questions`).get() as { c: number }).c;
    const qs = db.prepare(`SELECT id FROM questions ORDER BY id`).all() as { id: number }[];
    const today = new Date();
    const insDQ = db.prepare(`INSERT INTO daily_questions (couple_id, date, question_id) VALUES (?,?,?)`);
    const insA = db.prepare(`INSERT OR IGNORE INTO answers (daily_question_id, author, body) VALUES (?,?,?)`);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const q = qs[(13 - i) % total];
      const r = insDQ.run(coupleId, iso, q.id);
      if (i > 2) {
        const dqId = Number(r.lastInsertRowid);
        const aBody = SAMPLE_ANSWERS_A[(13 - i) % SAMPLE_ANSWERS_A.length];
        const bBody = SAMPLE_ANSWERS_B[(13 - i) % SAMPLE_ANSWERS_B.length];
        insA.run(dqId, "a", aBody);
        if (i % 2 === 0) insA.run(dqId, "b", bBody);
      }
    }
    console.log("[seed] daily_questions + sample answers seeded for last 14 days");
  }

  console.log("[seed] done");
}

seed();
