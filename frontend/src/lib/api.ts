/** Server-only API client for the Pomysłownik! backend (contract: docs/api/openapi.yaml 1.1.0-draft.5,
 *  types: src/api/schema.d.ts, generated). Every call runs on the Next.js server. The session token stays in an
 *  httpOnly cookie and never reaches the browser bundle. Every call sends `Accept-Language` from the site language,
 *  so the backend can answer in one language (draft 3+). */
import { cookies } from "next/headers";
import type { components } from "@/api/schema";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/locale";

export type Schemas = components["schemas"];
export type LocalizedText = Schemas["LocalizedText"];

export const API_BASE =
  process.env.API_BASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4010";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
    public retryAfter?: string | null,
    /** `validation_failed` names the failing body fields here (`email`, `role`, `affiliation.name`, ...). */
    public details: { field: string; issue: string }[] = [],
  ) {
    super(message);
  }
}

type Options = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; token?: string | null; lang?: Locale };

/** The site language from the cookie (server side). */
export async function currentLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export async function api<T>(path: string, { method = "GET", body, token, lang }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", "Accept-Language": lang ?? (await currentLocale()) };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => null))?.error;
    // No error envelope from a gateway (502/503/504): the backend itself is down.
    const fallback = res.status >= 502 && res.status <= 504 ? "unavailable" : "unknown";
    const e = new ApiError(res.status, err?.code ?? fallback, err?.message ?? res.statusText, err?.requestId, res.headers.get("Retry-After"), Array.isArray(err?.details) ? err.details : []);
    // Log the requestId so a failure can be traced in the backend logs. Never log the token.
    console.error(`[api] ${method} ${path} -> ${res.status} ${e.code} requestId=${e.requestId ?? "-"}`);
    throw e;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** API text for people. When the backend names a language it is already one string. The live API still sends the
 *  deprecated `{pl, en, uk}` map; then the site language wins, with `uk → pl → en` as the fallback. */
export function text(t: LocalizedText | null | undefined, locale: string): string {
  if (!t) return "";
  if (typeof t === "string") return t.trim();
  const order = locale === "en" ? ["en", "pl", "uk"] : locale === "uk" ? ["uk", "pl", "en"] : ["pl", "en", "uk"];
  for (const l of order) {
    const v = (t as Record<string, string | undefined>)[l];
    if (v?.trim()) return v.trim();
  }
  return "";
}

/** True when the text shown is not in the site language (object form without that language). The UI then marks it. */
export function textFellBack(t: LocalizedText | null | undefined, locale: string): boolean {
  return !!t && typeof t !== "string" && !(t as Record<string, string | undefined>)[locale]?.trim();
}

const KNOWN_ERRORS = ["registration_required", "account_exists", "terms_not_accepted", "validation_failed", "rate_limited", "unauthorized", "forbidden", "not_found", "unavailable"] as const;

/** Dictionary key (messages: errors.*) for an API error code. Unknown codes get the generic message. */
export function errorKey(code: string | undefined): (typeof KNOWN_ERRORS)[number] | "unknown" {
  if (code === "source_unavailable") return "unavailable";
  return (KNOWN_ERRORS as readonly string[]).includes(code ?? "") ? (code as (typeof KNOWN_ERRORS)[number]) : "unknown";
}
