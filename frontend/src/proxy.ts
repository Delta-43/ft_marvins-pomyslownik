import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/cookie";
import { canonicalResultsHref } from "@/lib/results-url";

// Sign-in gate: card pages need a session cookie. Without one, send the user to /logowanie
// and remember where they were going. An expired token is caught later (API 401 -> /sesja-wygasla).
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/logowanie", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  // Results: redirect to the clean URL (no empty selects, default sort or invalid values) before the page renders,
  // so the address bar shows exactly the filters that are applied. A real 307, also without JavaScript.
  if (request.nextUrl.pathname === "/wyniki") {
    const canonical = canonicalResultsHref(request.nextUrl.searchParams);
    if (canonical) return NextResponse.redirect(new URL(canonical, request.url));
  }

  return NextResponse.next();
}

// Keep in sync with PROTECTED_PATHS in src/lib/session.ts.
export const config = {
  matcher: ["/szukaj/:path*", "/wyniki/:path*", "/karta/:path*", "/porownaj/:path*", "/profil/:path*"],
};
