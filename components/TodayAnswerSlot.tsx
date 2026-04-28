"use client";

import { useState } from "react";
import AnswerForm from "@/components/AnswerForm";

type Answer = { author: "a" | "b"; body: string };

export default function TodayAnswerSlot({
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
  answers: Answer[];
  actor?: "a" | "b";
  loginMode: boolean;
}) {
  const mine = answers.find((x) => x.author === author);
  const myOwnAnswer = actor ? answers.find((x) => x.author === actor) : undefined;
  const isMine = actor === author;
  const canEdit = !loginMode || isMine;
  const canView = !loginMode || !actor || isMine || !!myOwnAnswer;
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-2xl border border-blossom-100 p-5 bg-white space-y-2">
      <p className="text-sm text-blossom-600 mb-2">{name}의 답변</p>

      {!canView ? (
        <p className="text-sm text-blossom-500">내 답변을 먼저 작성하면 상대 답변을 볼 수 있어요.</p>
      ) : (
        <>
          {mine?.body ? (
            <p className="text-sm text-ink/80 whitespace-pre-wrap bg-blossom-50 rounded-xl p-3">{mine.body}</p>
          ) : (
            <p className="text-sm text-blossom-500">아직 답변이 적혀있지 않아요.</p>
          )}

          {canEdit ? (
            editing ? (
              <AnswerForm
                dqId={dqId}
                author={author}
                actor={actor}
                initial={mine?.body ?? ""}
                onSaved={() => setEditing(false)}
                onDeleted={() => setEditing(false)}
              />
            ) : (
              <div className="flex justify-end">
                <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
                  {mine?.body ? "수정" : "답변 작성"}
                </button>
              </div>
            )
          ) : null}
        </>
      )}
    </div>
  );
}
