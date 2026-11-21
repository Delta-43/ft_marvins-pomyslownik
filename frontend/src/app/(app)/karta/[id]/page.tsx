import Link from "next/link";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { AreaChip, BasisLabel, DateValue, LevelValue, ScoreValue, TrlValue } from "@/components/CardBits";
import { ApiError, errorKey, pick, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";

type Provenance = {
  basis: Schemas["Basis"];
  sourceIds: string[];
  evidenceIds?: string[];
  method?: string | null;
  methodText?: Schemas["LocalizedText"] | null;
};
type Similar = { card: Schemas["CardSummary"]; similarity: number; basis: Schemas["Basis"] };

/** "[1], [2]": links to the numbered sources at the bottom of the page. */
function SourceLinks({ ids, sources }: { ids: string[]; sources: Schemas["Source"][] }) {
  return (
    <>
      {ids.map((id, i) => {
        const n = sources.findIndex((s) => s.id === id) + 1;
        return <span key={id}>{i > 0 && ", "}<a href={`#zrodlo-${id}`} className="font-tech">[{n || "?"}]</a></span>;
      })}
    </>
  );
}

/** Why a value is what it is. Every value links to its sources; an estimate also says how it was made. */
function Why({ p, sources }: { p: Provenance; sources: Schemas["Source"][] }) {
  const t = useTranslations("card");
  const locale = useLocale();
  const method = p.basis === "estimate" ? pick(p.methodText, locale) || p.method : null;
  return (
    <span className="space-y-1 text-xs text-kamien">
      {p.sourceIds.length > 0 && <span className="block">{t("source")} <SourceLinks ids={p.sourceIds} sources={sources} /></span>}
      {method && <span className="block">{t("method", { method })}</span>}
    </span>
  );
}

/** An evidence value in words: numbers in the reader's format, booleans as yes/no, then the unit. */
function EvidenceValue({ e }: { e: Schemas["Evidence"] }) {
  const t = useTranslations("card");
  const locale = useLocale();
  const value =
    typeof e.value === "boolean" ? t(e.value ? "yes" : "no")
    : typeof e.value === "number" ? new Intl.NumberFormat(locale === "en" ? "en-GB" : "pl-PL").format(e.value)
    : e.value;
  const unit = pick(e.unitLabel, locale) || e.unit;
  return <span className="font-tech font-semibold tabular-nums">{value}{unit ? ` ${unit}` : ""}</span>;
}

/** Evidence rows as a list. Each row: what was measured, the value, its source, the query and the date. */
function EvidenceList({ rows, sources }: { rows: Schemas["Evidence"][]; sources: Schemas["Source"][] }) {
  const t = useTranslations("card");
  const locale = useLocale();
  if (rows.length === 0) return <p className="text-sm text-kamien">{t("evidenceNone")}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((e) => (
        <li key={e.id} id={`dowod-${e.id}`} className="rounded-xl bg-white/60 p-3 text-sm ring-1 ring-white/80">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span>{pick(e.label, locale) || e.metric}</span>
            <EvidenceValue e={e} />
          </div>
          <p className="mt-1 text-xs text-kamien">
            {t("evidenceSource")}: <SourceLinks ids={[e.sourceId]} sources={sources} /> · {t("evidenceDate")} <DateValue iso={e.retrievedAt} />
          </p>
          <p className="mt-0.5 text-xs text-kamien"><span className="sr-only">{t("evidenceQuery")}: </span><span className="font-tech">{e.query}</span></p>
        </li>
      ))}
    </ul>
  );
}

