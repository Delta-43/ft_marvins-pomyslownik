import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { signOut } from "@/app/actions/auth";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/cookie";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("title"), description: t("description") };
}

// Fonts: Lato (display), Atkinson Hyperlegible Next (body), Roboto Serif (technical values: scores, counts, TRL, dates, code). All SIL OFL, EUPL-compatible.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;700&family=Roboto+Serif:opsz,wght@8..144,300..600&family=Lato:wght@400;700&display=swap";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const signedIn = store.has(SESSION_COOKIE);
  const demo = signedIn && store.has(DEMO_COOKIE);
  const locale = await getLocale();
  const t = await getTranslations("layout");
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="min-h-screen flex flex-col">
        <a className="skip-link" href="#main">{t("skip")}</a>
        <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
        <header className="glass-bar sticky top-0 z-40 border-b">
          <nav aria-label={t("navLabel")} className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" aria-label={t("homeLabel")} className="flex items-center no-underline"><Logo /></Link>
            <ul className="ml-auto flex items-center gap-1 text-sm [&_a]:rounded-full [&_a]:px-3 [&_a]:py-1.5 [&_a]:no-underline [&_a]:text-atrament [&_a:not(.btn-primary):hover]:bg-atrament/5">
              {signedIn ? (
                <>
                  {demo && <li className="mr-1 rounded-full bg-iskra px-2.5 py-0.5 text-xs font-bold text-atrament shadow-sm">{t("demoBadge")}</li>}
                  <li><Link href="/szukaj">{t("search")}</Link></li>
                  <li><Link href="/wyniki">{t("results")}</Link></li>
                  <li><Link href="/profil">{t("profile")}</Link></li>
                  <li>
                    <form action={signOut}>
                      <button type="submit" className="btn-primary cursor-pointer rounded-full px-4 py-1.5 font-bold">{t("signOut")}</button>
                    </form>
                  </li>
                </>
              ) : (
                <li><Link href="/logowanie" className="btn-primary !text-white font-bold">{t("signIn")}</Link></li>
              )}
              <li><a href="/design/Komponenty.dc.html">{t("components")}</a></li>
              <li><a href="/design/Identyfikacja%20wizualna.dc.html">{t("identity")}</a></li>
            </ul>
          </nav>
        </header>
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <footer className="glass-bar mt-12 border-t text-sm text-kamien">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <span>{t("footer")}</span>
            <LanguageSwitch />
          </div>
        </footer>
      </body>
    </html>
  );
}
