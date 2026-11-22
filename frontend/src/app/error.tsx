"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Unexpected error inside a page (the header and footer stay). Shows the error id so it can be found in the server logs. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("status");
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="glass mx-auto my-16 max-w-xl space-y-4 rounded-[2rem] p-8 text-center">
      <p aria-hidden="true" className="text-4xl">⚠</p>
      <h1 style={{ fontSize: "1.75rem" }}>{t("errorTitle")}</h1>
      <p className="text-kamien">{t("errorText")}</p>
      {digest && <p className="font-tech text-xs text-kamien">{t("errorId", { id: digest })}</p>}
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button type="button" onClick={() => retry()} className="btn-primary cursor-pointer rounded-full px-6 py-2.5 font-bold">
          {t("retry")}
        </button>
        <Link href="/" className="rounded-full px-5 py-2.5 font-bold">{t("home")}</Link>
      </div>
    </div>
  );
}
