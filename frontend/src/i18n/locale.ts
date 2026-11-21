/** Site languages. Polish first; the choice is kept in a cookie (no locale in the URL). */
export const LOCALES = ["pl", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pl";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** BCP 47 tag for dates and numbers. */
export const DATE_LOCALE: Record<Locale, string> = { pl: "pl-PL", en: "en-GB" };
