/** What was typed into a sign-in or registration form that the server rejected, so one mistake does not empty the
 *  form. Kept in a short-lived httpOnly cookie, never in the URL (privacy: no identifier, e-mail, organisation or role
 *  in server logs or browser history). The landing reads it only together with `?blad=` in the address; the next
 *  sign-in or registration attempt replaces or deletes it, and it expires after ten minutes. */
import { cookies } from "next/headers";

export const DRAFT_COOKIE = "pomyslownik_draft";

/** Form field ids in the registration card. */
export type DraftField = "providerSubject" | "email" | "role" | "affiliationName" | "affiliationType" | "acceptedTerms";
/** Message key (messages: auth.*) of the error shown under a field. */
export type FieldError = "errId" | "errRequired" | "errEmail" | "errChoice" | "errTerms" | "errTaken";

export type Draft = {
  id?: string; email?: string; role?: string; org?: string; type?: string;
  fields?: Partial<Record<DraftField, FieldError>>;
};

/** Only from a server action (cookies can be written there, not while a page renders). */
export async function saveDraft(draft: Draft) {
  (await cookies()).set(DRAFT_COOKIE, JSON.stringify(draft), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600,
  });
}

export async function clearDraft() {
  const store = await cookies();
  if (store.has(DRAFT_COOKIE)) store.delete(DRAFT_COOKIE);
}

export async function readDraft(): Promise<Draft> {
  const raw = (await cookies()).get(DRAFT_COOKIE)?.value;
  if (!raw) return {};
  try {
    const d: unknown = JSON.parse(raw);
    return d && typeof d === "object" ? (d as Draft) : {};
  } catch {
    return {};
  }
}

/** The same e-mail rule as the API (`^[^@\s]+@[^@\s]+\.[^@\s]+$`). */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
