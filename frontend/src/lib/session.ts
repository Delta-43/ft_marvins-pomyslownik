/** Session handling. The token lives only in an httpOnly cookie set by a server action. */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";

import { SESSION_COOKIE } from "@/lib/cookie";
export { SESSION_COOKIE };

/** Routes that need a signed-in user. Card data never shows without one. Keep in sync with proxy.ts. */
export const PROTECTED_PATHS = ["/szukaj", "/wyniki", "/karta", "/profil"];

export async function getToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/** Where to send the user when the session is missing or expired. The route handler clears the cookie. */
function expired(next: string): never {
  redirect(`/sesja-wygasla?next=${encodeURIComponent(next)}`);
}

/** Authenticated GET for server components. A 401 clears the session and goes to sign-in. */
export async function authed<T>(path: string, currentPath: string): Promise<T> {
  const token = await getToken();
  if (!token) expired(currentPath);
  try {
    return await api<T>(path, { token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) expired(currentPath);
    throw e;
  }
}
