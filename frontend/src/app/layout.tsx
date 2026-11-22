import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { parseSettings, SETTINGS_COOKIE } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: { default: t("title"), template: `%s · ${t("title")}` }, description: t("description") };
}

// Fonts (DESIGN.md §2): Lato (display), Atkinson Hyperlegible Next (body), Atkinson Hyperlegible Mono (technical values),
// Roboto with the Cyrillic subset so Ukrainian text never falls back to a system font. All SIL OFL.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;700&family=Atkinson+Hyperlegible+Mono:wght@400;500&family=Lato:wght@400;700&family=Roboto:wght@400;700&display=swap";

// Root layout: shared by every route. The page chrome lives in the route groups. Language (pl, en, uk) and the
// display settings (text size, contrast) come from cookies, so the server renders the right theme with no flash.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, t, store] = await Promise.all([getLocale(), getTranslations("shell"), cookies()]);
  const settings = parseSettings(store.get(SETTINGS_COOKIE)?.value);
  // Client components get only the texts they need.
  const { status, errors } = await getMessages();
  return (
    <html lang={locale} data-text={settings.text} data-contrast={settings.contrast}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a className="skip-link" href="#main">{t("skip")}</a>
        <NextIntlClientProvider messages={{ status, errors }}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
