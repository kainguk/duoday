import { getActiveCouple, getOrAssignTodayQuestion, getAnswers } from "@/lib/repo";
import { todayISO, fmtDate } from "@/lib/utils";
import { db } from "@/lib/db";
import AnswerForm from "@/components/AnswerForm";

export const dynamic = "force-dynamic";

type SP = { login?: string; actor?: string };

export default function TodayPage({ searchParams }: { searchParams: SP }) {
  const couple = getActiveCouple();
  const q = getOrAssignTodayQuestion(couple.id, todayISO());
  const loginMode = searchParams.login === "1";
  const actor = searchParams.actor === "a" || searchParams.actor === "b" ? searchParams.actor : undefined;
  const answers = getAnswers(q.dq_id);

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
        <AuthPanel
          loginMode={loginMode}
          actor={actor}
          aName={couple.partner_a}
          bName={couple.partner_b}
        />
        <h1 className="h-display text-2xl sm:text-3xl text-blossom-800 mb-6">{q.prompt}</h1>

        <div className="grid md:grid-cols-2 gap-5">
          <Slot
            name={couple.partner_a}
            author="a"
            dqId={q.dq_id}
            answers={answers}
            actor={actor}
            loginMode={loginMode}
          />
          <Slot
            name={couple.partner_b}
            author="b"
            dqId={q.dq_id}
            answers={answers}
            actor={actor}
            loginMode={loginMode}
          />
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
                  <div className="grid md:grid-cols-2 gap-3">
                    <Slot
                      name={couple.partner_a}
                      author="a"
                      dqId={h.dq_id}
                      answers={ans}
                      actor={actor}
                      loginMode={loginMode}
                    />
                    <Slot
                      name={couple.partner_b}
                      author="b"
                      dqId={h.dq_id}
                      answers={ans}
                      actor={actor}
                      loginMode={loginMode}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function AuthPanel({
  loginMode,
  actor,
  aName,
  bName,
}: {
  loginMode: boolean;
  actor?: "a" | "b";
  aName: string;
  bName: string;
}) {
  return (
    <div className="mb-5 rounded-xl border border-blossom-100 bg-blossom-50/70 p-3">
      {!loginMode ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="text-blossom-600">
            <p>현재 비로그인 모드예요. 기본 모드에서도 답변 작성/수정이 가능해요.</p>
            <p className="text-xs mt-1">
              로그인 테스트 계정: {aName}(ID `aaaa` / PW `1234`), {bName}(ID `bbbb` / PW `1234`)
            </p>
          </div>
          <a href="/today/login" className="btn-primary">로그인 모드 켜기</a>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blossom-600 mr-1">작성 계정:</span>
          <a href="/today?login=1&actor=a" className={actor === "a" ? "btn-primary" : "btn-ghost"}>{aName}</a>
          <a href="/today?login=1&actor=b" className={actor === "b" ? "btn-primary" : "btn-ghost"}>{bName}</a>
          <span className="text-xs text-blossom-500">
            ({aName}: ID `aaaa` / PW `1234`, {bName}: ID `bbbb` / PW `1234`)
          </span>
          <a href="/today" className="btn-ghost ml-auto">로그아웃</a>
        </div>
      )}
    </div>
  );
}

function Slot({
  name,
  author,
  dqId,
  answers,
  actor,
  loginMode,
}: {
  name: string;
  author: "a" | "b";
  dqId: number;
  answers: { author: "a" | "b"; body: string }[];
  actor?: "a" | "b";
  loginMode: boolean;
}) {
  const mine = answers.find((x) => x.author === author);
  const myOwnAnswer = actor ? answers.find((x) => x.author === actor) : undefined;
  const canEdit = !loginMode || actor === author;
  const canView = !loginMode || !actor || author === actor || !!myOwnAnswer;

  return (
    <div className="rounded-2xl border border-blossom-100 p-5 bg-white space-y-2">
      <p className="text-sm text-blossom-600 mb-2">{name}의 답변</p>
      {!canView ? (
        <p className="text-sm text-blossom-500">내 답변을 먼저 작성하면 상대 답변을 볼 수 있어요.</p>
      ) : (
        <>
          {mine?.body ? <p className="text-sm text-ink/80 whitespace-pre-wrap bg-blossom-50 rounded-xl p-3">{mine.body}</p> : null}
          <AnswerForm
            dqId={dqId}
            author={author}
            actor={actor}
            initial={mine?.body ?? ""}
            disabled={!canEdit}
            hint={
              loginMode
                ? actor
                  ? canEdit
                    ? "이 계정으로 답변을 저장할 수 있어요."
                    : "로그인한 계정의 답변만 수정할 수 있어요."
                  : "작성할 계정을 선택해 주세요."
                : "비로그인 모드에서는 두 사람 답변을 모두 작성할 수 있어요."
            }
          />
        </>
      )}
    </div>
  );
}
