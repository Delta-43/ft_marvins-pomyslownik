import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/cookie";

/** The API answered 401: clear the stale session cookie and go to sign-in, keeping the target page. */
export async function GET(request: NextRequest) {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEMO_COOKIE);
  const next = request.nextUrl.searchParams.get("next") ?? "/szukaj";
  const login = new URL("/logowanie", request.url);
  if (next.startsWith("/") && !next.startsWith("//")) login.searchParams.set("next", next);
  login.searchParams.set("blad", "unauthorized");
  return NextResponse.redirect(login);
}
