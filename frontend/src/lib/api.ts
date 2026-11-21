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

/** Text for people: Polish first, English if Polish is missing. */
export function t(text: LocalizedText | null | undefined): string {
  return text?.pl?.trim() || text?.en?.trim() || "";
}

/** Friendly Polish message for an API error code. */
export function errorMessage(code: string | undefined): string {
  switch (code) {
    case "registration_required": return "Nie znamy tej tożsamości. Załóż konto poniżej.";
    case "account_exists": return "Konto z tą tożsamością już istnieje. Zaloguj się.";
    case "terms_not_accepted": return "Aby korzystać z serwisu, zaakceptuj regulamin.";
    case "validation_failed": return "Sprawdź pola formularza.";
    case "rate_limited": return "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.";
    case "unauthorized": return "Sesja wygasła. Zaloguj się ponownie.";
    case "not_found": return "Nie znaleziono.";
    case "unavailable":
    case "source_unavailable": return "Serwer jest chwilowo niedostępny. Spróbuj ponownie za chwilę.";
    default: return "Coś poszło nie tak. Spróbuj ponownie za chwilę.";
  }
}
