"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/session";

/** Only allow redirects to our own pages (no open redirect via ?next=). */
function safeNext(next: FormDataEntryValue | null): string {
  const path = typeof next === "string" ? next : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/szukaj";
}

/** TEMPORARY: demo mode while building. Skips sign-in. Remove together with DEMO_COOKIE before release. */
export async function enterDemoMode(formData: FormData) {
  const store = await cookies();
  store.set(DEMO_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  store.delete(SESSION_COOKIE);
  redirect("/");
}
