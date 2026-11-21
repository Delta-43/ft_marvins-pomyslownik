import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/session";

// Sign-in gate: search and results need a session (or TEMPORARY demo mode).
// Without one, send the user to /logowanie and remember where they were going.
export function proxy(request: NextRequest) {
  const signedIn = request.cookies.has(SESSION_COOKIE) || request.cookies.has(DEMO_COOKIE);
  if (signedIn) return NextResponse.next();

  const login = new URL("/logowanie", request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

// Keep in sync with PROTECTED_PATHS in src/lib/session.ts.
export const config = {
  matcher: ["/szukaj/:path*", "/wyniki/:path*"],
};
