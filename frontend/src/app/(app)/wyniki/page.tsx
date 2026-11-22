import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { getLocale, getTranslations } from "next-intl/server";
import { AreaChip, BasisLabel, LevelValue, ScoreValue, TrlValue } from "@/components/CardBits";
import { CompareBar, CompareToggle } from "@/components/CompareSelection";
import { api, ApiError, errorKey, pick, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";
import { PIP_STATUSES, SORTS, pageOf, parse, resultsHref, toApi, type Search, type Sort, type State } from "@/lib/results-url";

type FacetOption = Schemas["FacetOption"];
type Facets = { data: Record<"area" | "implementationLevel" | "tag" | "region" | "polishIpStatus", FacetOption[]> };
type CardList = { data: Schemas["CardSummary"][]; meta: Schemas["PageMeta"] };

const PAGE = 12;
const TRL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** Voivodeship names, used only when /facets leaves the chosen region out (its count is 0 under the other filters),
 *  so its chip and option still read "Wielkopolskie", not "WP". Codes and English names as the backend uses them. */
const REGION_NAMES: Record<string, Schemas["LocalizedText"]> = {
  DS: { pl: "Dolnośląskie", en: "Lower Silesian" }, KP: { pl: "Kujawsko-pomorskie", en: "Kuyavian-Pomeranian" },
  LU: { pl: "Lubelskie", en: "Lublin" }, LB: { pl: "Lubuskie", en: "Lubusz" }, LD: { pl: "Łódzkie", en: "Łódź" },
  MA: { pl: "Małopolskie", en: "Lesser Poland" }, MZ: { pl: "Mazowieckie", en: "Masovian" }, OP: { pl: "Opolskie", en: "Opole" },
  PK: { pl: "Podkarpackie", en: "Subcarpathian" }, PD: { pl: "Podlaskie", en: "Podlaskie" }, PM: { pl: "Pomorskie", en: "Pomeranian" },
  SL: { pl: "Śląskie", en: "Silesian" }, SK: { pl: "Świętokrzyskie", en: "Holy Cross" }, WN: { pl: "Warmińsko-mazurskie", en: "Warmian-Masurian" },
  WP: { pl: "Wielkopolskie", en: "Greater Poland" }, ZP: { pl: "Zachodniopomorskie", en: "West Pomeranian" },
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// "Search Results" frame: GET /api/v1/cards with filters from /facets. Signed-in only (proxy + API session).
export default async function ResultsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const [t, tErr, locale] = await Promise.all([getTranslations("results"), getTranslations("errors"), getLocale()]);
  const s = parse(sp);
  const page = pageOf(sp);
  const sort: Sort = s.sort ?? (s.q ? "relevance" : "recent");

  const apiFilters = toApi(s);
  const cardsQuery = new URLSearchParams(apiFilters);
  cardsQuery.set("sort", sort);
  cardsQuery.set("limit", String(PAGE));
  cardsQuery.set("offset", String((page - 1) * PAGE));

  /** Link to these results with some filters changed. Changing a filter always goes back to page 1. */
  const href = (patch: Partial<State> = {}) => resultsHref({ ...s, ...patch });
  const pageHref = (p: number) => resultsHref(s, p);
  const here = pageHref(page); // "back here after sign-in"

  const load = () =>
    Promise.all([
      authed<CardList>(`/api/v1/cards?${cardsQuery}`, here),
      authed<Facets>(`/api/v1/facets?${apiFilters}`, here).then((r) => r.data),
      // Only for the chip label of an audience preset. Public endpoint; a failure just shows the id.
      s.audience ? api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data, () => []) : Promise.resolve([]),
    ]);

  let cards: CardList | null = null;
  let facets: Facets["data"] | null = null;
  let audiences: Schemas["Audience"][] = [];
  let error: ApiError | null = null;
  try {
    try {
      [cards, facets, audiences] = await load();
    } catch (e) {
      // Rate limited: wait for Retry-After (if short) and retry once, as FRONTEND-START asks.
      const after = e instanceof ApiError && e.status === 429 ? Number(e.retryAfter ?? 1) : NaN;
      if (!(after >= 0 && after <= 3)) throw e;
      await wait(after * 1000);
      [cards, facets, audiences] = await load();
    }
  } catch (e) {
    if (!(e instanceof ApiError)) throw e; // let Next.js handle redirects and real crashes
    error = e;
  }

  const total = cards?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  // Facet options, keeping chosen values visible even when their count drops to 0 or they fall outside the top 50,
  // so re-submitting the form never silently drops a filter.
  const withChosen = (options: FacetOption[] | undefined, chosen: string[], names: Record<string, Schemas["LocalizedText"]> = {}): FacetOption[] => {
    const opts = options ?? [];
    const missing = chosen.filter((v) => !opts.some((o) => o.value === v)).map((v) => ({ value: v, label: names[v] ?? { pl: v, en: v }, count: 0 }));
    return [...opts, ...missing];
  };
  const regionOptions = withChosen(facets?.region, s.region ? [s.region] : [], REGION_NAMES);
  const tagOptions = withChosen(facets?.tag, s.tags);
  const pipOptions = (facets?.polishIpStatus ?? []).filter((o) => (PIP_STATUSES as readonly string[]).includes(o.value));
  const labelOf = (options: FacetOption[] | undefined, value: string) => {
    const o = options?.find((x) => x.value === value);
    return o ? pick(o.label, locale) || value : value;
  };

  // Active filter chips. Each one is a link that removes just that filter.
  const chips: { key: string; label: string; href: string }[] = [
    ...(s.q ? [{ key: "q", label: t("chipQuery", { q: s.q }), href: href({ q: "", sort: s.sort === "relevance" ? undefined : s.sort }) }] : []),
    ...s.areas.map((v) => ({ key: `area-${v}`, label: `${t("area")}: ${labelOf(facets?.area, v)}`, href: href({ areas: s.areas.filter((x) => x !== v) }) })),
    ...s.levels.map((v) => ({ key: `level-${v}`, label: `${t("level")}: ${labelOf(facets?.implementationLevel, v)}`, href: href({ levels: s.levels.filter((x) => x !== v) }) })),
    ...(s.trlMin ? [{ key: "trlMin", label: t("chipTrlMin", { n: s.trlMin }), href: href({ trlMin: undefined }) }] : []),
    ...(s.trlMax ? [{ key: "trlMax", label: t("chipTrlMax", { n: s.trlMax }), href: href({ trlMax: undefined }) }] : []),
    ...s.pip.map((v) => ({ key: `pip-${v}`, label: `${t("polishIpFilter")}: ${labelOf(facets?.polishIpStatus, v)}`, href: href({ pip: s.pip.filter((x) => x !== v) }) })),
    ...(s.region ? [{ key: "region", label: `${t("region")}: ${labelOf(regionOptions, s.region)}`, href: href({ region: undefined }) }] : []),
    ...s.tags.map((v) => ({ key: `tag-${v}`, label: `${t("tags")}: ${labelOf(facets?.tag, v)}`, href: href({ tags: s.tags.filter((x) => x !== v) }) })),
    ...(s.audience
      ? [{ key: "audience", label: t("chipAudience", { name: pick(audiences.find((a) => a.id === s.audience)?.label, locale) || s.audience }), href: href({ audience: undefined }) }]
      : []),
  ];
  const activeFilters = chips.filter((c) => c.key !== "q").length;
  const clearAll = s.sort && s.sort !== "relevance" ? `/wyniki?sort=${s.sort}` : "/wyniki";

  const errorText = error
    ? error.code === "rate_limited" && error.retryAfter
      ? t("rateLimited", { s: Number(error.retryAfter) || 1 })
      : tErr(errorKey(error.code))
    : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <SearchBar defaultValue={s.q} />
      {/* Phones and tablets: the filter panel opens with this link (CSS :target, so it works without JavaScript). */}
      <a
        href="#filters"
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/80 px-4 py-2 font-bold text-atrament no-underline ring-1 ring-atrament/20 lg:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        {t("showFilters", { count: activeFilters })}
      </a>
      <div className="mt-5 grid grid-cols-1 gap-8 lg:mt-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <form id="filters" action="/wyniki" aria-label={t("filtersLabel")} className="glass hidden h-fit scroll-mt-20 space-y-6 rounded-[var(--radius-card)] p-5 target:block lg:block">
          <a href="#results-h" className="float-right -mr-1 -mt-1 inline-flex min-h-11 items-center rounded-full px-3 text-sm lg:hidden">{t("hideFilters")}</a>
          {s.q && <input type="hidden" name="q" value={s.q} />}
          {s.audience && <input type="hidden" name="audience" value={s.audience} />}

          {facets && ([["area", t("area"), s.areas], ["implementationLevel", t("level"), s.levels]] as const).map(([key, name, chosen]) => (
            <fieldset key={key}>
              <legend className="mb-2 font-bold">{name}</legend>
              {facets[key].map((o) => (
                <label key={o.value} className="flex items-center gap-2 py-0.5">
                  <input type="checkbox" name={key} value={o.value} defaultChecked={(chosen as readonly string[]).includes(o.value)} className="accent-granat" />
                  <span className="flex-1">{pick(o.label, locale)}</span>
                  <span className="font-tech text-xs tabular-nums text-kamien">{o.count}</span>
                </label>
              ))}
            </fieldset>
          ))}

          <fieldset aria-describedby="trl-hint">
            <legend className="mb-1 font-bold">{t("trl")}</legend>
            <p id="trl-hint" className="mb-2 text-xs text-kamien">{t("trlHint")}</p>
            <div className="flex items-center gap-2">
              {([["trlMin", t("trlMin"), s.trlMin], ["trlMax", t("trlMax"), s.trlMax]] as const).map(([name, label, value]) => (
                <div key={name} className="flex flex-1 flex-col gap-1 text-sm">
                  <label htmlFor={name}>{label}</label>
                  <select id={name} name={name} defaultValue={value ? String(value) : ""} className="rounded-[12px] bg-white/80 px-2 py-1.5 font-tech ring-1 ring-atrament/20">
                    <option value="">{t("trlAny")}</option>
                    {TRL_STEPS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>

          {pipOptions.length > 0 && (
            <fieldset>
              <legend className="mb-2 font-bold">{t("polishIpFilter")}</legend>
              {pipOptions.map((o) => (
                <label key={o.value} className="flex items-start gap-2 py-0.5">
                  <input type="checkbox" name="polishIpStatus" value={o.value} defaultChecked={(s.pip as string[]).includes(o.value)} className="mt-1 accent-granat" />
                  <span className="flex-1">{pick(o.label, locale)}</span>
                  <span className="font-tech text-xs tabular-nums text-kamien">{o.count}</span>
                </label>
              ))}
            </fieldset>
          )}

          {regionOptions.length > 0 && (
            <div>
              <label htmlFor="region" className="mb-2 block font-bold">{t("region")}</label>
              <select id="region" name="region" defaultValue={s.region ?? ""} className="w-full rounded-[12px] bg-white/80 px-2 py-1.5 ring-1 ring-atrament/20">
                <option value="">{t("regionAny")}</option>
                {regionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{t("optionCount", { label: pick(o.label, locale), count: o.count })}</option>
                ))}
              </select>
            </div>
          )}

          {tagOptions.length > 0 && (
            <details open={s.tags.length > 0} className="group">
              <summary className="cursor-pointer font-bold">
                {t("tags")} <span className="font-tech text-xs font-normal tabular-nums text-kamien">({tagOptions.length})</span>
              </summary>
              <fieldset className="mt-2 max-h-64 space-y-0.5 overflow-y-auto pr-1">
                <legend className="sr-only">{t("tags")}</legend>
                {tagOptions.map((o) => (
                  <label key={o.value} className="flex items-center gap-2 py-0.5 text-sm">
                    <input type="checkbox" name="tag" value={o.value} defaultChecked={s.tags.includes(o.value)} className="accent-granat" />
                    <span className="flex-1">{pick(o.label, locale)}</span>
                    <span className="font-tech text-xs tabular-nums text-kamien">{o.count}</span>
                  </label>
                ))}
              </fieldset>
            </details>
          )}

          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary flex-1 cursor-pointer rounded-full px-4 py-2 font-bold">{t("filter")}</button>
            <Link href={href({ areas: [], levels: [], trlMin: undefined, trlMax: undefined, pip: [], region: undefined, tags: [], audience: undefined })} className="rounded-full px-3 py-2 text-sm">
              {t("clear")}
            </Link>
          </div>
        </form>

        <section aria-labelledby="results-h" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 id="results-h" tabIndex={-1} className="scroll-mt-20" style={{ fontSize: "1.5rem" }}>{s.q ? t("titleFor", { q: s.q }) : t("titleAll")}</h1>
              {cards && <p className="font-tech text-sm tabular-nums text-kamien">{t("count", { count: total })}</p>}
            </div>
            {/* Part of the filter form (form="filters"), so sorting keeps the filters and filtering keeps the sort. */}
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1 text-sm">
                <label htmlFor="sort">{t("sortLabel")}</label>
                <select id="sort" name="sort" form="filters" defaultValue={sort} className="rounded-[12px] bg-white/80 px-2 py-1.5 ring-1 ring-atrament/20">
                  {SORTS.filter((o) => o !== "relevance" || s.q).map((o) => <option key={o} value={o}>{t(`sort.${o}`)}</option>)}
                </select>
              </div>
              <button type="submit" form="filters" className="cursor-pointer rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold ring-1 ring-atrament/20">
                {t("sortApply")}
              </button>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-5">
              <h2 id="active-h" className="sr-only">{t("activeLabel")}</h2>
              <ul aria-labelledby="active-h" className="flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <li key={c.key}>
                    <Link href={c.href} aria-label={t("removeFilterNamed", { label: c.label })} className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-sm text-atrament no-underline ring-1 ring-atrament/20 hover:bg-white">
                      {c.label}
                      <span aria-hidden="true" className="text-kamien">×</span>
                    </Link>
                  </li>
                ))}
                {chips.length > 1 && (
                  <li><Link href={clearAll} className="px-2 text-sm">{t("clearAll")}</Link></li>
                )}
              </ul>
            </div>
          )}

          {error && (
            <div role="alert" className="glass rounded-[var(--radius-card)] p-6">
              <p className="font-bold">{errorText}</p>
              <p className="mt-2"><Link href={here}>{t("retry")}</Link></p>
              {error.requestId && <p className="mt-1 font-tech text-xs text-kamien">{t("requestId", { id: error.requestId })}</p>}
            </div>
          )}

          {cards && total === 0 && (
            <div className="glass rounded-[var(--radius-card)] p-6">
              <p className="font-bold">{t("emptyTitle")}</p>
              <p className="text-kamien">{t.rich("emptyText", { clear: (c) => <Link href="/wyniki">{c}</Link> })}</p>
            </div>
          )}

          {cards && total > 0 && cards.data.length === 0 && (
            <div className="glass rounded-[var(--radius-card)] p-6">
              <p className="font-bold">{t("pageEmpty")}</p>
              <p><Link href={pageHref(1)}>{t("firstPage")}</Link></p>
            </div>
          )}

          {cards && cards.data.length > 0 && (
            <ul className="grid gap-5 md:grid-cols-2">
              {cards.data.map((c) => {
                const title = pick(c.title, locale);
                return (
                  <li key={c.id} className="glass-strong lift flex flex-col gap-3 rounded-[var(--radius-card)] p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <AreaChip area={c.area} />
                      {c.polishIp && <span className="rounded-full bg-iskra px-2 py-0.5 text-xs font-bold">{t("polishIp")}</span>}
                      {c.stale && <span className="text-xs text-kamien">⏱ {t("stale")}</span>}
                    </div>
                    <h2 style={{ fontSize: "1.25rem" }}>
                      <Link href={`/karta/${c.id}`} className="text-atrament">{title}</Link>
                    </h2>
                    <p className="text-sm text-kamien">{c.organisation.name}</p>
                    <p className="text-sm">{pick(c.summaryShort, locale)}</p>
                    <dl className="mt-auto grid grid-cols-3 gap-2 rounded-2xl bg-white/55 p-3 text-sm ring-1 ring-white/80">
                      <div>
                        <dt className="text-xs text-kamien">{t("colLevel")}</dt>
                        <dd className="font-tech font-semibold"><LevelValue level={c.implementationLevel.value} /></dd>
                        <dd className="mt-1"><BasisLabel basis={c.implementationLevel.basis} /></dd>
                      </div>
                      <div>
                        <dt className="text-xs text-kamien">{t("colTrl")}</dt>
                        <dd><TrlValue trl={c.trl} /></dd>
                        {c.trl.applicable && <dd className="mt-1"><BasisLabel basis={c.trl.basis} /></dd>}
                      </div>
                      <div>
                        <dt className="text-xs text-kamien">{t("colCredibility")}</dt>
                        <dd><ScoreValue value={c.scores.credibility} /></dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-tech text-xs tabular-nums text-kamien">
                        {t("sources", { count: c.sourceCount })} · <Link href={`/karta/${c.id}#zrodla`}>{t("seeSources")}</Link>
                      </p>
                      <CompareToggle id={c.id} title={title} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {pages > 1 && (
            <nav aria-label={t("pagesLabel")} className="mt-6 font-tech">
              <ul className="flex items-center justify-center gap-3">
                {page > 1 && <li><Link href={pageHref(page - 1)} rel="prev">{t("prev")}</Link></li>}
                <li aria-current="page" className="tabular-nums">{t("pageOf", { page: Math.min(page, pages), pages })}</li>
                {page < pages && <li><Link href={pageHref(page + 1)} rel="next">{t("next")}</Link></li>}
              </ul>
            </nav>
          )}

          {cards && total > 0 && <CompareBar />}
        </section>
      </div>
    </div>
  );
}
