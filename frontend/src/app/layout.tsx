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
        <header className="border-b border-krawedz">
          <nav aria-label="Główna" className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-6">
            <Link href="/" aria-label="Pomysłownik, strona główna" className="no-underline"><Logo /></Link>
            <ul className="ml-auto flex items-center gap-5 text-sm">
              {signedIn ? (
                <>
                  {demo && <li className="rounded-full border border-dashed border-atrament px-2.5 py-0.5 text-xs font-bold">Tryb demo</li>}
                  <li><Link href="/szukaj">Szukaj</Link></li>
                  <li><Link href="/wyniki">Wyniki</Link></li>
                  <li>
                    <form action={signOut}>
                      <button type="submit" className="cursor-pointer text-granat underline">Wyloguj</button>
                    </form>
                  </li>
                </>
              ) : (
                <li><Link href="/logowanie">Zaloguj się</Link></li>
              )}
              <li><a href="/design/Komponenty.dc.html">Komponenty</a></li>
              <li><a href="/design/Identyfikacja%20wizualna.dc.html">Identyfikacja</a></li>
            </ul>
          </nav>
        </header>
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <footer className="border-t border-krawedz text-sm text-kamien">
          <div className="mx-auto max-w-6xl px-6 py-4">Pomysłownik! · Hacknation 2026 · podgląd projektu, dane przykładowe</div>
        </footer>
      </body>
    </html>
  );
}
