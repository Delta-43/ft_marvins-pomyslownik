import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("title"), description: t("description") };
}

// Fonts: Lato (display), Atkinson Hyperlegible Next (body), Roboto Serif (technical values: scores, counts, TRL, dates, code),
// Atkinson Hyperlegible Mono (landing page labels, as in the brand design). All SIL OFL, EUPL-compatible.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;700&family=Atkinson+Hyperlegible+Mono:wght@400;500&family=Roboto+Serif:opsz,wght@8..144,300..600&family=Lato:wght@400;700&display=swap";

// Root layout: shared by every route. The page chrome lives in the route groups:
// (app)/layout.tsx for the app, and the landing page brings its own header and footer.
// Language (PL/EN) comes from the NEXT_LOCALE cookie via next-intl.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("layout");
  // Client components get just the texts they need (error screens: status; compare selection on /wyniki: compare).
  const { status, compare } = await getMessages();
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="min-h-screen flex flex-col">
        <a className="skip-link" href="#main">{t("skip")}</a>
        <NextIntlClientProvider messages={{ status, compare }}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
