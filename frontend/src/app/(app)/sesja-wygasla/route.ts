import { SESSION_COOKIE, DEMO_COOKIE } from "@/lib/cookie";
import { redirectTo, safeLocalPath } from "@/lib/redirect";

/** The API answered 401: clear the session cookie and go to the landing sign-in, remembering where the user was. */
export function GET(request: Request) {
  const url = new URL(request.url);
  const safe = safeLocalPath(url.searchParams.get("next"));
  const res = redirectTo(`/?blad=unauthorized&next=${encodeURIComponent(safe)}#logowanie`);
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(DEMO_COOKIE);
  return res;
}
