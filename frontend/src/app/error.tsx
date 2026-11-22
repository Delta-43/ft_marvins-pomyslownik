"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Unexpected error inside a page (the header and footer stay). Shows the error id so it can be found in the logs. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("status");
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main id="main" role="alert" className="panel-surface mx-auto my-16 max-w-xl space-y-4 p-8 text-center">
      <h1 className="text-h2">{t("errorTitle")}</h1>
      <p className="text-kamien">{t("errorText")}</p>
      {digest && <p className="tech text-caption text-kamien">{t("errorId", { id: digest })}</p>}
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button type="button" onClick={() => retry()} className="btn btn-primary">{t("retry")}</button>
        <Link href="/" className="btn btn-ghost">{t("home")}</Link>
      </div>
    </main>
  );
}
