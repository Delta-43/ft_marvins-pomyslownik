import Link from "next/link";
import { notFound } from "next/navigation";
import { AreaChip, BasisLabel, DateValue, LEVEL, ScoreValue, TrlValue } from "@/components/CardBits";
import { ApiError, errorMessage, t, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";

type Provenance = { basis: Schemas["Basis"]; sourceIds: string[]; method?: string | null; methodText?: Schemas["LocalizedText"] | null };

/** Confirmed: links to its sources. Estimate: the method in words. */
function Why({ p, sources }: { p: Provenance; sources: Schemas["Source"][] }) {
  if (p.basis === "confirmed") {
    return (
      <span className="text-xs text-kamien">
        Źródło:{" "}
        {p.sourceIds.map((id, i) => {
          const n = sources.findIndex((s) => s.id === id) + 1;
          return <span key={id}>{i > 0 && ", "}<a href={`#zrodlo-${id}`} className="font-tech">[{n || "?"}]</a></span>;
        })}
      </span>
    );
  }
  const method = t(p.methodText) || p.method;
  return method ? <span className="text-xs text-kamien">Metoda: {method}</span> : null;
}

const SCORES: [keyof Schemas["Scores"], string][] = [
  ["innovativeness", "Nowatorstwo"],
  ["applicationPotential", "Potencjał zastosowania"],
  ["credibility", "Wiarygodność"],
];

// Innovation card: every value shows Confirmed (with source links) or Estimate (with method). Signed-in only.
export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let card: Schemas["Card"];
  try {
    card = (await authed<{ data: Schemas["Card"] }>(`/api/v1/cards/${encodeURIComponent(id)}`, `/karta/${id}`)).data;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 422)) notFound();
    if (!(e instanceof ApiError)) throw e;
    return (
      <div role="alert" className="glass mx-auto my-12 max-w-xl rounded-[var(--radius-card)] p-6">
        <p className="font-bold">{errorMessage(e.code)}</p>
        {e.requestId && <p className="mt-1 font-tech text-xs text-kamien">ID zgłoszenia: {e.requestId}</p>}
      </div>
    );
  }
  const s = card.sources;

  return (
    <article className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <p><Link href="/wyniki">← Wyniki</Link></p>

      <header className="glass-strong space-y-3 rounded-[2rem] p-8">
        <div className="flex flex-wrap items-center gap-2">
          <AreaChip area={card.area} />
          {card.tags.map((tag) => <span key={tag.slug} className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs ring-1 ring-krawedz">{t(tag.label)}</span>)}
          {card.stale && <span className="text-xs text-kamien">⏱ Dawno nie sprawdzano</span>}
        </div>
        <h1 className="text-4xl">{t(card.title)}</h1>
        <p className="text-kamien">
          {card.organisation.name}
          {card.organisation.region && <> · <span className="font-tech">{card.organisation.region}</span></>}
        </p>
        <p className="text-lg">{t(card.summary)}</p>
        <p className="flex flex-wrap items-center gap-2 text-xs text-kamien"><BasisLabel basis="estimate" /> Opis przygotowany na podstawie źródeł.</p>
      </header>

      <section aria-labelledby="ocena" className="grid gap-4 md:grid-cols-2">
        <h2 id="ocena" className="sr-only">Ocena</h2>
        <div className="glass space-y-2 rounded-[var(--radius-card)] p-6">
          <h3 className="text-base" style={{ fontSize: "1rem" }}>Poziom wdrożenia</h3>
          <p className="font-tech text-2xl font-semibold">{LEVEL[card.implementationLevelDetail.value]}</p>
          <p className="flex flex-wrap items-center gap-2"><BasisLabel basis={card.implementationLevelDetail.basis} /><Why p={card.implementationLevelDetail} sources={s} /></p>
        </div>
        <div className="glass space-y-2 rounded-[var(--radius-card)] p-6">
          <h3 className="text-base" style={{ fontSize: "1rem" }}>Gotowość technologiczna</h3>
          <p className="text-2xl"><TrlValue trl={card.trlDetail} /></p>
          {card.trlDetail.applicable
            ? <p className="flex flex-wrap items-center gap-2"><BasisLabel basis={card.trlDetail.basis} /><Why p={card.trlDetail} sources={s} /></p>
            : <p className="text-xs text-kamien">Skala TRL dotyczy tylko rozwiązań technologicznych.</p>}
        </div>
        {SCORES.map(([key, label]) => {
          const sc = card.assessment[key];
          return (
            <div key={key} className="glass space-y-2 rounded-[var(--radius-card)] p-6">
              <h3 className="text-base" style={{ fontSize: "1rem" }}>{label}</h3>
              <p className="text-2xl"><ScoreValue value={sc.insufficientData ? null : sc.value} sampleSize={sc.insufficientData ? sc.sampleSize : undefined} /></p>
              <p className="flex flex-wrap items-center gap-2"><BasisLabel basis={sc.basis} /><Why p={sc} sources={s} /></p>
              {!sc.insufficientData && <p className="font-tech text-xs text-kamien">Pewność: {{ low: "niska", medium: "średnia", high: "wysoka" }[sc.confidence]}</p>}
            </div>
          );
        })}
        <div className="glass space-y-2 rounded-[var(--radius-card)] p-6">
          <h3 className="text-base" style={{ fontSize: "1rem" }}>Innowacja wg Oslo Manual 2018</h3>
          <p className="font-tech text-lg font-semibold">{card.oslo.passed ? "✓ Spełnia" : "✗ Nie wykazano"}</p>
          <ul className="space-y-0.5 text-sm">
            <li>{card.oslo.newOrImproved ? "✓" : "✗"} Nowa lub ulepszona</li>
            <li>{card.oslo.differsSignificantly ? "✓" : "✗"} Znacząco się różni</li>
            <li>{card.oslo.availableOrInUse ? "✓" : "✗"} Dostępna lub w użyciu</li>
          </ul>
          <p className="flex flex-wrap items-center gap-2"><BasisLabel basis={card.oslo.basis} />{card.oslo.note && <span className="text-xs text-kamien">{t(card.oslo.note)}</span>}</p>
        </div>
      </section>

      {card.couldAlsoBeUsedIn.length > 0 && (
        <section className="glass rounded-[var(--radius-card)] p-6">
          <h2 style={{ fontSize: "1.25rem" }}>Może się przydać także w</h2>
          <ul className="mt-2 list-disc pl-5">{card.couldAlsoBeUsedIn.map((x, i) => <li key={i}>{t(x)}</li>)}</ul>
          <p className="mt-2 flex items-center gap-2 text-xs text-kamien"><BasisLabel basis="estimate" /> Na podstawie opisu w źródłach.</p>
        </section>
      )}

      <section id="zrodla" aria-labelledby="zrodla-h" className="glass rounded-[var(--radius-card)] p-6">
        <h2 id="zrodla-h" style={{ fontSize: "1.25rem" }}>Źródła</h2>
        <ol className="mt-3 space-y-4">
          {s.map((src, i) => (
            <li key={src.id} id={`zrodlo-${src.id}`} className="scroll-mt-24 rounded-2xl bg-white/60 p-4 ring-1 ring-white/80">
              <p className="font-tech text-sm text-kamien">[{i + 1}] {src.type === "api" ? "API" : src.type === "crawl" ? "Strona WWW" : "Dokument"} · pobrano <DateValue iso={src.retrievedAt} /></p>
              <p className="font-bold"><a href={src.url} target="_blank" rel="noopener noreferrer">{src.name}</a></p>
              {src.passage && (
                <blockquote lang={src.passageLang ?? undefined} className="mt-2 border-l-4 border-granat pl-3">„{src.passage}”</blockquote>
              )}
            </li>
          ))}
        </ol>
      </section>

      <footer className="glass flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] p-6 text-sm">
        <span>Właściciel: <a href={card.owner.url} target="_blank" rel="noopener noreferrer">{card.owner.name}</a></span>
        <span className="font-tech text-kamien">Pierwszy raz: <DateValue iso={card.firstSeenAt} /> · sprawdzono: <DateValue iso={card.lastCheckedAt} /></span>
      </footer>
    </article>
  );
}
