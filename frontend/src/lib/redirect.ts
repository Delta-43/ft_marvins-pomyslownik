import { NextResponse } from "next/server";

/**
 * Redirect with a relative Location header.
 * Inside the container `request.url` is `https://0.0.0.0:3000/...` (the listen address, not the public host),
 * so `NextResponse.redirect(new URL(path, request.url))` sends visitors to an address they cannot reach.
 * A relative Location is resolved by the browser against the address it actually used.
 * `path` must start with a single "/" and be built by the caller, never taken from user input as is.
 */
export function redirectTo(path: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

/** A same-site path or the fallback. Rejects "//host" and "/\host" (browsers read a backslash as a slash) and control characters. */
export function safeLocalPath(next: unknown, fallback = "/szukaj"): string {
  if (typeof next !== "string") return fallback;
  return /^\/(?![/\\])/.test(next) && !/[\u0000-\u001f\u007f]/.test(next) ? next : fallback;
}
