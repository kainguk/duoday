"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const r = useRouter();
  useEffect(() => {
    sessionStorage.removeItem("duoday_session");
    document.cookie = "duoday_actor=; path=/; max-age=0; SameSite=Lax";
    r.replace("/today");
  }, [r]);
  return null;
}
