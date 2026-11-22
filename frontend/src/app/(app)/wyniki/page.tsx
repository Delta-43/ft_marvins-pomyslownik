import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { recordEvent } from "@/app/actions/events";
import { CardDetail, ResultCard, type Labels } from "@/components/Cards";
import { FilterAuto } from "@/components/FilterAuto";
import { Icon } from "@/components/Icons";
import { PageMove } from "@/components/motion/Motion";
import { ResultsClient } from "@/components/ResultsClient";
import { SearchForm } from "@/components/SearchForm";
import { text } from "@/lib/api";
import { attempt, getAudiences, getCard, getCompare, getFacets, getHistory, getSimilar, isFailure, listCards, PAGE_SIZE, type Failure } from "@/lib/data";
import { pageOf, parse, resultsHref, viewOf, type Search, type State } from "@/lib/results-url";
import { fitter } from "@/components/Fit";

const SWATCH: Record<string, string> = { technological: "var(--color-laboratoria)", educational: "var(--color-uczelnie)", administrative: "var(--color-patenty)" };
const SORTS = ["recent", "relevance", "innovativeness", "applicationPotential", "credibility"] as const;
const PATH = "/wyniki";

/** Every state of this screen has its own title (the open card, the search, the page number), so the browser tab,
 *  the history and the route announcer tell them apart. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const sp = await searchParams;
  const [t, locale] = await Promise.all([getTranslations("res"), getLocale()]);
  const s = parse(sp);
  const page = pageOf(sp);
  const { karta } = viewOf(sp);
  if (karta) {
    const card = await attempt(getCard(karta, PATH));
    if (!isFailure(card)) return { title: text(card.title, locale) };
    if (card.status === 404) return { title: (await getTranslations("kard"))("missingTitle") };
  }
  return { title: [s.q ? t("metaTitleFor", { q: s.q }) : t("metaTitle"), page > 1 ? t("metaPage", { n: page }) : ""].filter(Boolean).join(", ") };
}

const byValue = (list: { value: string; label: Parameters<typeof text>[0] }[] | undefined, locale: string) =>
  Object.fromEntries((list ?? []).map((o) => [o.value, text(o.label, locale)]));

/** Results. The list, the filters and the open card all come from the URL, so every state is a link and the screen
 *  works without JavaScript. With `karta=<id>` the card takes the place of the list in the same column. */
