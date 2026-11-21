import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { getLocale, getTranslations } from "next-intl/server";
import { AreaChip, BasisLabel, LevelValue, ScoreValue, TrlValue } from "@/components/CardBits";
import { ApiError, errorKey, pick, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";

type Search = { q?: string; area?: string | string[]; implementationLevel?: string | string[]; audience?: string; strona?: string };
type FacetOption = { value: string; label: Schemas["LocalizedText"]; count: number };
type Facets = { data: Record<"area" | "implementationLevel", FacetOption[]> };
type CardList = { data: Schemas["CardSummary"][]; meta: Schemas["PageMeta"] };

const PAGE = 12;
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

// "Search Results" frame: GET /api/v1/cards with filters from /facets. Signed-in only (proxy + API session).
export default async function ResultsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const [t, tErr, locale] = await Promise.all([getTranslations("results"), getTranslations("errors"), getLocale()]);
  const q = sp.q?.trim() ?? "";
  const areas = list(sp.area);
  const levels = list(sp.implementationLevel);
  const page = Math.max(1, Number(sp.strona) || 1);

  // Filters as they appear in our own URL (used for "back here after sign-in" and paging).
  const filters = new URLSearchParams();
  if (q) filters.set("q", q);
  areas.forEach((a) => filters.append("area", a));
  levels.forEach((l) => filters.append("implementationLevel", l));
  if (sp.audience) filters.set("audience", sp.audience);

  const query = new URLSearchParams(filters);
  query.set("limit", String(PAGE));
  query.set("offset", String((page - 1) * PAGE));

  const here = `/wyniki?${filters}${page > 1 ? `&strona=${page}` : ""}`;
  let cards: CardList | null = null;
  let facets: Facets["data"] | null = null;
  let error: ApiError | null = null;
  try {
    [cards, facets] = await Promise.all([
      authed<CardList>(`/api/v1/cards?${query}`, here),
      authed<Facets>("/api/v1/facets", here).then((r) => r.data),
    ]);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e; // let Next.js handle redirects and real crashes
    error = e;
  }

  const total = cards?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const pageHref = (p: number) => {
    const u = new URLSearchParams(filters);
    if (p > 1) u.set("strona", String(p));
    return `/wyniki?${u}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <SearchBar defaultValue={q} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <form action="/wyniki" aria-label={t("filtersLabel")} className="glass h-fit space-y-6 rounded-[var(--radius-card)] p-5">
          {q && <input type="hidden" name="q" value={q} />}
          {sp.audience && <input type="hidden" name="audience" value={sp.audience} />}
          {facets && ([["area", t("area"), areas], ["implementationLevel", t("level"), levels]] as const).map(([key, name, chosen]) => (
            <fieldset key={key}>
              <legend className="mb-2 font-bold">{name}</legend>
              {facets[key].map((o) => (
                <label key={o.value} className="flex items-center gap-2 py-0.5">
                  <input type="checkbox" name={key} value={o.value} defaultChecked={chosen.includes(o.value)} className="accent-granat" />
                  <span className="flex-1">{pick(o.label, locale)}</span>
                  <span className="font-tech text-xs tabular-nums text-kamien">{o.count}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary flex-1 cursor-pointer rounded-full px-4 py-2 font-bold">{t("filter")}</button>
            <Link href={q ? `/wyniki?q=${encodeURIComponent(q)}` : "/wyniki"} className="rounded-full px-3 py-2 text-sm">{t("clear")}</Link>
          </div>
        </form>

        <section aria-labelledby="results-h">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h1 id="results-h" style={{ fontSize: "1.5rem" }}>{q ? t("titleFor", { q }) : t("titleAll")}</h1>
            {cards && <p className="font-tech text-sm tabular-nums text-kamien">{t("count", { count: total })}</p>}
          </div>

          {error && (
            <div role="alert" className="glass rounded-[var(--radius-card)] p-6">
              <p className="font-bold">{tErr(errorKey(error.code))}</p>
              {error.requestId && <p className="mt-1 font-tech text-xs text-kamien">{t("requestId", { id: error.requestId })}</p>}
            </div>
          )}

          {cards && total === 0 && (
            <div className="glass rounded-[var(--radius-card)] p-6">
              <p className="font-bold">{t("emptyTitle")}</p>
              <p className="text-kamien">{t.rich("emptyText", { clear: (c) => <Link href="/wyniki">{c}</Link> })}</p>
            </div>
          )}

          <ul className="grid gap-5 md:grid-cols-2">
            {cards?.data.map((c) => (
              <li key={c.id} className="glass-strong lift flex flex-col gap-3 rounded-[var(--radius-card)] p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <AreaChip area={c.area} />
                  {c.polishIp && <span className="rounded-full bg-iskra px-2 py-0.5 text-xs font-bold">{t("polishIp")}</span>}
                  {c.stale && <span className="text-xs text-kamien">⏱ {t("stale")}</span>}
                </div>
                <h2 style={{ fontSize: "1.25rem" }}>
                  <Link href={`/karta/${c.id}`} className="text-atrament">{pick(c.title, locale)}</Link>
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
                <p className="font-tech text-xs tabular-nums text-kamien">
                  {t("sources", { count: c.sourceCount })} · <Link href={`/karta/${c.id}#zrodla`}>{t("seeSources")}</Link>
                </p>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <nav aria-label={t("pagesLabel")} className="mt-6 flex items-center justify-center gap-3 font-tech">
              {page > 1 && <Link href={pageHref(page - 1)}>{t("prev")}</Link>}
              <span className="tabular-nums">{page} / {pages}</span>
              {page < pages && <Link href={pageHref(page + 1)}>{t("next")}</Link>}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
