"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/today", label: "오늘의 질문" },
  { href: "/dates", label: "데이트 타임라인" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/book", label: "책 만들기" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasCookie = document.cookie.includes("duoday_actor=");
    const hasSession = sessionStorage.getItem("duoday_session") === "1";
    if (hasCookie && !hasSession) {
      document.cookie = "duoday_actor=; path=/; max-age=0; SameSite=Lax";
      setLoggedIn(false);
      if (pathname === "/today") {
        window.location.replace("/today");
      }
      return;
    }
    setLoggedIn(hasCookie && hasSession);
  }, [pathname]);

  return (
    <nav className="flex flex-wrap gap-1 text-xs sm:text-sm">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2 py-1.5 sm:px-3 sm:py-2 ${active ? "btn-primary" : "btn-ghost"}`}
          >
            {item.label}
          </Link>
        );
      })}
      {loggedIn ? (
        <Link href="/logout" className="btn-ghost ml-3 px-2 py-1.5 sm:px-3 sm:py-2">
          로그아웃
        </Link>
      ) : (
        <Link href="/today/login" className="btn-primary ml-3 px-2 py-1.5 sm:px-3 sm:py-2">
          로그인
        </Link>
      )}
    </nav>
  );
}