/** The evidence "drawer": a native disclosure, so it opens with Enter/Space and works without JavaScript. */
function EvidenceDrawer({ ids, evidence, sources }: { ids: string[] | undefined; evidence: Schemas["Evidence"][]; sources: Schemas["Source"][] }) {
  const t = useTranslations("card");
  const rows = (ids ?? []).map((id) => evidence.find((e) => e.id === id)).filter((e): e is Schemas["Evidence"] => !!e);
  if (rows.length === 0) return null;
  return (
    <details className="group rounded-xl bg-white/40 ring-1 ring-white/70">
      <summary className="cursor-pointer list-none rounded-xl px-3 py-2 text-sm font-bold text-granat hover:bg-white/60 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
        {t("showEvidence", { count: rows.length })}
      </summary>
      <div className="px-3 pb-3"><EvidenceList rows={rows} sources={sources} /></div>
    </details>
  );
}

const SCORES = ["innovativeness", "applicationPotential", "credibility"] as const satisfies readonly (keyof Schemas["Scores"])[];
const box = "glass space-y-2 rounded-[var(--radius-card)] p-6";
const h3 = { fontSize: "1rem" } as const;

// Innovation card: every value shows Confirmed or Estimate, links to its sources, and opens its evidence. Signed-in only.
export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, tErr, tRes, locale] = await Promise.all([getTranslations("card"), getTranslations("errors"), getTranslations("results"), getLocale()]);
  const here = `/karta/${id}`;
  const path = `/api/v1/cards/${encodeURIComponent(id)}`;
  let card: Schemas["Card"];
  try {
    card = (await authed<{ data: Schemas["Card"] }>(path, here)).data;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 422)) notFound();
    if (!(e instanceof ApiError)) throw e;
    return (
      <div role="alert" className="glass mx-auto my-12 max-w-xl rounded-[var(--radius-card)] p-6">
        <p className="font-bold">{tErr(errorKey(e.code))}</p>
        {e.requestId && <p className="mt-1 font-tech text-xs text-kamien">{tRes("requestId", { id: e.requestId })}</p>}
      </div>
    );
  }
  // Panels below the card. A failure here shows a note in that panel; it never breaks the card itself.
  const [similarRes, historyRes] = await Promise.allSettled([
    authed<{ data: Similar[] }>(`${path}/similar?limit=5`, here).then((r) => r.data),
    authed<{ data: Schemas["StatusChange"][] }>(`${path}/history`, here).then((r) => r.data),
  ]);
  for (const r of [similarRes, historyRes]) if (r.status === "rejected" && !(r.reason instanceof ApiError)) throw r.reason;
  const similar = similarRes.status === "fulfilled" ? similarRes.value : null;
  const history = historyRes.status === "fulfilled" ? historyRes.value : null;

  const s = card.sources;
  const ev = card.evidence;

  return (
    <article className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <p><Link href="/wyniki">{t("back")}</Link></p>

      <header className="glass-strong space-y-3 rounded-[2rem] p-8">
        <div className="flex flex-wrap items-center gap-2">
          <AreaChip area={card.area} />
          {card.tags.map((tag) => <span key={tag.slug} className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs ring-1 ring-krawedz">{pick(tag.label, locale)}</span>)}
          {card.stale && <span className="text-xs text-kamien">⏱ {tRes("stale")}</span>}
        </div>
        <h1 className="text-4xl">{pick(card.title, locale)}</h1>
        <p className="text-kamien">
          {card.organisation.name}
          {card.organisation.region && <> · <span className="font-tech">{card.organisation.region}</span></>}
        </p>
        <p className="text-lg">{pick(card.summary, locale)}</p>
        <p className="flex flex-wrap items-center gap-2 text-xs text-kamien"><BasisLabel basis="estimate" /> {t("summaryNote")}</p>
      </header>

      <section aria-labelledby="ocena" className="grid gap-4 md:grid-cols-2">
        <h2 id="ocena" className="sr-only">{t("assessment")}</h2>
        <div className={box}>
          <h3 className="text-base" style={h3}>{t("level")}</h3>
          <p className="font-tech text-2xl font-semibold"><LevelValue level={card.implementationLevelDetail.value} /></p>
          <div className="flex flex-wrap items-start gap-2"><BasisLabel basis={card.implementationLevelDetail.basis} /><Why p={card.implementationLevelDetail} sources={s} /></div>
          <EvidenceDrawer ids={card.implementationLevelDetail.evidenceIds} evidence={ev} sources={s} />
        </div>
        <div className={box}>
          <h3 className="text-base" style={h3}>{t("trl")}</h3>
          <p className="text-2xl"><TrlValue trl={card.trlDetail} /></p>
          {card.trlDetail.applicable ? (
            <>
              <div className="flex flex-wrap items-start gap-2"><BasisLabel basis={card.trlDetail.basis} /><Why p={card.trlDetail} sources={s} /></div>
              <EvidenceDrawer ids={card.trlDetail.evidenceIds} evidence={ev} sources={s} />
            </>
          ) : (
            <p className="text-xs text-kamien">{t("trlOnlyTech")}</p>
          )}
        </div>
        {SCORES.map((key) => {
          const sc = card.assessment[key];
          const explanation = pick(sc.explanation, locale);
          return (
            <div key={key} className={box}>
              <h3 className="text-base" style={h3}>{t(key)}</h3>
              <p className="text-2xl"><ScoreValue value={sc.insufficientData ? null : sc.value} sampleSize={sc.insufficientData ? sc.sampleSize : undefined} /></p>
              <div className="flex flex-wrap items-start gap-2"><BasisLabel basis={sc.basis} /><Why p={sc} sources={s} /></div>
              {!sc.insufficientData && <p className="font-tech text-xs text-kamien">{t("confidence", { level: t(`confidenceLevel.${sc.confidence}`) })}</p>}
              {explanation && (
                <p className="text-sm"><span className="font-bold">{t("explanation")}:</span> {explanation}</p>
              )}
              <EvidenceDrawer ids={sc.evidenceIds} evidence={ev} sources={s} />
            </div>
          );
        })}
        <div className={box}>
          <h3 className="text-base" style={h3}>{t("oslo")}</h3>
          <p className="font-tech text-lg font-semibold">{card.oslo.passed ? t("osloPassed") : t("osloFailed")}</p>
          <ul className="space-y-0.5 text-sm">
            <li>{card.oslo.newOrImproved ? "✓" : "✗"} {t("osloNew")}</li>
            <li>{card.oslo.differsSignificantly ? "✓" : "✗"} {t("osloDiffers")}</li>
            <li>{card.oslo.availableOrInUse ? "✓" : "✗"} {t("osloAvailable")}</li>
          </ul>
          <p className="flex flex-wrap items-center gap-2"><BasisLabel basis={card.oslo.basis} />{card.oslo.note && <span className="text-xs text-kamien">{pick(card.oslo.note, locale)}</span>}</p>
        </div>
      </section>

      {card.couldAlsoBeUsedIn.length > 0 && (
        <section className="glass rounded-[var(--radius-card)] p-6">
          <h2 style={{ fontSize: "1.25rem" }}>{t("alsoUsedIn")}</h2>
          <ul className="mt-2 list-disc pl-5">{card.couldAlsoBeUsedIn.map((x, i) => <li key={i}>{pick(x, locale)}</li>)}</ul>
          <p className="mt-2 flex items-center gap-2 text-xs text-kamien"><BasisLabel basis="estimate" /> {t("alsoUsedInNote")}</p>
        </section>
      )}

      <section aria-labelledby="podobne-h" className="glass rounded-[var(--radius-card)] p-6">
        <h2 id="podobne-h" style={{ fontSize: "1.25rem" }}>{t("similarTitle")}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-kamien"><BasisLabel basis="estimate" /> {t("similarIntro")}</p>
        {similar === null ? (
          <p role="status" className="mt-3 text-sm text-kamien">{t("similarUnavailable")}</p>
        ) : similar.length === 0 ? (
          <p className="mt-3 text-sm text-kamien">{t("similarNone")}</p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {similar.map(({ card: c, similarity }) => (
              <li key={c.id} className="lift flex flex-col gap-1.5 rounded-2xl bg-white/60 p-4 ring-1 ring-white/80">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <AreaChip area={c.area} />
                  <span className="font-tech text-xs font-semibold tabular-nums text-kamien">{t("similarity", { value: Math.round(similarity * 100) })}</span>
                </div>
                <Link href={`/karta/${c.id}`} className="font-bold text-atrament">{pick(c.title, locale)}</Link>
                <span className="text-xs text-kamien">{c.organisation.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="historia-h" className="glass rounded-[var(--radius-card)] p-6">
        <h2 id="historia-h" style={{ fontSize: "1.25rem" }}>{t("historyTitle")}</h2>
        {history === null ? (
          <p role="status" className="mt-3 text-sm text-kamien">{t("historyUnavailable")}</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-kamien">
            {t("historyNone", { date: new Date(card.firstSeenAt).toLocaleDateString(locale === "en" ? "en-GB" : "pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }) })}
          </p>
        ) : (
          <ol className="mt-3 space-y-3 border-l-2 border-granat/30 pl-4">
            {history.map((h, i) => (
              <li key={`${h.at}-${i}`} className="relative">
                <span aria-hidden="true" className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-granat" />
                <p className="text-xs text-kamien"><DateValue iso={h.at} /></p>
                <p className="text-sm">
                  <span className="font-bold">{t(`historyField.${h.field}`)}:</span>{" "}
                  <span className="font-tech">{pick(h.fromLabel, locale) || h.from || t("historyEmptyValue")}</span>
                  {" → "}
                  <span className="font-tech font-semibold">{pick(h.toLabel, locale) || h.to || t("historyEmptyValue")}</span>
                  {h.sourceId && <span className="text-xs text-kamien"> · {t("source")} <SourceLinks ids={[h.sourceId]} sources={s} /></span>}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section id="zrodla" aria-labelledby="zrodla-h" className="glass rounded-[var(--radius-card)] p-6">
        <h2 id="zrodla-h" style={{ fontSize: "1.25rem" }}>{t("sources")}</h2>
        <ol className="mt-3 space-y-4">
          {s.map((src, i) => (
            <li key={src.id} id={`zrodlo-${src.id}`} className="scroll-mt-24 rounded-2xl bg-white/60 p-4 ring-1 ring-white/80">
              <p className="font-tech text-sm text-kamien">[{i + 1}] {t(`sourceType.${src.type}`)} · {t("retrieved")} <DateValue iso={src.retrievedAt} /></p>
              <p className="font-bold"><a href={src.url} target="_blank" rel="noopener noreferrer">{src.name}</a></p>
              {src.passage && (
                <blockquote lang={src.passageLang ?? undefined} className="mt-2 border-l-4 border-granat pl-3">„{src.passage}”</blockquote>
              )}
            </li>
          ))}
        </ol>
      </section>

      {ev.length > 0 && (
        <section id="dowody" aria-labelledby="dowody-h" className="glass rounded-[var(--radius-card)] p-6">
          <details>
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <h2 id="dowody-h" className="inline" style={{ fontSize: "1.25rem" }}>{t("evidenceAll", { count: ev.length })}</h2>
              <span className="mt-1 block text-xs text-kamien">{t("evidenceIntro")}</span>
            </summary>
            <div className="mt-3"><EvidenceList rows={ev} sources={s} /></div>
          </details>
        </section>
      )}

      <footer className="glass flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] p-6 text-sm">
        <span>{t("owner")} <a href={card.owner.url} target="_blank" rel="noopener noreferrer">{card.owner.name}</a></span>
        <span className="font-tech text-kamien">
          {t("firstSeen")} <DateValue iso={card.firstSeenAt} /> · {t("checked")} <DateValue iso={card.lastCheckedAt} />
          {card.statusChangedAt && <> · {t("statusChanged")} <DateValue iso={card.statusChangedAt} /></>}
        </span>
      </footer>
    </article>
  );
}
