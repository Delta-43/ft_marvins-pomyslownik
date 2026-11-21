import Link from "next/link";
import { notFound } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { AreaChip, BasisLabel, DateValue, LevelValue, ScoreValue, TrlValue } from "@/components/CardBits";
import { ApiError, errorKey, pick, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";

type Provenance = { basis: Schemas["Basis"]; sourceIds: string[]; method?: string | null; methodText?: Schemas["LocalizedText"] | null };

/** Confirmed: links to its sources. Estimate: the method in words. */
function Why({ p, sources }: { p: Provenance; sources: Schemas["Source"][] }) {
  const t = useTranslations("card");
  const locale = useLocale();
  if (p.basis === "confirmed") {
    return (
      <span className="text-xs text-kamien">
        {t("source")}{" "}
        {p.sourceIds.map((id, i) => {
          const n = sources.findIndex((s) => s.id === id) + 1;
          return <span key={id}>{i > 0 && ", "}<a href={`#zrodlo-${id}`} className="font-tech">[{n || "?"}]</a></span>;
        })}
      </span>
    );
  }
  const method = pick(p.methodText, locale) || p.method;
  return method ? <span className="text-xs text-kamien">{t("method", { method })}</span> : null;
}

const SCORES = ["innovativeness", "applicationPotential", "credibility"] as const satisfies readonly (keyof Schemas["Scores"])[];

// Innovation card: every value shows Confirmed (with source links) or Estimate (with method). Signed-in only.
export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, tErr, tRes, locale] = await Promise.all([getTranslations("card"), getTranslations("errors"), getTranslations("results"), getLocale()]);
  let card: Schemas["Card"];
  try {
    card = (await authed<{ data: Schemas["Card"] }>(`/api/v1/cards/${encodeURIComponent(id)}`, `/karta/${id}`)).data;
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
  const s = card.sources;

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
        <div className="glass space-y-2 rounded-[var(--radius-card)] p-6">
          <h3 className="text-base" style={{ fontSize: "1rem" }}>{t("level")}</h3>
          <p className="font-tech text-2xl font-semibold"><LevelValue level={card.implementationLevelDetail.value} /></p>
          <p className="flex flex-wrap items-center gap-2"><BasisLabel basis={card.implementationLevelDetail.basis} /><Why p={card.implementationLevelDetail} sources={s} /></p>
        </div>
        <div className="glass space-y-2 rounded-[var(--radius-card)] p-6">
          <h3 className="text-base" style={{ fontSize: "1rem" }}>{t("trl")}</h3>
          <p className="text-2xl"><TrlValue trl={card.trlDetail} /></p>
          {card.trlDetail.applicable
            ? <p className="flex flex-wrap items-center gap-2"><BasisLabel basis={card.trlDetail.basis} /><Why p={card.trlDetail} sources={s} /></p>
            : <p className="text-xs text-kamien">{t("trlOnlyTech")}</p>}
        </div>
        {SCORES.map((key) => {
          const sc = card.assessment[key];
          return (
            <div key={key} className="glass space-y-2 rounded-[var(--radius-card)] p-6">
              <h3 className="text-base" style={{ fontSize: "1rem" }}>{t(key)}</h3>
              <p className="text-2xl"><ScoreValue value={sc.insufficientData ? null : sc.value} sampleSize={sc.insufficientData ? sc.sampleSize : undefined} /></p>
              <p className="flex flex-wrap items-center gap-2"><BasisLabel basis={sc.basis} /><Why p={sc} sources={s} /></p>
              {!sc.insufficientData && <p className="font-tech text-xs text-kamien">{t("confidence", { level: t(`confidenceLevel.${sc.confidence}`) })}</p>}
            </div>
          );
        })}
        <div className="glass space-y-2 rounded-[var(--radius-card)] p-6">
          <h3 className="text-base" style={{ fontSize: "1rem" }}>{t("oslo")}</h3>
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

      <footer className="glass flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] p-6 text-sm">
        <span>{t("owner")} <a href={card.owner.url} target="_blank" rel="noopener noreferrer">{card.owner.name}</a></span>
        <span className="font-tech text-kamien">{t("firstSeen")} <DateValue iso={card.firstSeenAt} /> · {t("checked")} <DateValue iso={card.lastCheckedAt} /></span>
      </footer>
    </article>
  );
}
