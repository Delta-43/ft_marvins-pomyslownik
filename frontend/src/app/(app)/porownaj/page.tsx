import Link from "next/link";
import { AppPage } from "@/components/motion/Motion";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BasisLabel } from "@/components/CardBits";
import { CompareSync } from "@/components/compare/CompareSync";
import { ApiError, errorKey, pick, type Schemas } from "@/lib/api";
import { COMPARE_MAX, COMPARE_MIN } from "@/lib/compare-limits";
import { DATE_LOCALE, isLocale } from "@/i18n/locale";
import { authed } from "@/lib/session";

type Compare = { data: { cards: Schemas["CardSummary"][]; rows: Schemas["CompareRow"][] } };
type Row = Schemas["CompareRow"];
type Cell = Row["cells"][number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SCORES = new Set<Row["key"]>(["innovativeness", "applicationPotential", "credibility"]);
const TECH = new Set<Row["key"]>(["trl", "innovativeness", "applicationPotential", "credibility", "sourceCount", "lastCheckedAt"]);

/** Card ids from the URL. Accepts `ids=a,b` (links, JavaScript) and `ids=a&ids=b` (plain form without JavaScript).
 *  Keeps the order, drops duplicates and anything that is not a card id. */
function parseIds(raw: string | string[] | undefined): string[] {
  const parts = (Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap((v) => v.split(","));
  const seen = new Set<string>();
  return parts.map((p) => p.trim().toLowerCase()).filter((p) => UUID.test(p) && !seen.has(p) && seen.add(p));
}

const hrefFor = (ids: string[]) => (ids.length ? `/porownaj?ids=${ids.join(",")}` : "/porownaj");

// F4 Compare: two to four cards side by side from GET /api/v1/compare. Signed-in only (proxy + API session).
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string | string[] }> }) {
  const [t, tBits, tErr, tRes, locale] = await Promise.all([
    getTranslations("comparePage"),
    getTranslations("bits"),
    getTranslations("errors"),
    getTranslations("results"),
    getLocale(),
  ]);
  const all = parseIds((await searchParams).ids);
  const tooMany = all.length > COMPARE_MAX;
  const ids = all.slice(0, COMPARE_MAX);
  const here = hrefFor(ids);

  // Fewer than two cards: explain, show the one already chosen (if any), and point to the results.
  if (ids.length < COMPARE_MIN) {
    let single: Schemas["Card"] | null = null;
    if (ids.length === 1) {
      single = await authed<{ data: Schemas["Card"] }>(`/api/v1/cards/${ids[0]}`, here)
        .then((r) => r.data)
        .catch((e) => {
          if (!(e instanceof ApiError)) throw e;
          return null;
        });
    }
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-6 py-12">
        <h1 style={{ fontSize: "2rem" }}>{t("needMoreTitle")}</h1>
        <p className="text-kamien">{t("needMoreText")}</p>
        {single && (
          <p className="glass rounded-[var(--radius-card)] p-4">
            {t("chosenSoFar")} <Link href={`/karta/${single.id}`} className="font-bold">{pick(single.title, locale)}</Link>
          </p>
        )}
        <CompareSync items={single ? [{ id: single.id, title: pick(single.title, locale) }] : []} />
        <Link href="/wyniki" className="btn-primary inline-flex rounded-full px-6 py-2.5 font-bold no-underline">{t("goToResults")}</Link>
      </div>
    );
  }

  let result: Compare["data"];
  try {
    result = (await authed<Compare>(`/api/v1/compare?ids=${ids.join(",")}`, here)).data;
  } catch (e) {
    if (!(e instanceof ApiError)) throw e; // redirects (expired session) and real crashes go to Next.js
    if (e.status === 404) {
      return (
        <div role="alert" className="mx-auto max-w-2xl space-y-4 px-6 py-12">
          <h1 style={{ fontSize: "2rem" }}>{t("notFoundTitle")}</h1>
          <p className="text-kamien">{t("notFoundText")}</p>
          <CompareSync items={[]} />
          <Link href="/wyniki" className="btn-primary inline-flex rounded-full px-6 py-2.5 font-bold no-underline">{t("goToResults")}</Link>
        </div>
      );
    }
    return (
      <div role="alert" className="glass mx-auto my-12 max-w-xl rounded-[var(--radius-card)] p-6">
        <p className="font-bold">{tErr(errorKey(e.code))}</p>
        {e.requestId && <p className="mt-1 font-tech text-xs text-kamien">{tRes("requestId", { id: e.requestId })}</p>}
      </div>
    );
  }

  const { cards, rows } = result;
  if (cards.length === 0) notFound();
  const dateTag = DATE_LOCALE[isLocale(locale) ? locale : "pl"];
  const titles = cards.map((c) => pick(c.title, locale));

  /** One value: the number or words, "not enough data" for a missing score, the best-value mark and the basis label. */
  function Value({ row, cell, card }: { row: Row; cell: Cell | undefined; card: Schemas["CardSummary"] }) {
    if (!cell) return <span className="text-kamien">—</span>;
    const missing = cell.raw === null || cell.raw === undefined || cell.raw === "";
    let text: string;
    if (SCORES.has(row.key)) text = missing ? tBits("notEnoughData") : `${cell.raw}/100`;
    // TRL: say why there is no number (only technology cards have one), never echo the raw display text.
    else if (row.key === "trl") text = missing ? (card.trl.applicable ? tBits("notEnoughData") : tBits("notApplicable")) : `TRL ${cell.raw}`;
    else if (row.key === "lastCheckedAt" && typeof cell.raw === "string") text = new Date(cell.raw).toLocaleDateString(dateTag, { day: "2-digit", month: "2-digit", year: "numeric" });
    else text = pick(cell.display, locale) || "—";

    return (
      <div className="flex flex-col items-start gap-1.5">
        <span className={`${TECH.has(row.key) ? "font-tech tabular-nums" : ""} ${missing ? "text-kamien" : "font-semibold"}`}>
          {row.key === "lastCheckedAt" && typeof cell.raw === "string" ? <time dateTime={cell.raw}>{text}</time> : text}
        </span>
        {cell.isBest && !missing && (
          <span className="inline-flex items-center gap-1 rounded-full bg-iskra px-2 py-0.5 text-[0.7rem] font-bold text-atrament">
            <span aria-hidden="true">★</span> {t("best")}
          </span>
        )}
        {cell.basis && !missing && <BasisLabel basis={cell.basis} />}
      </div>
    );
  }

  return (
    <AppPage>
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <CompareSync items={cards.map((c, i) => ({ id: c.id, title: titles[i] }))} />
      <p><Link href="/wyniki">{t("back")}</Link></p>
      <header className="space-y-2">
        <h1 style={{ fontSize: "2.25rem" }}>{t("title")}</h1>
        <p className="text-kamien">{t("lead")}</p>
      </header>

      {tooMany && <p role="status" className="glass rounded-[var(--radius-card)] px-4 py-3 text-sm">{t("tooMany")}</p>}

      <p className="text-sm text-kamien sm:hidden">{t("scrollHint")}</p>
      {/* Scrolls sideways on narrow screens. Focusable so keyboard users can scroll it; the criteria column stays put. */}
      <div
        role="region"
        aria-labelledby="compare-caption"
        tabIndex={0}
        className="glass-strong overflow-x-auto rounded-[var(--radius-card)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-granat"
      >
        <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left text-sm">
          <caption id="compare-caption" className="sr-only">
            {t("caption", { count: cards.length })}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-44 bg-white p-4 align-bottom text-xs font-bold uppercase tracking-wide text-kamien">
                {t("criterion")}
              </th>
              {cards.map((c, i) => {
                const rest = ids.filter((x) => x !== c.id);
                return (
                  <th key={c.id} scope="col" className="min-w-48 border-l border-krawedz p-4 align-top">
                    <Link href={`/karta/${c.id}`} className="font-display text-base font-bold text-atrament" style={{ fontFamily: "var(--font-display)" }}>
                      {titles[i]}
                    </Link>
                    <span className="mt-1 block text-xs font-normal text-kamien">{c.organisation.name}</span>
                    <Link
                      href={rest.length ? hrefFor(rest) : "/porownaj"}
                      aria-label={t("removeNamed", { title: titles[i] })}
                      className="mt-2 inline-block text-xs font-normal"
                    >
                      <span aria-hidden="true">× </span>{t("remove")}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="sticky left-0 z-10 border-t border-krawedz bg-white p-4 align-top font-bold">
                  {pick(row.label, locale)}
                </th>
                {cards.map((c) => (
                  <td key={c.id} className="border-l border-t border-krawedz p-4 align-top">
                    <Value row={row} cell={row.cells.find((x) => x.cardId === c.id)} card={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-sm text-kamien">
        <p>{t("bestLegend")}</p>
        <p>{t("estimateNote")}</p>
      </div>

      {cards.length < COMPARE_MAX && (
        <p><Link href="/wyniki" className="btn-secondary inline-flex rounded-full px-5 py-2 font-bold no-underline">+ {t("addMore")}</Link></p>
      )}
    </div>
    </AppPage>
  );
}
