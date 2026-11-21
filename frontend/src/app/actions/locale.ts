"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/i18n/locale";

/** Footer language switch. Saves the choice for a year; the current page re-renders in that language. */
export async function setLocale(form: FormData) {
  const locale = form.get("locale");
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}
