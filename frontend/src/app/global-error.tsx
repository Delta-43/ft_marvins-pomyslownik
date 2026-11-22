"use client"; // Error boundaries must be Client Components.

import { useEffect, useState } from "react";
import pl from "../../messages/pl.json";
import en from "../../messages/en.json";
import "./globals.css";

/** Last resort: the root layout itself failed, so this renders its own <html> and <body>.
 *  No translation provider here, so it reads the dictionaries directly and the language from the cookie. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const [lang, setLang] = useState<"pl" | "en">("pl");
  useEffect(() => {
    if (/(?:^|;\s*)NEXT_LOCALE=en(?:;|$)/.test(document.cookie)) setLang("en");
    console.error(error);
  }, [error]);
  const t = (lang === "en" ? en : pl).status;
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <html lang={lang}>
      <body className="flex min-h-screen items-center justify-center p-6">
        <title>Pomysłownik!</title>
        <div role="alert" className="glass max-w-xl space-y-4 rounded-[2rem] p-8 text-center">
          <h1 style={{ fontSize: "1.75rem" }}>{t.errorTitle}</h1>
          <p className="text-kamien">{t.errorText}</p>
          {digest && <p className="font-tech text-xs text-kamien">{t.errorId.replace("{id}", digest)}</p>}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button type="button" onClick={() => retry()} className="btn-primary cursor-pointer rounded-full px-6 py-2.5 font-bold">{t.retry}</button>
            <a href="/" className="rounded-full px-5 py-2.5 font-bold">{t.home}</a>
          </div>
        </div>
      </body>
    </html>
  );
}
