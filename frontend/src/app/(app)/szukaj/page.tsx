import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/SearchBar";
import { AppPage, Piece, T } from "@/components/motion/Motion";
import { api, ApiError, pick, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";

// The platform's main audience: universities, labs and scientific institutions. Shown first and highlighted.
const MAIN_AUDIENCE: Schemas["AudienceId"] = "universities";

/** A preset goes to /wyniki with its default filters written out, so the filter boxes there show as ticked. */
function presetHref(a: Schemas["Audience"]): string {
  const u = new URLSearchParams({ audience: a.id });
  const f = a.defaultFilters ?? {};
  for (const [key, values] of Object.entries(f)) {
    if (Array.isArray(values)) values.forEach((v) => u.append(key, String(v)));
    else if (values !== undefined && values !== null) u.set(key, String(values));
  }
  return `/wyniki?${u}`;
}

// "Search Page" frame (/szukaj, signed-in only): search bar, six audience presets, overview numbers, how it works.
// Motion: arrives through the opening sweep; the search bar glides to the results and back (Motion.tsx).
export default async function SearchPage() {
  const [t, locale] = await Promise.all([getTranslations("search"), getLocale()]);

  const [audiences, overview] = await Promise.all([
    // Public endpoint. The six audiences from the task, each with its default filters.
    api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data).catch(() => []),
    // Needs a session. A 401 is handled inside authed() (back to sign-in); any other failure shows a short note.
    authed<{ data: Schemas["OverviewStats"] }>("/api/v1/stats/overview", "/szukaj")
      .then((r) => r.data)
      .catch((e) => {
        if (!(e instanceof ApiError)) throw e;
        return null;
      }),
  ]);

  const sorted = [...audiences].sort((a, b) => Number(b.id === MAIN_AUDIENCE) - Number(a.id === MAIN_AUDIENCE));
  const num = new Intl.NumberFormat(locale);
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });

  const stats = overview
    ? [
        { value: num.format(overview.cardCount), label: t("statCards") },
        { value: num.format(overview.sourceCount), label: t("statSources") },
        { value: pct.format(overview.confirmedFieldShare), label: t("statConfirmed") },
        {
          value: overview.lastRefreshAt ? date(overview.lastRefreshAt) : t("statNever"),
          label: t("statRefresh"),
          iso: overview.lastRefreshAt ?? undefined,
        },
      ]
    : [];

  const steps = [1, 2, 3] as const;

  return (
    <AppPage>
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-12 px-6 py-16 text-center">
      <section className="flex w-full flex-col items-center gap-8">
        <Piece name="title" i={1} className="flex flex-col items-center gap-8">
            <h1 className="text-5xl sm:text-6xl">
              {t.rich("title", { hl: (c) => <span className="bg-gradient-to-r from-granat to-[#6B4FC8] bg-clip-text text-transparent">{c}</span> })}
            </h1>
            <p className="max-w-xl text-lg text-kamien">{t("lead")}</p>
        </Piece>
        <div className="w-full max-w-3xl"><SearchBar large /></div>
      </section>

      <Piece name="presets" i={3} className="w-full">
      <section aria-labelledby="presets-h" className="w-full">
        <h2 id="presets-h" className="mb-1 font-bold" style={{ fontSize: "1rem" }}>{t("audiences")}</h2>
        <p className="mb-4 text-sm text-kamien">{t("audiencesHint")}</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {sorted.map((a) => {
            const main = a.id === MAIN_AUDIENCE;
            return (
              <li key={a.id}>
                <Link
                  href={presetHref(a)}
                  transitionTypes={[T.search]}
                  title={pick(a.description, locale)}
                  aria-describedby={main ? "main-audience-note" : undefined}
                  className={
                    main
                      ? "btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold no-underline transition-transform active:scale-[0.96]"
                      : "glass lift inline-block rounded-full px-4 py-2 text-sm font-medium text-atrament no-underline hover:bg-iskra/80 active:scale-[0.96]"
                  }
                >
                  {main && <span aria-hidden="true">★</span>}
                  {pick(a.label, locale)}
                </Link>
              </li>
            );
          })}
        </ul>
        <p id="main-audience-note" className="mt-3 text-xs text-kamien">★ {t("mainAudience")}</p>
      </section>
      </Piece>

      <Piece name="overview" i={5} className="w-full">
      <section aria-labelledby="overview-h" className="w-full">
        <h2 id="overview-h" className="mb-4" style={{ fontSize: "1.5rem" }}>{t("overviewTitle")}</h2>
        {overview ? (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="glass flex min-w-0 flex-col-reverse gap-1 rounded-[var(--radius-card)] p-4 sm:p-5">
                <dt className="text-sm text-kamien">{s.label}</dt>
                <dd className="font-tech text-2xl font-semibold tabular-nums break-words sm:text-3xl">
                  {s.iso ? <time dateTime={s.iso}>{s.value}</time> : s.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p role="status" className="glass rounded-[var(--radius-card)] p-5 text-kamien">{t("overviewError")}</p>
        )}
        {overview && <p className="mt-3 text-xs text-kamien">{t("overviewNote")}</p>}
      </section>
      </Piece>

      <Piece name="how" i={7} className="w-full">
      <section aria-labelledby="how-h" className="w-full">
        <h2 id="how-h" className="mb-4" style={{ fontSize: "1.5rem" }}>{t("howTitle")}</h2>
        <ol className="grid gap-4 text-left sm:grid-cols-3">
          {steps.map((n) => (
            <li key={n} className="glass flex gap-4 rounded-[var(--radius-card)] p-5">
              <span aria-hidden="true" className="font-tech grid h-10 w-10 shrink-0 place-items-center rounded-full bg-granat text-lg font-semibold text-papier">{n}</span>
              <div>
                <h3 className="mb-1" style={{ fontSize: "1.1rem" }}>{t(`howStep${n}Title`)}</h3>
                <p className="text-sm text-kamien">{t(`howStep${n}Text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      </Piece>
    </div>
    </AppPage>
  );
}
