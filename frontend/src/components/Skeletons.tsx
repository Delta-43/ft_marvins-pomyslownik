/** Loading skeletons (decorative, aria-hidden): the shape of the next page while it loads during in-app navigation.
 *  Shown by NavigationProgress, which also announces "loading" to screen readers. A first page load never shows them:
 *  it arrives as one complete HTML document, so every page also works without JavaScript. */

/** Generic page: search bar and a grid of cards. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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
    </div>
  );
}

/** Results (/wyniki): search bar, filter panel and a grid of cards. */
export function ResultsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="glass-strong h-14 rounded-full" />
        <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="glass hidden h-fit space-y-5 rounded-[var(--radius-card)] p-5 lg:block">
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
    </div>
  );
}
