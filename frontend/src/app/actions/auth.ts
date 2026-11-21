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

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

async function startSession(session: Schemas["Session"], demo = false) {
  const maxAge = Math.max(60, Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1000));
  const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
  const store = await cookies();
  store.set(SESSION_COOKIE, session.token, opts);
  if (demo) store.set(DEMO_COOKIE, "1", opts);
  else store.delete(DEMO_COOKIE);
}

/** Back to the sign-in page with an error code and what the user typed (never the token). */
function back(mode: "logowanie" | "rejestracja", code: string, form: FormData): never {
  const q = new URLSearchParams({ tryb: mode, blad: code, next: safeNext(form.get("next")) });
  const subject = str(form.get("providerSubject"));
  if (subject) q.set("id", subject);
  redirect(`/logowanie?${q}`);
}

export async function signIn(form: FormData) {
  let session: Schemas["Session"];
  try {
    session = (await api<Session>("/api/v1/auth/login", {
      method: "POST",
      body: { provider: "sandbox_id", providerSubject: str(form.get("providerSubject")) },
    })).data;
  } catch (e) {
    const code = e instanceof ApiError ? e.code : "unknown";
    // Unknown identity: go to registration with the identity filled in.
    back(code === "registration_required" ? "rejestracja" : "logowanie", code, form);
  }
  await startSession(session);
  redirect(safeNext(form.get("next")));
}

export async function register(form: FormData) {
  let session: Schemas["Session"];
  try {
    session = (await api<Session>("/api/v1/auth/register", {
      method: "POST",
      body: {
        provider: "sandbox_id",
        providerSubject: str(form.get("providerSubject")),
        email: str(form.get("email")),
        role: str(form.get("role")),
        affiliation: { name: str(form.get("affiliationName")), type: str(form.get("affiliationType")) || "other" },
        interests: form.getAll("interests").map(String).slice(0, 20),
        acceptedTerms: form.get("acceptedTerms") === "on",
        consentToContact: form.get("consentToContact") === "on",
      },
    })).data;
  } catch (e) {
    back("rejestracja", e instanceof ApiError ? e.code : "unknown", form);
  }
  await startSession(session);
  redirect(safeNext(form.get("next")));
}

/** Demo mode: one click signs in to the live API as a shared sandbox identity (default "demo-jury").
 *  The first click registers it. Everything after that is a normal session with real data. */
const DEMO_SUBJECT = process.env.DEMO_IDENTITY ?? "demo-jury";

export async function enterDemoMode(form: FormData) {
  let session: Schemas["Session"];
  try {
    session = (await api<Session>("/api/v1/auth/login", {
      method: "POST",
      body: { provider: "sandbox_id", providerSubject: DEMO_SUBJECT },
    })).data;
  } catch (e) {
    if (!(e instanceof ApiError && e.code === "registration_required")) {
      back("logowanie", e instanceof ApiError ? e.code : "unknown", new FormData());
    }
    try {
      session = (await api<Session>("/api/v1/auth/register", {
        method: "POST",
        body: {
          provider: "sandbox_id",
          providerSubject: DEMO_SUBJECT,
          email: `${DEMO_SUBJECT}@example.invalid`,
          displayName: "Demo",
          role: "investors_business",
          affiliation: { name: "Konto demonstracyjne", type: "other" },
          interests: [],
          acceptedTerms: true,
        },
      })).data;
    } catch (e2) {
      back("logowanie", e2 instanceof ApiError ? e2.code : "unknown", new FormData());
    }
  }
  await startSession(session, true);
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  const token = await getToken();
  if (token) await api("/api/v1/auth/logout", { method: "POST", token }).catch(() => undefined);
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEMO_COOKIE);
  redirect("/");
}

export async function updateRole(form: FormData) {
  const token = await getToken();
  try {
    await api("/api/v1/me", { method: "PATCH", token, body: { role: str(form.get("role")) } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/sesja-wygasla?next=/profil");
    redirect(`/profil?blad=${e instanceof ApiError ? e.code : "unknown"}`);
  }
  redirect("/profil?zapisano=1");
}

/** GDPR: delete the account and its personal data, then end the session. */
export async function deleteAccount() {
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
