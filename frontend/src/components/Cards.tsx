import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { fitter } from "@/components/Fit";
import { AREA_ICON, Icon } from "@/components/Icons";
import { DATE_LOCALE, type Locale } from "@/i18n/locale";
import { text } from "@/lib/api";
import type { Card, CardSummary, Compare, HistoryEntry } from "@/lib/data";

const SCORE_KEYS = ["innovativeness", "applicationPotential", "credibility"] as const;
const COMPARE_ROWS = ["implementationLevel", "trl", ...SCORE_KEYS] as const;
const TZ = "Europe/Warsaw";

export const formatDate = (iso: string | null | undefined, locale: Locale) =>
  iso ? new Intl.DateTimeFormat(DATE_LOCALE[locale], { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).format(new Date(iso)) : "";
export const formatDateTime = (iso: string | null | undefined, locale: Locale) =>
  iso ? new Intl.DateTimeFormat(DATE_LOCALE[locale], { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso)) : "";

export type Labels = { area: Record<string, string>; level: Record<string, string>; region: Record<string, string> };

async function bits() {
  const [t, locale, ft] = await Promise.all([getTranslations("kard"), getLocale(), fitter("kard")]);
  const Basis = ({ basis }: { basis: string | null | undefined }) =>
    basis === "confirmed"
      ? <span className="badge b-conf"><Icon name="check" />{ft("confirmed")}</span>
      : <span className="badge b-est"><span className="tilde" aria-hidden="true">≈</span>{ft("estimate")}</span>;
  const Stale = () => <span className="badge b-stale"><Icon name="clock" />{ft("stale")}</span>;
  const NoData = () => <span className="nd">{ft("noData")}</span>;
  return { t, ft, locale: locale as Locale, Basis, Stale, NoData };
}

/** A long part of the card, folded: the heading shows what is inside and how many; one click or a jump link opens it. */
function Fold({ title, count, level = 2, label, children }: { title: React.ReactNode; count: number | null; level?: 2 | 3; label: React.ReactNode; children: React.ReactNode }) {
  const H = level === 2 ? "h2" : "h3";
  // The heading stays a real heading (headings list, rotor); the summary is the toggle, laid over the heading row so
  // the whole row is clickable. Its name: "Pokaż lub ukryj: Źródła, 12".
  return (
    <div className={`d-fold-wrap d-fold-${level}`}>
      <H className="fold-h">{title}</H>
      <details className="d-fold">
        <summary>
          <span className="sr-only">{label}: {title}, </span>
          {count != null && <span className="fold-n">{count}</span>}
          <Icon name="chev" />
        </summary>
        <div className="fold-body">{children}</div>
      </details>
    </div>
  );
}

function AreaTag({ area, label }: { area: string; label: string }) {
  return <span className={`area-tag a-${area}`}><span className="dot"><Icon name={AREA_ICON[area] ?? "doc"} /></span>{label}</span>;
}

/** Collapsed card in the results list. The title is the link that opens the card; its hit area is the whole tile. */
export async function ResultCard({ card, href, labels }: { card: CardSummary; href: string; labels: Labels }) {
  const { t, ft, locale, Basis, Stale, NoData } = await bits();
  const region = card.organisation.region ? labels.region[card.organisation.region] ?? card.organisation.region : "";
  return (
    <li className="card" id={`karta-${card.id}`}>
      <div className="card-top">
        <AreaTag area={card.area} label={labels.area[card.area] ?? card.area} />
        {card.stale && <Stale />}
        <span className="chev" aria-hidden="true"><Icon name="chev" /></span>
      </div>
      <h2><Link className="card-open" href={href} scroll={false} transitionTypes={["card-open"]}>{text(card.title, locale)}</Link></h2>
      <p className="org">{card.organisation.name}{region && ` · ${region}`}</p>
      <p className="sum">{text(card.summaryShort, locale)}</p>
      <div className="card-meta">
        <span className="grp"><span className="k">{ft("level")}:</span> <b>{labels.level[card.implementationLevel.value] ?? card.implementationLevel.value}</b> <Basis basis={card.implementationLevel.basis} /></span>
        <span className="grp">
          <span className="k">TRL:</span>{" "}
          {!card.trl.applicable ? <span className="k">{ft("na")}</span> : card.trl.value == null ? <NoData /> : <><span className="num">{card.trl.value}</span> <Basis basis={card.trl.basis} /></>}
        </span>
        <span className="grp">
          <span className="k">{ft("scores")}:</span> <Basis basis="estimate" />
          {SCORE_KEYS.map((k) => (
            <span key={k} className="sc">{ft(`sh_${k}`)} {card.scores[k] == null ? <NoData /> : <span className="num">{card.scores[k]}</span>}</span>
          ))}
        </span>
      </div>
      <p className="card-foot">
        <Link className="src-link" href={`${href}#d-sources`} scroll={false}>{ft("sourcesN", { n: card.sourceCount })}</Link>
        <span>{ft("checkedShort", { d: formatDate(card.lastCheckedAt, locale) })}</span>
      </p>
    </li>
  );
}

/** The open card. It takes the place of the list in the results column; the bar at the bottom stays in view. */
export async function CardDetail({ card, labels, compare, history, backHref, cardHref, newTab }: {
  card: Card; labels: Labels; compare: Compare | null; history: HistoryEntry[] | null; backHref: string; cardHref: (id: string) => string; newTab: string;
}) {
  const { t, ft, locale, Basis, Stale } = await bits();
  const tx = (v: Parameters<typeof text>[0]) => text(v, locale);
  const region = card.organisation.region ? labels.region[card.organisation.region] ?? card.organisation.region : "";
  const srcN = (id: string | null | undefined) => card.sources.findIndex((s) => s.id === id) + 1;
  const Refs = ({ ids }: { ids?: (string | null)[] | null }) => {
    const ns = [...new Set((ids ?? []).map(srcN).filter(Boolean))];
    return <>{ns.map((n) => <a key={n} className="ref" href={`#src-${n}`} aria-label={t("sourceN", { n })}>[{n}]</a>)}</>;
  };
  const NewTab = () => <span className="sr-only"> {newTab}</span>;
  const translated = ((card as { machineTranslated?: string[] }).machineTranslated ?? []).includes(locale);
  const level = card.implementationLevelDetail, trl = card.trlDetail, oslo = card.oslo;
  const outside = (card.relatedWork ?? []).filter((w) => w.kind !== "card").slice(0, 5);
  const rows = compare ? COMPARE_ROWS.map((k) => compare.rows.find((r) => r.key === k)).filter((r) => !!r) : [];
  const jump = [["d-facts", "j_facts"], ["d-scores", "j_scores"], ["d-oslo", "j_oslo"], ["d-similar", "j_similar"], ["d-history", "j_history"], ["d-sources", "j_sources"], ["d-evidence", "j_evidence"]] as const;
  // Column names in our own words, the same as on the card (the API's row labels differ: "Nowatorstwo").
  const colLabel = (key: string) => key === "implementationLevel" ? t("implLevel") : key === "trl" ? "TRL" : t(`s_${key as (typeof SCORE_KEYS)[number]}`);

  return (
    <article className="detail" aria-labelledby="dTitle">
      <div className="detail-body">
        <header className="d-head">
          <div className="card-top"><AreaTag area={card.area} label={labels.area[card.area] ?? card.area} />{card.stale && <Stale />}</div>
          <h1 id="dTitle" tabIndex={-1}>{tx(card.title)}</h1>
          <p className="org">
            {card.organisation.url ? <a href={card.organisation.url} target="_blank" rel="noopener">{card.organisation.name}<NewTab /></a> : card.organisation.name}
            {region && ` · ${region}`}
          </p>
          <p className="when"><span>{ft("checked", { d: formatDateTime(card.lastCheckedAt, locale) })}</span><span>{ft("firstSeen", { d: formatDate(card.firstSeenAt, locale) })}</span></p>
          <nav className="jump" aria-label={t("onCard")}>
            <span className="lbl" aria-hidden="true">{ft("onCard")}:</span>
            <ul role="list">{jump.map(([id, key]) => <li key={id}><a href={`#${id}`}>{t(key)}</a></li>)}</ul>
          </nav>
        </header>

        <section className="d-sec">
          <h2>{ft("desc")}</h2>
          <p className="est-note"><Basis basis="estimate" /> {ft("descNote")}{translated && ` ${ft("mt")}`}</p>
          <p className="prose">{tx(card.summary)}</p>
        </section>

        <section className="d-sec" tabIndex={-1} id="d-facts">
          <h2>{ft("facts")}</h2>
          <dl className="factgrid">
            <div className="fact">
              <dt>{ft("implLevel")}</dt>
              <dd>
                <span className="big">{labels.level[level.value] ?? level.value}</span><Basis basis={level.basis} />
                {level.basis === "estimate" && tx(level.methodText) && <span className="how"><b>{ft("howKnow")}</b> {tx(level.methodText)}</span>}
                {(level.sourceIds ?? []).length > 0 && <span className="how">{ft("fromSource")} <Refs ids={level.sourceIds} /></span>}
              </dd>
            </div>
            <div className="fact">
              <dt>{ft("trlLong")}</dt>
              <dd>
                {!trl.applicable ? <><span className="big none">{ft("na")}</span><span className="how">{ft("trlNa")}</span></>
                  : trl.value == null ? <><span className="big none">{ft("noData")}</span><span className="how">{ft("trlNd")}</span></>
                  : <>
                      <span className="big">{ft("trlOf", { v: trl.value })}</span><Basis basis={trl.basis} />
                      {trl.basis === "estimate" && tx(trl.methodText) && <span className="how"><b>{ft("howKnow")}</b> {tx(trl.methodText)}</span>}
                      {(trl.sourceIds ?? []).length > 0 && <span className="how">{ft("fromSource")} <Refs ids={trl.sourceIds} /></span>}
                    </>}
              </dd>
            </div>
            <div className="fact">
              <dt>{ft("ip")}</dt>
              <dd>
                {card.polishIpStatus === "confirmed" || card.polishIp ? <><span className="big">{ft("ipYes")}</span><Basis basis="confirmed" /></>
                  : card.polishIpStatus === "stated" ? <><span className="big">{ft("ipStated")}</span><span className="how">{ft("ipStatedNote")}</span></>
                  : <><span className="big none">{ft("ipNo")}</span><span className="how">{ft("ipNoNote")}</span></>}
              </dd>
            </div>
          </dl>
        </section>

        <section className="d-sec" tabIndex={-1} id="d-scores">
          <h2>{ft("j_scores")}</h2>
          <p className="est-note">{ft("scoresNote")}</p>
          {SCORE_KEYS.map((k) => {
            const s = card.assessment[k];
            const none = s.value == null || s.insufficientData;
            return (
              <div className="score" key={k}>
                <div className="score-top">
                  <h3>{ft(`s_${k}`)}</h3>
                  {none ? <span className="score-nd"><Icon name="info" />{ft("noData")}</span> : <span className="score-val">{s.value}<small> / 100</small></span>}
                </div>
                {none ? <p className="fnote">{ft("ndNote", { n: s.sampleSize ?? 0 })}</p> : <div className="bar" aria-hidden="true"><i style={{ width: `${s.value}%` }} /></div>}
                <div className="score-meta">
                  <Basis basis={s.basis} />
                  {s.confidence && <span>{ft("conf", { c: t(`c_${s.confidence}`) })}</span>}
                  {s.sampleSize != null && <span>{ft("sample", { n: s.sampleSize })}</span>}
                  {(s.sourceIds ?? []).length > 0 && <span>{ft("fromSource")} <Refs ids={s.sourceIds} /></span>}
                </div>
                {!none && tx(s.explanation) && <p className="prose">{tx(s.explanation)}</p>}
                {tx(s.methodText) && <details className="how-calc"><summary>{ft("howCalc")}<Icon name="chev" /></summary><p>{tx(s.methodText)}</p></details>}
              </div>
            );
          })}
        </section>

        <section className="d-sec" tabIndex={-1} id="d-oslo">
          <h2>
            {ft("oslo")}
            {oslo.passed ? <span className="yes"><Icon name="ok" />{ft("osloPass")}</span> : <span className="no"><Icon name="x" />{ft("osloFail")}</span>}
            <Basis basis={oslo.basis} />
          </h2>
          <ul className="oslo" role="list">
            {([[oslo.newOrImproved, "o1"], [oslo.differsSignificantly, "o2"], [oslo.availableOrInUse, "o3"]] as const).map(([ok, key]) => (
              <li key={key}>{ok ? <span className="yes"><Icon name="check" />{ft("yes")}</span> : <span className="no"><Icon name="x" />{ft("no")}</span>} {t(key)}</li>
            ))}
          </ul>
          {tx(oslo.note) && <p className="prose">{tx(oslo.note)}</p>}
        </section>

        {(card.couldAlsoBeUsedIn ?? []).length > 0 && (
          <section className="d-sec">
            <h2>{ft("also")} <Basis basis="estimate" /></h2>
            <ul className="also" role="list">{card.couldAlsoBeUsedIn.map((x, i) => <li key={i}>{tx(x)}</li>)}</ul>
          </section>
        )}

        <section className="d-sec" tabIndex={-1} id="d-similar">
          <h2 id="d-similar-h">{ft("similar")}</h2>
          {compare && compare.cards.length > 1 ? (
            <>
              <p className="est-note">{ft("similarNote")}</p>
              <div className="tablewrap" tabIndex={0} role="region" aria-labelledby="d-similar-h">
                <table className="t cmp" role="table">
                  <caption className="sr-only">{ft("cmpCaption")}</caption>
                  <thead>
                    <tr role="row"><th scope="col">{ft("colCard")}</th>{rows.map((r) => <th scope="col" key={r.key}>{colLabel(r.key)}</th>)}</tr>
                  </thead>
                  <tbody role="rowgroup">
                    {compare.cards.map((c) => (
                      <tr key={c.id} role="row" className={c.id === card.id ? "this" : undefined}>
                        <th scope="row" role="rowheader">
                          {c.id === card.id ? <>{tx(c.title)} <span className="badge b-this">{ft("thisCard")}</span></> : <Link href={cardHref(c.id)} scroll={false} replace>{tx(c.title)}</Link>}
                          <span className="org">{c.organisation.name}</span>
                        </th>
                        {rows.map((r) => {
                          const cell = r.cells.find((x) => x.cardId === c.id);
                          return (
                            <td role="cell" key={r.key} className={typeof cell?.raw === "number" ? "num" : undefined} data-label={colLabel(r.key)}>
                              <span>{cell ? tx(cell.display) : ""}{cell?.isBest && <span className="best"><Icon name="check" />{ft("best")}</span>}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <p>{ft("similarNone")}</p>}
          {outside.length > 0 && (
            <Fold label={ft("foldShow")} title={ft("outside")} count={outside.length} level={3}>
              <p className="est-note"><Basis basis="estimate" /> {ft("outsideNote")}</p>
              <ul className="works" role="list">
                {outside.map((w, i) => (
                  <li key={i}>
                    <a href={w.url} target="_blank" rel="noopener"><span lang={w.titleLang ?? undefined}>{tx(w.title)}</span><NewTab /></a>
                    <span className="meta">{[t(`k_${w.kind}`), w.organisation?.name, w.year].filter(Boolean).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </Fold>
          )}
        </section>

        <section className="d-sec" tabIndex={-1} id="d-history">
          {history === null || history.length === 0 ? (
            <>
              <h2>{ft("history")}</h2>
              {history === null ? <p className="fnote">{ft("histUnavailable")}</p> : <p>{ft("histNone", { d: formatDate(card.firstSeenAt, locale) })}</p>}
            </>
          ) : (
          <Fold label={ft("foldShow")} title={ft("history")} count={history.length}>
            {(
              <ul className="hist" role="list">
                {history.map((h, i) => (
                  <li key={i}>
                    <span className="meta">{formatDate(h.at, locale)}</span>{" "}
                    {ft("histRow", { from: tx(h.fromLabel) || h.from || "?", to: tx(h.toLabel) || h.to || "?" })}
                    {srcN(h.sourceId) > 0 && <> <Refs ids={[h.sourceId]} /></>}
                  </li>
                ))}
              </ul>
            )}
          </Fold>
          )}
        </section>

        <section className="d-sec" tabIndex={-1} id="d-sources">
          <Fold label={ft("foldShow")} title={ft("sources")} count={card.sources.length}>
          <ol className="sources" role="list">
            {card.sources.map((s, i) => (
              <li className="src" id={`src-${i + 1}`} key={s.id} tabIndex={-1}>
                <span className="num" aria-hidden="true">{i + 1}</span>
                <a href={s.url} target="_blank" rel="noopener"><span className="sr-only">{ft("sourceN", { n: i + 1 })}: </span>{tx(s.nameText) || s.name}<NewTab /> <Icon name="ext" /></a>
                <span className="meta">
                  <span>{t(`t_${s.type}`)}</span><span>{t("retrieved", { d: formatDateTime(s.retrievedAt, locale) })}</span>
                  {(tx(s.licenseLabel) || s.license) && <span>{t("license", { l: tx(s.licenseLabel) || s.license || "" })}</span>}
                </span>
                {s.passage
                  ? <figure><blockquote className="passage" lang={s.passageLang ?? "pl"}>{s.passage}</blockquote><figcaption className="passage-cap">{ft("quoteCap", { l: s.passageLang === "en" ? t("lang_en") : s.passageLang === "uk" ? t("lang_uk") : s.passageLang === "pl" || !s.passageLang ? t("lang_pl") : s.passageLang })}</figcaption></figure>
                  : <span className="fnote">{ft("noPassage")}</span>}
              </li>
            ))}
          </ol>
          </Fold>
        </section>

        <section className="d-sec" tabIndex={-1} id="d-evidence">
          <Fold label={ft("foldShow")} title={<span id="d-evidence-h">{ft("evidence")}</span>} count={card.evidence.length}>
          <div className="tablewrap" tabIndex={0} role="region" aria-labelledby="d-evidence-h">
            <table className="t ev">
              <caption>{ft("evCap")}</caption>
              <thead><tr><th scope="col">{ft("evM")}</th><th scope="col">{ft("evV")}</th><th scope="col">{ft("evO")}</th><th scope="col">{ft("evS")}</th><th scope="col">{ft("evD")}</th></tr></thead>
              <tbody>
                {card.evidence.map((e) => (
                  <tr key={e.id}>
                    <th scope="row">{tx(e.label) || e.metric}</th>
                    <td className="num">{typeof e.value === "boolean" ? (e.value ? t("yes") : t("no")) : typeof e.value === "number" ? new Intl.NumberFormat(DATE_LOCALE[locale], { maximumFractionDigits: 2 }).format(e.value) : e.value}{tx(e.unitLabel) && ` ${tx(e.unitLabel)}`}</td>
                    <td>{e.origin === "computed" ? t("o_computed") : t("o_source")}</td>
                    <td><Refs ids={[e.sourceId]} /></td>
                    <td className="num">{formatDate(e.retrievedAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Fold>
        </section>
      </div>

      <div className="detail-bar">
        <Link className="btn btn-secondary" href={backHref} scroll={false} transitionTypes={["card-close"]} aria-label={t("back")} aria-keyshortcuts="Escape"><Icon name="back" /><span className="lbl-mid">{ft("back")}</span></Link>
        <span className="kbd" aria-hidden="true">{ft("esc")}</span>
        <span className="spacer" />
        {card.owner?.url && <a className="btn btn-primary" href={card.owner.url} target="_blank" rel="noopener"><span>{ft("owner")}<NewTab /></span><Icon name="ext" /></a>}
      </div>
    </article>
  );
}
