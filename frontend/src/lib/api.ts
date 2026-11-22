/** Server-only API client for the Pomysłownik! backend (contract: docs/api/openapi.yaml, types: src/api/schema.d.ts).
 *  Every call runs on the Next.js server. The session token stays in an httpOnly cookie and never reaches the browser bundle. */
import type { components } from "@/api/schema";

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
  ) {
    super(message);
  }
}

type Options = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; token?: string | null };

export async function api<T>(path: string, { method = "GET", body, token }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
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
    const e = new ApiError(res.status, err?.code ?? fallback, err?.message ?? res.statusText, err?.requestId, res.headers.get("Retry-After"));
    // Log the requestId so a failure can be traced in the backend logs. Never log the token.
    console.error(`[api] ${method} ${path} -> ${res.status} ${e.code} requestId=${e.requestId ?? "-"}`);
    throw e;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** API text in the chosen language, falling back to the other one if it is missing. */
export function pick(text: LocalizedText | null | undefined, locale: string): string {
  const first = locale === "en" ? text?.en : text?.pl;
  const second = locale === "en" ? text?.pl : text?.en;
  return first?.trim() || second?.trim() || "";
}

const KNOWN_ERRORS = ["registration_required", "account_exists", "terms_not_accepted", "validation_failed", "rate_limited", "unauthorized", "not_found", "unavailable"] as const;

/** Dictionary key (messages: errors.*) for an API error code. Unknown codes get the generic message. */
export function errorKey(code: string | undefined): (typeof KNOWN_ERRORS)[number] | "unknown" {
  if (code === "source_unavailable") return "unavailable";
  return (KNOWN_ERRORS as readonly string[]).includes(code ?? "") ? (code as (typeof KNOWN_ERRORS)[number]) : "unknown";
}
