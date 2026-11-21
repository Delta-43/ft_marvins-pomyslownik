import { getTranslations } from "next-intl/server";

/** Shown instantly while a page waits for the API (wraps every page in a Suspense boundary).
 *  Glass skeleton for sighted users, a polite live-region message for screen readers. */
export default async function Loading() {
  const t = await getTranslations("status");
  return (
    <div className="mx-auto max-w-6xl px-6 py-8" aria-busy="true">
      <p role="status" aria-live="polite" className="sr-only">{t("loadingResults")}</p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="glass-strong h-14 rounded-full" />
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass space-y-3 rounded-[var(--radius-card)] p-6">
              <div className="h-5 w-24 rounded-full bg-white/70" />
              <div className="h-6 w-3/4 rounded-full bg-white/80" />
              <div className="h-4 w-1/2 rounded-full bg-white/60" />
              <div className="h-16 rounded-2xl bg-white/50" />
            </div>
          ))}
        </div>
      </div>
      <p aria-hidden="true" className="mt-6 text-center text-sm text-kamien">{t("loadingLabel")}</p>
    </div>
  );
}
