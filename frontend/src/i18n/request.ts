import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./locale";

// next-intl without i18n routing: the language comes from the LOCALE_COOKIE set by the language menu. A call that
// names a language (`getTranslations({ locale })`, used by <Fit> to reserve space for all three) gets that one.
export default getRequestConfig(async ({ locale: requested }) => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(requested) ? requested : isLocale(value) ? value : DEFAULT_LOCALE;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
