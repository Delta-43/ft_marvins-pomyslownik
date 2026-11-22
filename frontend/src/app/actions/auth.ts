"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError, type Schemas } from "@/lib/api";
import { getToken, SESSION_COOKIE } from "@/lib/session";
import { DEMO_COOKIE, FIRST_AUDIENCE_COOKIE } from "@/lib/cookie";
import { clearDraft, EMAIL_RE, saveDraft, type Draft, type DraftField, type FieldError } from "@/lib/draft";
import { safeLocalPath } from "@/lib/redirect";

type Session = { data: Schemas["Session"] };

/** Only allow redirects to our own pages (no open redirect via ?next=). */
function safeNext(next: FormDataEntryValue | null): string {
  return safeLocalPath(next);
}
const str = (v: FormDataEntryValue | null): string => (typeof v === "string" ? v.trim() : "");

async function startSession(session: Schemas["Session"], demo = false) {
  const maxAge = Math.max(60, Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1000));
  const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
  const store = await cookies();
  store.set(SESSION_COOKIE, session.token, opts);
  if (demo) store.set(DEMO_COOKIE, "1", opts);
  else store.delete(DEMO_COOKIE);
  // A new session never inherits another account's first-search audience (register sets it again after this).
  store.delete(FIRST_AUDIENCE_COOKIE);
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
  // The typed identifier comes back through the draft cookie, not the URL (lib/draft.ts).
  if (!demo && subject.length < 3) { await saveDraft({ id: subject }); return { error: "validation_failed" }; }
  try {
    const session = demo
      ? await loginOrRegisterDemo()
      : (await api<Session>("/api/v1/auth/login", { method: "POST", body: { provider: "sandbox_id", providerSubject: subject } })).data;
    await clearDraft();
    await startSession(session, demo);
    return { next, opening: true };
  } catch (e) {
    const code = e instanceof ApiError ? e.code : "unknown";
    await saveDraft({ id: subject });
    if (code === "registration_required") {
      const q = new URLSearchParams({ konto: "nowe", blad: code, next });
      return { next: `/?${q}#logowanie`, opening: false };
    }
    return { error: code };
  }
}

/** No-JavaScript path of the landing forms: the same as `authenticate`, then a redirect. */
export async function signIn(form: FormData) {
  const r = await authenticate(form);
  if ("error" in r) redirect(`/?blad=${encodeURIComponent(r.error)}#logowanie`);
  redirect(r.next);
}

/** API field names (`validation_failed` details) to the registration card's field ids and their error message. */
const API_FIELDS: Record<string, [DraftField, FieldError]> = {
  providerSubject: ["providerSubject", "errId"],
  email: ["email", "errEmail"],
  role: ["role", "errChoice"],
  "affiliation.name": ["affiliationName", "errRequired"],
  affiliation: ["affiliationName", "errRequired"],
  "affiliation.type": ["affiliationType", "errChoice"],
  acceptedTerms: ["acceptedTerms", "errTerms"],
};

/** The checks the browser also runs (RegisterChecks), so the no-JavaScript path shows the same field errors. */
function checkRegistration(d: Required<Omit<Draft, "fields">>, terms: boolean): Draft["fields"] {
  const f: NonNullable<Draft["fields"]> = {};
  if (d.id.length < 3) f.providerSubject = "errId";
  if (!d.email) f.email = "errRequired";
  else if (!EMAIL_RE.test(d.email)) f.email = "errEmail";
  if (!d.role) f.role = "errChoice";
  if (!d.org) f.affiliationName = "errRequired";
  if (!terms) f.acceptedTerms = "errTerms";
  return f;
}

export async function register(form: FormData) {
  const next = safeNext(form.get("next"));
  const draft = { id: str(form.get("providerSubject")), email: str(form.get("email")), role: str(form.get("role")), org: str(form.get("affiliationName")), type: str(form.get("affiliationType")) };
  const terms = form.get("acceptedTerms") === "on";
  // Keep what was typed (in a cookie, not the URL), so one mistake does not empty the form.
  const back = async (code: string, fields: Draft["fields"] = {}) => {
    await saveDraft({ ...draft, fields });
    redirect(`/?${new URLSearchParams({ konto: "nowe", blad: code, next })}#logowanie`);
  };
  const local = checkRegistration(draft, terms);
  if (local && Object.keys(local).length) return back(local.acceptedTerms && Object.keys(local).length === 1 ? "terms_not_accepted" : "validation_failed", local);
  let session: Schemas["Session"];
  try {
    session = (await api<Session>("/api/v1/auth/register", {
      method: "POST",
      body: {
        provider: "sandbox_id",
        providerSubject: draft.id,
        email: draft.email,
        role: draft.role,
        affiliation: { name: draft.org, type: draft.type || "other" },
        interests: form.getAll("interests").map(String).slice(0, 20),
        acceptedTerms: terms,
        consentToContact: form.get("consentToContact") === "on",
      },
    })).data;
  } catch (e) {
    const code = e instanceof ApiError ? e.code : "unknown";
    const fields: NonNullable<Draft["fields"]> = {};
    if (e instanceof ApiError) for (const d of e.details) { const m = API_FIELDS[d.field]; if (m && !fields[m[0]]) fields[m[0]] = m[1]; }
    if (code === "terms_not_accepted") fields.acceptedTerms = "errTerms";
    if (code === "account_exists") fields.providerSubject = "errTaken";
    return back(code, fields);
  }
  await clearDraft();
  await startSession(session);
  // The chosen role preselects "Widok dla" on the first results page (proxy.ts reads and deletes this).
  (await cookies()).set(FIRST_AUDIENCE_COOKIE, draft.role, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect(next);
}

export async function signOut() {
  const token = await getToken();
  if (token) await api("/api/v1/auth/logout", { method: "POST", token }).catch(() => undefined);
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEMO_COOKIE);
  store.delete(FIRST_AUDIENCE_COOKIE);
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
  store.delete(FIRST_AUDIENCE_COOKIE);
  redirect("/?konto=usuniete");
}
