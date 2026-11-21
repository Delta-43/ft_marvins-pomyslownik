import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/actions/auth";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pomysłownik!",
  description: "Odkrywaj istniejące polskie innowacje, ze źródłami i uczciwą oceną.",
};

// Fonts: Lato (display), Atkinson Hyperlegible Next and Mono (body, data). All SIL OFL, EUPL-compatible.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@400;500&family=Atkinson+Hyperlegible+Next:wght@400;500;700&family=Lato:wght@400;700&display=swap";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const demo = store.has(DEMO_COOKIE);
  const signedIn = demo || store.has(SESSION_COOKIE);
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="min-h-screen flex flex-col">
        <a className="skip-link" href="#main">Przejdź do treści</a>
        <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
        <header className="sticky top-0 z-40 px-4 pt-4">
          <nav aria-label="Główna" className="glass mx-auto flex max-w-6xl items-center gap-6 rounded-full py-2.5 pl-5 pr-3">
            <Link href="/" aria-label="Pomysłownik, strona główna" className="no-underline"><Logo /></Link>
            <ul className="ml-auto flex items-center gap-1 text-sm [&_a]:rounded-full [&_a]:px-3 [&_a]:py-1.5 [&_a]:no-underline [&_a]:text-atrament [&_a:not(.btn-liquid):hover]:bg-white/70">
              {signedIn ? (
                <>
                  {demo && <li className="mr-1 rounded-full bg-iskra px-2.5 py-0.5 text-xs font-bold text-atrament shadow-sm">Tryb demo</li>}
                  <li><Link href="/szukaj">Szukaj</Link></li>
                  <li><Link href="/wyniki">Wyniki</Link></li>
                  <li>
                    <form action={signOut}>
                      <button type="submit" className="btn-liquid cursor-pointer rounded-full px-4 py-1.5 font-bold">Wyloguj</button>
                    </form>
                  </li>
                </>
              ) : (
                <li><Link href="/logowanie" className="btn-liquid !text-white font-bold">Zaloguj się</Link></li>
              )}
              <li><a href="/design/Komponenty.dc.html">Komponenty</a></li>
              <li><a href="/design/Identyfikacja%20wizualna.dc.html">Identyfikacja</a></li>
            </ul>
          </nav>
        </header>
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <footer className="px-4 pb-4 text-sm text-kamien">
          <div className="glass mx-auto max-w-6xl rounded-2xl px-6 py-3">Pomysłownik! · Hacknation 2026 · podgląd projektu, dane przykładowe</div>
        </footer>
      </body>
    </html>
  );
}
