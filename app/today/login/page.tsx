"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TodayLoginPage() {
  const r = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const uid = id.trim().toLowerCase();
    const pwd = pw.trim();
    if (pwd !== "1234") {
      setErr("비밀번호가 올바르지 않아요.");
      return;
    }
    if (uid === "aaaa") {
      r.push("/today?login=1&actor=a");
      return;
    }
    if (uid === "bbbb") {
      r.push("/today?login=1&actor=b");
      return;
    }
    setErr("아이디가 올바르지 않아요.");
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <h1 className="h-display text-3xl text-blossom-800">로그인 모드</h1>
        <p className="text-sm text-blossom-500 mt-1">
          테스트 계정: 지원(`aaaa`/`1234`), 도윤(`bbbb`/`1234`)
        </p>
      </div>
      <div className="card p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">아이디</label>
            <input className="input" value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디 입력" />
          </div>
          <div>
            <label className="label">비밀번호</label>
            <input
              className="input"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="비밀번호 입력"
            />
          </div>
          {err ? <p className="text-sm text-red-500">{err}</p> : null}
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-ghost" onClick={() => r.push("/today")}>취소</button>
            <button className="btn-primary">로그인</button>
          </div>
        </form>
      </div>
    </div>
  );
}
