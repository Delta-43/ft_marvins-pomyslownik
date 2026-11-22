import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FIRST_AUDIENCE_COOKIE, FIRST_SEARCH_PARAM, SESSION_COOKIE } from "@/lib/cookie";
import { canonicalResultsHref } from "@/lib/results-url";

// Sign-in gate: card pages need a session cookie. Without one, send the user to the landing sign-in card
// and remember where they were going. An expired token is caught later (API 401 -> /sesja-wygasla).
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const home = new URL("/", request.url);
    home.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    home.hash = "logowanie";
    return NextResponse.redirect(home);
  }
  // Results: redirect to the clean URL (no empty selects, default sort or invalid values) before the page renders.
  if (request.nextUrl.pathname === "/wyniki") {
    const canonical = canonicalResultsHref(request.nextUrl.searchParams);
    if (canonical) {
      const res = NextResponse.redirect(new URL(canonical, request.url));
      // First search after registration (TASKS.md A10): the search form sent the role as the audience with the
      // marker; the preset is used up here (link prefetches never carry the marker) and the redirect drops it.
      if (request.nextUrl.searchParams.has(FIRST_SEARCH_PARAM)) res.cookies.delete(FIRST_AUDIENCE_COOKIE);
      return res;
    }
  }
  return NextResponse.next();
}

// Keep in sync with PROTECTED_PATHS in src/lib/session.ts.
export const config = { matcher: ["/szukaj/:path*", "/wyniki/:path*", "/zrodla/:path*", "/profil/:path*"] };
