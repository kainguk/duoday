import { NextResponse } from "next/server";

export async function GET() {
  const res = new NextResponse(null, {
    status: 302,
    headers: { Location: "/today" },
  });
  res.cookies.set("duoday_actor", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return res;
}
