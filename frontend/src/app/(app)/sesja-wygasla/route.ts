import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/cookie";
import { DEMO_COOKIE } from "@/lib/cookie";

/** The API answered 401: clear the session cookie and go to the landing sign-in, remembering where the user was. */
export function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/szukaj";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/szukaj";
  const res = NextResponse.redirect(new URL(`/?blad=unauthorized&next=${encodeURIComponent(safe)}#logowanie`, request.url));
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(DEMO_COOKIE);
  return res;
}
