"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError, type Schemas } from "@/lib/api";
import { getToken, SESSION_COOKIE } from "@/lib/session";
import { DEMO_COOKIE } from "@/lib/cookie";

type Session = { data: Schemas["Session"] };

/** Only allow redirects to our own pages (no open redirect via ?next=). */
function safeNext(next: FormDataEntryValue | null): string {
  const path = typeof next === "string" ? next : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/szukaj";
}
const str = (v: FormDataEntryValue | null): string => (typeof v === "string" ? v.trim() : "");

async function startSession(session: Schemas["Session"], demo = false) {
  const maxAge = Math.max(60, Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1000));
  const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
  const store = await cookies();
  store.set(SESSION_COOKIE, session.token, opts);
  if (demo) store.set(DEMO_COOKIE, "1", opts);
  else store.delete(DEMO_COOKIE);
}

/** Demo mode: one click signs in to the live API as a shared sandbox identity (default "demo-jury").
 *  The first click registers it. Everything after that is a normal session with real data. */
const DEMO_SUBJECT = process.env.DEMO_IDENTITY ?? "demo-jury";

async function loginOrRegisterDemo(): Promise<Schemas["Session"]> {
  try {
    return (await api<Session>("/api/v1/auth/login", { method: "POST", body: { provider: "sandbox_id", providerSubject: DEMO_SUBJECT } })).data;
  } catch (e) {
    if (!(e instanceof ApiError && e.code === "registration_required")) throw e;
  }
  return (await api<Session>("/api/v1/auth/register", {
    method: "POST",
    body: {
      provider: "sandbox_id", providerSubject: DEMO_SUBJECT, email: `${DEMO_SUBJECT}@example.invalid`, displayName: "Demo",
      role: "investors_business", affiliation: { name: "Konto demonstracyjne", type: "other" }, interests: [], acceptedTerms: true,
    },
  })).data;
}

export type AuthResult = { next: string; opening: boolean } | { error: string };

/** Sign-in from the landing card. With JavaScript the result comes back (so the page can play the opening move while
 *  it navigates); without JavaScript `signIn` and `enterDemo` below redirect. `mode` "demo" uses the shared account. */
export async function authenticate(form: FormData): Promise<AuthResult> {
  const next = safeNext(form.get("next"));
  const demo = form.get("mode") === "demo";
  const subject = str(form.get("providerSubject"));
  if (!demo && subject.length < 3) return { error: "validation_failed" };
  try {
    const session = demo
      ? await loginOrRegisterDemo()
      : (await api<Session>("/api/v1/auth/login", { method: "POST", body: { provider: "sandbox_id", providerSubject: subject } })).data;
    await startSession(session, demo);
    return { next, opening: true };
  } catch (e) {
    const code = e instanceof ApiError ? e.code : "unknown";
    if (code === "registration_required") {
      const q = new URLSearchParams({ konto: "nowe", blad: code, next, id: subject });
      return { next: `/?${q}#logowanie`, opening: false };
    }
    return { error: code };
  }
}

/** No-JavaScript path of the landing forms: the same as `authenticate`, then a redirect. */
export async function signIn(form: FormData) {
  const r = await authenticate(form);
  if ("error" in r) redirect(`/?blad=${r.error}&id=${encodeURIComponent(str(form.get("providerSubject")))}#logowanie`);
  redirect(r.next);
}

export async function register(form: FormData) {
  const next = safeNext(form.get("next"));
  const subject = str(form.get("providerSubject"));
  const back = (code: string) => {
    // Keep what was typed, so one mistake does not empty the form.
    const q = new URLSearchParams({ konto: "nowe", blad: code, next, id: subject, email: str(form.get("email")), rola: str(form.get("role")), org: str(form.get("affiliationName")), typ: str(form.get("affiliationType")) });
    redirect(`/?${q}#logowanie`);
  };
  let session: Schemas["Session"];
  try {
    session = (await api<Session>("/api/v1/auth/register", {
      method: "POST",
      body: {
        provider: "sandbox_id",
        providerSubject: subject,
        email: str(form.get("email")),
        role: str(form.get("role")),
        affiliation: { name: str(form.get("affiliationName")), type: str(form.get("affiliationType")) || "other" },
        interests: form.getAll("interests").map(String).slice(0, 20),
        acceptedTerms: form.get("acceptedTerms") === "on",
        consentToContact: form.get("consentToContact") === "on",
      },
    })).data;
  } catch (e) {
    back(e instanceof ApiError ? e.code : "unknown");
    return;
  }
  await startSession(session);
  redirect(next);
}

export async function signOut() {
  const token = await getToken();
  if (token) await api("/api/v1/auth/logout", { method: "POST", token }).catch(() => undefined);
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEMO_COOKIE);
  redirect("/");
}

/** Profile: role, language and contact consent in one save. */
export async function updateProfile(form: FormData) {
  const token = await getToken();
  const body: Record<string, unknown> = {};
  const role = str(form.get("role"));
  if (role) body.role = role;
  const lang = str(form.get("preferredLanguage"));
  if (lang) body.preferredLanguage = lang;
  body.consentToContact = form.get("consentToContact") === "on";
  try {
    await api("/api/v1/me", { method: "PATCH", token, body });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/sesja-wygasla?next=/profil");
    redirect(`/profil?blad=${e instanceof ApiError ? e.code : "unknown"}`);
  }
  redirect("/profil?zapisano=1");
}

/** GDPR: delete the account and its personal data, then end the session. */
export async function deleteAccount(form: FormData) {
  if (form.get("confirm") !== "on") redirect("/profil?blad=validation_failed");
  const token = await getToken();
  try {
    await api("/api/v1/me", { method: "DELETE", token });
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 401)) redirect(`/profil?blad=${e instanceof ApiError ? e.code : "unknown"}`);
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEMO_COOKIE);
  redirect("/?konto=usuniete");
}
