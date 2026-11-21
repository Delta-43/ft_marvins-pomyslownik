import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { AreaChip, BasisLabel, LEVEL, plural, ScoreValue, TrlValue } from "@/components/CardBits";
import { ApiError, errorMessage, t, type Schemas } from "@/lib/api";
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
        <form action="/wyniki" aria-label="Filtry" className="glass h-fit space-y-6 rounded-[var(--radius-card)] p-5">
          {q && <input type="hidden" name="q" value={q} />}
          {sp.audience && <input type="hidden" name="audience" value={sp.audience} />}
          {facets && ([["area", "Obszar", areas], ["implementationLevel", "Poziom wdrożenia", levels]] as const).map(([key, name, chosen]) => (
            <fieldset key={key}>
              <legend className="mb-2 font-bold">{name}</legend>
              {facets[key].map((o) => (
                <label key={o.value} className="flex items-center gap-2 py-0.5">
                  <input type="checkbox" name={key} value={o.value} defaultChecked={chosen.includes(o.value)} className="accent-granat" />
                  <span className="flex-1">{t(o.label)}</span>
                  <span className="font-tech text-xs tabular-nums text-kamien">{o.count}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-liquid flex-1 cursor-pointer rounded-full px-4 py-2 font-bold">Filtruj</button>
            <Link href={q ? `/wyniki?q=${encodeURIComponent(q)}` : "/wyniki"} className="rounded-full px-3 py-2 text-sm">Wyczyść</Link>
          </div>
        </form>

        <section aria-labelledby="results-h">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h1 id="results-h" style={{ fontSize: "1.5rem" }}>{q ? `Wyniki dla „${q}”` : "Wszystkie innowacje"}</h1>
            {cards && <p className="font-tech text-sm tabular-nums text-kamien">{total} {plural(total, ["wynik", "wyniki", "wyników"])}</p>}
          </div>

          {error && (
            <div role="alert" className="glass rounded-[var(--radius-card)] p-6">
              <p className="font-bold">{errorMessage(error.code)}</p>
              {error.requestId && <p className="mt-1 font-tech text-xs text-kamien">ID zgłoszenia: {error.requestId}</p>}
            </div>
          )}

          {cards && total === 0 && (
            <div className="glass rounded-[var(--radius-card)] p-6">
              <p className="font-bold">Brak wyników.</p>
              <p className="text-kamien">Spróbuj innego słowa lub <Link href="/wyniki">wyczyść filtry</Link>.</p>
            </div>
          )}

          <ul className="grid gap-5 md:grid-cols-2">
            {cards?.data.map((c) => (
              <li key={c.id} className="glass-strong lift flex flex-col gap-3 rounded-[var(--radius-card)] p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <AreaChip area={c.area} />
                  {c.polishIp && <span className="rounded-full bg-iskra px-2 py-0.5 text-xs font-bold">Polska własność intelektualna</span>}
                  {c.stale && <span className="text-xs text-kamien">⏱ Dawno nie sprawdzano</span>}
                </div>
                <h2 style={{ fontSize: "1.25rem" }}>
                  <Link href={`/karta/${c.id}`} className="text-atrament">{t(c.title)}</Link>
                </h2>
                <p className="text-sm text-kamien">{c.organisation.name}</p>
                <p className="text-sm">{t(c.summaryShort)}</p>
                <dl className="mt-auto grid grid-cols-3 gap-2 rounded-2xl bg-white/55 p-3 text-sm ring-1 ring-white/80">
                  <div>
                    <dt className="text-xs text-kamien">Wdrożenie</dt>
                    <dd className="font-tech font-semibold">{LEVEL[c.implementationLevel.value]}</dd>
                    <dd className="mt-1"><BasisLabel basis={c.implementationLevel.basis} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-kamien">Gotowość</dt>
                    <dd><TrlValue trl={c.trl} /></dd>
                    {c.trl.applicable && <dd className="mt-1"><BasisLabel basis={c.trl.basis} /></dd>}
                  </div>
                  <div>
                    <dt className="text-xs text-kamien">Wiarygodność</dt>
                    <dd><ScoreValue value={c.scores.credibility} /></dd>
                  </div>
                </dl>
                <p className="font-tech text-xs tabular-nums text-kamien">
                  {c.sourceCount} {plural(c.sourceCount, ["źródło", "źródła", "źródeł"])} · <Link href={`/karta/${c.id}#zrodla`}>zobacz źródła</Link>
                </p>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <nav aria-label="Strony wyników" className="mt-6 flex items-center justify-center gap-3 font-tech">
              {page > 1 && <Link href={pageHref(page - 1)}>← Poprzednia</Link>}
              <span className="tabular-nums">{page} / {pages}</span>
              {page < pages && <Link href={pageHref(page + 1)}>Następna →</Link>}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
