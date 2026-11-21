import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pomysłownik!",
  description: "Odkrywaj istniejące polskie innowacje, ze źródłami i uczciwą oceną.",
};

// Fonts: Lato (display), Atkinson Hyperlegible Next and Mono (body, data). All SIL OFL, EUPL-compatible.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@400;500&family=Atkinson+Hyperlegible+Next:wght@400;500;700&family=Lato:wght@400;700&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
            <ul className="ml-auto flex gap-5 text-sm">
              <li><Link href="/logowanie">Logowanie</Link></li>
              <li><Link href="/">Szukaj</Link></li>
              <li><Link href="/wyniki">Wyniki</Link></li>
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
