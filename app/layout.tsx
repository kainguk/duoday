import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "DuoDay — 우리 둘만의 하루 기록",
  description:
    "매일의 질문과 데이트 기록을 함께 쌓고, 한 권의 책으로 남기는 커플 콘텐츠 서비스",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-blossom-50 via-white to-blossom-50">
          <header className="border-b border-blossom-100 bg-white/70 backdrop-blur sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-5 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <Link href="/" className="h-display text-2xl text-blossom-700">
                DuoDay <span className="text-blossom-400">·</span>{" "}
                <span className="text-sm font-sans text-blossom-500">우리 둘의 하루</span>
              </Link>
              <TopNav />
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 sm:px-5 py-8 sm:py-10">{children}</main>
          <footer className="text-center text-xs text-blossom-400 py-10">
            © DuoDay · 스위트북 과제 데모 · 외부 의존 없는 단독 서비스
          </footer>
        </div>
      </body>
    </html>
  );
}
