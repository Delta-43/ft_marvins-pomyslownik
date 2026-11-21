/** Minimal API client. F0 replaces it with a typed client built on src/api/schema.d.ts (npm run api:types). */
const isServer = typeof window === "undefined";

export const API_BASE =
  (isServer ? process.env.API_BASE_URL_INTERNAL : undefined) ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4010";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public requestId?: string) {
    super(message);
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.code ?? "unknown", body?.error?.message ?? res.statusText, body?.error?.requestId);
  }
  return res.json() as Promise<T>;
}
