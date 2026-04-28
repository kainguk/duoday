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
  const [loggedInOnToday, setLoggedInOnToday] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    setLoggedInOnToday(pathname === "/today" && p.get("login") === "1" && !!p.get("actor"));
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
      <span className="mx-1 sm:mx-2 w-px bg-blossom-100" />
      {loggedInOnToday ? (
        <Link href="/today" className="btn-ghost px-2 py-1.5 sm:px-3 sm:py-2">
          로그아웃
        </Link>
      ) : (
        <Link href="/today/login" className="btn-primary px-2 py-1.5 sm:px-3 sm:py-2">
          로그인
        </Link>
      )}
    </nav>
  );
}