export default async function ResultsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const s = parse(sp);
  const page = pageOf(sp);
  const view = viewOf(sp);
  const [t, tk, ts, locale] = await Promise.all([getTranslations("res"), getTranslations("kard"), getTranslations("shell"), getLocale()]);
  const [ft, ftk] = await Promise.all([fitter("res"), fitter("kard")]);

  const [facets, audiences, list, card, hist] = await Promise.all([
    attempt(getFacets(s, PATH)),
    attempt(getAudiences(PATH)),
    view.karta ? null : attempt(listCards(s, page, PATH)),
    view.karta ? attempt(getCard(view.karta, PATH)) : null,
    view.karta ? attempt(getHistory(view.karta, PATH)) : null,
  ]);

  // The open card's neighbours: cards the backend already linked as related work, else the most similar ones.
  let compare = null, history = null;
  if (card && !isFailure(card)) {
    void recordEvent("card_viewed", { cardId: card.id, area: card.area });
    const related = (card.relatedWork ?? []).filter((w) => w.kind === "card" && w.cardId).map((w) => w.cardId as string);
    const similar = related.length ? null : await attempt(getSimilar(card.id, PATH));
    const others = (related.length ? related : similar && !isFailure(similar) ? similar.map((x) => x.card.id) : []).filter((id) => id !== card.id).slice(0, 3);
    if (others.length) { const c = await attempt(getCompare([card.id, ...others], PATH)); compare = isFailure(c) ? null : c; }
    history = !hist || isFailure(hist) ? null : hist;
  } else if (list && !isFailure(list) && s.q && page === 1) {
    void recordEvent("search_performed", { audience: s.audience });
  }

  const f = isFailure(facets) ? null : facets;
  const aud = isFailure(audiences) ? [] : audiences;
  const labels: Labels = { area: byValue(f?.area, locale), level: byValue(f?.implementationLevel, locale), region: byValue(f?.region, locale) };
  const tagLabels = byValue(f?.tag, locale);
  const total = list && !isFailure(list) ? list.meta.total : null;
  const pages = total ? Math.ceil(total / PAGE_SIZE) : 0;
  const sort = s.sort ?? (s.q ? "relevance" : "recent");
  const listHref = resultsHref(s, page);
  const cleared: State = { ...s, areas: [], levels: [], pip: [], tags: [], trlMin: undefined, trlMax: undefined, region: undefined, audience: undefined, minCred: undefined };
  const openId = card && !isFailure(card) ? card.id : undefined;

  const chips: [string, string][] = [];
  if (s.audience) chips.push([t("chipAudience", { x: text(aud.find((a) => a.id === s.audience)?.label, locale) || s.audience }), resultsHref({ ...s, audience: undefined })]);
  s.areas.forEach((v) => chips.push([labels.area[v] ?? v, resultsHref({ ...s, areas: s.areas.filter((x) => x !== v) })]));
  s.levels.forEach((v) => chips.push([labels.level[v] ?? v, resultsHref({ ...s, levels: s.levels.filter((x) => x !== v) })]));
  if (s.trlMin || s.trlMax) chips.push([t("chipTrl", { a: s.trlMin ?? 1, b: s.trlMax ?? 9 }), resultsHref({ ...s, trlMin: undefined, trlMax: undefined })]);
  if (s.region) chips.push([labels.region[s.region] ?? s.region, resultsHref({ ...s, region: undefined })]);
  if (s.minCred) chips.push([t("chipCred", { n: s.minCred }), resultsHref({ ...s, minCred: undefined })]);
  if (s.pip.includes("confirmed")) chips.push([t("chipIp"), resultsHref({ ...s, pip: s.pip.filter((x) => x !== "confirmed") })]);
  s.tags.forEach((v) => chips.push([t("chipTag", { x: tagLabels[v] ?? v }), resultsHref({ ...s, tags: s.tags.filter((x) => x !== v) })]));

  const trlOptions = [<option key="" value="">{t("any")}</option>, ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => <option key={v} value={v}>{v}</option>)];
  const countSr = <span className="sr-only">{ft("countSr")}</span>;
  const failure = (e: Failure, retryHref: string, forCard = false) => (
    <div className="empty">
      <h1 id={forCard ? "dTitle" : "rTitle"} tabIndex={-1}>{ft("errTitle")}</h1>
      <div className="msg msg-err" role="alert">
        <Icon name="alert" />
        <div className="msg-body">
          <p><b>{ft("errLead")}</b> {e.status === 429 ? t("rateText") : t("errText")}</p>
          {e.requestId && <p className="mono reqid">{ft("reqId")}: {e.requestId}</p>}
        </div>
      </div>
      <p className="actions">
        <Link className="btn btn-secondary btn-sm" href={retryHref}>{ft("retry")}</Link>
        {forCard && <Link className="btn btn-text btn-sm" href={listHref}>{ftk("back")}</Link>}
      </p>
    </div>
  );
  // A sliding window of page numbers around the current one.
  const window7 = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);

  return (
    <>
    <PageMove />
    <div className="results-page">
      <SearchForm q={s.q} />
      <Suspense fallback={null}>
        <ResultsClient karta={view.karta} sheet={!!view.filtry} backHref={listHref} closeSheetHref={resultsHref(s, page, { karta: openId })} status={total == null ? "" : t("found", { n: total })} />
      </Suspense>
      <p className="sr-only" role="status" id="rStatus" />
      <div className="results-area" data-sheet={view.filtry ? "open" : undefined}>
        <Link className="sheet-backdrop" href={listHref} scroll={false} aria-hidden="true" tabIndex={-1} />
        <form className="filters" id="filtry" action="/wyniki" aria-labelledby="fTitle">
          <Suspense fallback={null}><FilterAuto formId="filtry" /></Suspense>
          {s.q && <input type="hidden" name="q" value={s.q} />}
          {s.tags.map((tag) => <input key={tag} type="hidden" name="tag" value={tag} />)}
          {/* The sort select is only on the list view; keep the choice when a filter changes while a card is open. */}
          {(card || !total) && s.sort && <input type="hidden" name="sort" value={s.sort} />}
          <div className="fhead">
            <h2 id="fTitle" tabIndex={-1}>{ft("filters")}</h2>
            <Link className="btn btn-text btn-sm" href={resultsHref(cleared)} scroll={false}>{ft("clear")}</Link>
            <Link className="icon-btn close" href={listHref} scroll={false} aria-label={t("close")}><Icon name="x" /></Link>
          </div>
          <p className="fnote auto-note">{ft("autoNote")}</p>

          {aud.length > 0 && (
            <label className="fsel"><span>{ft("audience")}</span>
              <select name="audience" defaultValue={s.audience ?? ""}>
                <option value="">{t("everyone")}</option>
                {aud.map((a) => <option key={a.id} value={a.id}>{text(a.label, locale)}</option>)}
              </select>
            </label>
          )}

          {f && (
            <>
              <fieldset>
                <legend className="legend">{ft("area")}</legend>
                {f.area.map((o) => (
                  <label className={o.count === 0 ? "opt zero" : "opt"} key={o.value}>
                    <input type="checkbox" name="area" value={o.value} defaultChecked={(s.areas as string[]).includes(o.value)} />
                    <span className="lab"><span className="swatch" style={{ background: SWATCH[o.value] }} aria-hidden="true" />{text(o.label, locale)}</span>
                    <span className="mono">{countSr}{o.count}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend className="legend">{ft("level")}</legend>
                {f.implementationLevel.map((o) => (
                  <label className={o.count === 0 ? "opt zero" : "opt"} key={o.value}>
                    <input type="checkbox" name="implementationLevel" value={o.value} defaultChecked={(s.levels as string[]).includes(o.value)} />
                    <span className="lab">{text(o.label, locale)}</span><span className="mono">{countSr}{o.count}</span>
                  </label>
                ))}
              </fieldset>
            </>
          )}

          <fieldset>
            <legend className="legend">{ft("trl")}</legend>
            <div className="frow">
              <label className="fsel"><span>{ft("from")}</span><select name="trlMin" defaultValue={s.trlMin ?? ""}>{trlOptions}</select></label>
              <label className="fsel"><span>{ft("to")}</span><select name="trlMax" defaultValue={s.trlMax ?? ""}>{trlOptions}</select></label>
            </div>
            <p className="fnote">{ft("trlNote")}</p>
          </fieldset>

          {f && f.region.length > 0 && (
            <label className="fsel"><span>{ft("region")}</span>
              <select name="region" defaultValue={s.region ?? ""}>
                <option value="">{t("allRegions")}</option>
                {f.region.map((r) => <option key={r.value} value={r.value}>{text(r.label, locale)} ({r.count})</option>)}
              </select>
            </label>
          )}

          <label className="fsel"><span>{ft("minCred")}</span>
            <select name="minCredibility" defaultValue={s.minCred ?? ""}>
              <option value="">{t("anyCred")}</option>
              {[25, 50, 75].map((v) => <option key={v} value={v}>{v}/100</option>)}
            </select>
          </label>

          <label className="switch-row">
            <span>{ft("ip")}</span>
            <span className="switch">
              <input type="checkbox" role="switch" name="polishIpStatus" value="confirmed" defaultChecked={s.pip.includes("confirmed")} />
              <span className="track"><span className="knob" /></span>
              <span className="state" data-on={t("on")} data-off={t("off")} aria-hidden="true" />
            </span>
          </label>

          <button type="submit" className="btn btn-primary btn-sm apply">{ft("apply")}</button>
          <button type="submit" className="btn btn-primary apply-phone">{total == null ? ft("apply") : ft("show", { n: total })}</button>
        </form>

        <div className="results-col">
          <>
          <PageMove key={openId ? `d-${openId}` : card ? "d-x" : "list"} />
          <div className="list-wrap-outer">
          {card ? (
            isFailure(card) ? (
              card.status === 404 ? (
                <div className="empty">
                  <h1 id="dTitle" tabIndex={-1}>{ftk("missingTitle")}</h1>
                  <p>{ftk("missingText")}</p>
                  <Link className="btn btn-secondary" href={listHref}><Icon name="back" />{ftk("back")}</Link>
                </div>
              ) : failure(card, resultsHref(s, page, { karta: view.karta }), true)
            ) : (
              <CardDetail card={card} labels={labels} compare={compare} history={history} backHref={`${listHref}#karta-${card.id}`}
                cardHref={(id) => resultsHref(s, page, { karta: id })} newTab={ts("newTab")} />
            )
          ) : list && isFailure(list) ? failure(list, listHref) : list && (
            <div className="list-wrap">
              <div className="rhead">
                <h1 id="rTitle" tabIndex={-1}>{ft("count", { n: list.meta.total })}{s.q && <span className="q"> {ft("forQ", { q: s.q })}</span>}</h1>
                <Link className="btn btn-secondary btn-sm filters-btn" href={`${resultsHref(s, page, { filtry: true })}#filtry`} scroll={false}>
                  <Icon name="filter" />{ft("filters")}{chips.length > 0 && <span className="count-pill"><span className="sr-only">{ft("activeSr")}</span>{chips.length}</span>}
                </Link>
                {list.meta.total > 1 && (
                  <label className="sort">{ft("sort")}
                    <select name="sort" form="filtry" defaultValue={sort}>
                      {SORTS.filter((v) => v !== "relevance" || s.q).map((v) => <option key={v} value={v}>{t(`sort_${v}`)}</option>)}
                    </select>
                  </label>
                )}
                {chips.length > 0 && (
                  <ul className="active-chips" role="list" aria-label={t("active")}>
                    {chips.map(([label, href]) => (
                      <li key={label}><Link className="achip" href={href} scroll={false} aria-label={t("remove", { x: label })}>{label}<span className="x"><Icon name="x" /></span></Link></li>
                    ))}
                  </ul>
                )}
              </div>
              {list.meta.total === 0 ? (
                <div className="empty">
                  <h2>{s.q ? (chips.length ? t("emptyQF", { q: s.q }) : t("emptyQ", { q: s.q })) : t("emptyF")}</h2>
                  <p>{chips.length > 0 ? t("emptyHint") : t("emptyHintQ")}</p>
                  {chips.length > 0 ? <Link className="btn btn-secondary" href={resultsHref(cleared)} scroll={false}>{ft("clear")}</Link>
                    : <Link className="btn btn-secondary" href="/wyniki">{ft("showAll")}</Link>}
                </div>
              ) : list.data.length === 0 ? (
                <div className="empty">
                  <h2>{ft("emptyPage")}</h2>
                  <Link className="btn btn-secondary" href={resultsHref(s, 1)}>{ft("firstPage")}</Link>
                </div>
              ) : (
                <ol className="list" role="list">
                  {list.data.map((c) => <ResultCard key={c.id} card={c} labels={labels} href={resultsHref(s, page, { karta: c.id })} />)}
                </ol>
              )}
              {pages > 1 && (
                <nav className="pager" aria-label={t("pages")}>
                  {page > 1 && <Link className="pager-step" href={resultsHref(s, page - 1)} rel="prev">{ft("prev")}</Link>}
                  <ul role="list">
                    {window7.map((n, i) => (
                      <li key={n}>
                        {i > 0 && n - window7[i - 1] > 1 && <span className="gap" aria-hidden="true">…</span>}
                        {n === page ? <b aria-current="page"><span className="sr-only">{ft("pageCurrent", { n })}</span><span aria-hidden="true">{n}</span></b> : <Link href={resultsHref(s, n)} aria-label={t("page", { n })}>{n}</Link>}
                      </li>
                    ))}
                  </ul>
                  {page < pages && <Link className="pager-step" href={resultsHref(s, page + 1)} rel="next">{ft("next")}</Link>}
                </nav>
              )}
            </div>
          )}
          </div>
          </>
        </div>
      </div>
    </div>
    </>
  );
}
