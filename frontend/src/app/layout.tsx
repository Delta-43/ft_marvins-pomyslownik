import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pomysłownik!",
  description: "Discover existing Polish innovations, with sources and honest assessments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <a className="skip-link" href="#main">Przejdź do treści / Skip to content</a>
        <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
