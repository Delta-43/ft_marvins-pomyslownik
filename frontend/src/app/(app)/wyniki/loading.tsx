import { getTranslations } from "next-intl/server";

/** Results skeleton (F2): search bar, filter panel and a grid of cards, shown while /cards and /facets load.
 *  Sighted users see the shape of the page; screen readers hear one polite "loading results" message. */
export default async function ResultsLoading() {
  const t = await getTranslations("status");
  return (
    <div className="mx-auto max-w-6xl px-6 py-8" aria-busy="true">
      <p role="status" aria-live="polite" className="sr-only">{t("loadingResults")}</p>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="glass-strong h-14 rounded-full" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="glass h-fit space-y-5 rounded-[var(--radius-card)] p-5">
            {[0, 1, 2].map((g) => (
              <div key={g} className="space-y-2">
                <div className="h-5 w-28 rounded-full bg-white/80" />
                {[0, 1, 2].map((i) => <div key={i} className="h-4 w-full rounded-full bg-white/60" />)}
              </div>
            ))}
            <div className="h-10 rounded-full bg-white/70" />
          </div>
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div className="space-y-2">
                <div className="h-7 w-56 rounded-full bg-white/80" />
                <div className="h-4 w-24 rounded-full bg-white/60" />
              </div>
              <div className="h-9 w-40 rounded-full bg-white/70" />
            </div>
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
        </div>
      </div>
      <p aria-hidden="true" className="mt-6 text-center text-sm text-kamien">{t("loadingLabel")}</p>
    </div>
  );
}
