import { getActiveCouple, getOrAssignTodayQuestion, getAnswers } from "@/lib/repo";
import { todayISO, fmtDate } from "@/lib/utils";
import { db } from "@/lib/db";
import AnswerForm from "@/components/AnswerForm";

export const dynamic = "force-dynamic";

export default function TodayPage() {
  const couple = getActiveCouple();
  const q = getOrAssignTodayQuestion(couple.id, todayISO());
  const answers = getAnswers(q.dq_id);
  const a = answers.find((x) => x.author === "a");
  const b = answers.find((x) => x.author === "b");

  const history = db
    .prepare(
      `SELECT dq.id as dq_id, dq.date, q.prompt
       FROM daily_questions dq JOIN questions q ON q.id = dq.question_id
       WHERE dq.couple_id = ? AND dq.date < ?
       ORDER BY dq.date DESC LIMIT 7`
    )
    .all(couple.id, q.date) as { dq_id: number; date: string; prompt: string }[];

  return (
    <div className="space-y-8">
      <div className="card p-6 md:p-8">
        <div className="flex items-center justify-between mb-2">
          <span className="chip bg-blossom-100 text-blossom-700">{fmtDate(q.date)}</span>
          <span className="text-sm text-blossom-500">{answers.length}/2 답변 완료</span>
        </div>
        <h1 className="h-display text-2xl sm:text-3xl text-blossom-800 mb-6">{q.prompt}</h1>

        <div className="grid md:grid-cols-2 gap-5">
          <Slot name={couple.partner_a} author="a" dqId={q.dq_id} existing={a?.body} />
          <Slot name={couple.partner_b} author="b" dqId={q.dq_id} existing={b?.body} />
        </div>
      </div>

      <div className="card p-6 md:p-8">
        <h2 className="h-display text-2xl text-blossom-800 mb-4">지난 질문</h2>
        {history.length === 0 ? (
          <p className="text-blossom-500">아직 지난 기록이 없어요.</p>
        ) : (
          <ul className="divide-y divide-blossom-100">
            {history.map((h) => {
              const ans = getAnswers(h.dq_id);
              return (
                <li key={h.dq_id} className="py-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blossom-500">{fmtDate(h.date)}</span>
                    <span className="text-blossom-400">{ans.length}/2</span>
                  </div>
                  <p className="text-ink/90 mb-2">{h.prompt}</p>
                  {ans.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      {ans.map((x) => (
                        <div key={x.author} className="bg-blossom-50 rounded-xl p-3">
                          <p className="text-xs text-blossom-500 mb-1">
                            {x.author === "a" ? couple.partner_a : couple.partner_b}
                          </p>
                          <p className="text-ink/80">{x.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Slot({ name, author, dqId, existing }: { name: string; author: "a" | "b"; dqId: number; existing?: string }) {
  return (
    <div className="rounded-2xl border border-blossom-100 p-5 bg-white">
      <p className="text-sm text-blossom-600 mb-2">{name}의 답변</p>
      <AnswerForm dqId={dqId} author={author} initial={existing ?? ""} />
    </div>
  );
}
