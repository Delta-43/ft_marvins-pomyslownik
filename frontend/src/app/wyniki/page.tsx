import { SearchBar } from "@/components/SearchBar";

type Basis = "confirmed" | "estimate";
type Card = {
  title: string; org: string; area: string; category: keyof typeof CAT; level: string; trl: string;
  score: number | null; basis: Basis; summary: string;
};

const CAT = {
  uczelnie: { label: "Uczelnia", bg: "bg-uczelnie", icon: "🎓" },
  patenty: { label: "Patent", bg: "bg-patenty", icon: "📄" },
  laboratoria: { label: "Laboratorium", bg: "bg-laboratoria", icon: "🧪" },
  startupy: { label: "Startup", bg: "bg-startupy", icon: "🚀" },
} as const;

// [MOCK] sample data so the layout can be reviewed. Real data comes from GET /api/v1/cards.
const CARDS: Card[] = [
  { title: "[MOCK] Czujnik wilgotności gleby LoRa", org: "[MOCK] Politechnika Rzeszowska", area: "Technologiczna", category: "uczelnie", level: "Pilotaż", trl: "TRL 7", score: 78, basis: "confirmed", summary: "Bezprzewodowy czujnik dla rolnictwa precyzyjnego, testowany w trzech gospodarstwach." },
  { title: "[MOCK] Sposób odzysku litu z baterii", org: "[MOCK] Instytut Chemii", area: "Technologiczna", category: "patenty", level: "Prototyp", trl: "TRL 4", score: 64, basis: "estimate", summary: "Patent na hydrometalurgiczny proces odzysku z niższym zużyciem energii." },
  { title: "[MOCK] Cyfrowy dziennik eksperymentów dla szkół", org: "[MOCK] Szkoła Podstawowa nr 12", area: "Edukacyjna", category: "laboratoria", level: "W użyciu", trl: "Nie dotyczy", score: null, basis: "estimate", summary: "Narzędzie do prowadzenia lekcji przyrody metodą badawczą." },
  { title: "[MOCK] Asystent wniosków w urzędzie gminy", org: "[MOCK] GovTech Start", area: "Administracyjna", category: "startupy", level: "Testy", trl: "Nie dotyczy", score: 55, basis: "confirmed", summary: "Prowadzi mieszkańca przez wniosek krok po kroku, wdrożony w jednej gminie." },
];

function BasisLabel({ basis }: { basis: Basis }) {
  return basis === "confirmed" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-tak px-2.5 py-0.5 text-xs font-bold text-white shadow-[0_4px_12px_-4px_rgb(31_122_69/0.6)]">✓ Potwierdzone</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-atrament bg-white/60 px-2.5 py-0.5 text-xs font-bold">≈ Szacunek</span>
  );
}

// "Search Results" frame: search bar on top, filters on the left, card list.
export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <SearchBar defaultValue={q} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Filtry" className="glass h-fit space-y-6 rounded-3xl p-5 lg:sticky lg:top-24">
          {[["Obszar", ["Technologiczna", "Edukacyjna", "Administracyjna"]], ["Poziom wdrożenia", ["Koncepcja", "Prototyp", "Testy", "Pilotaż", "W użyciu"]]].map(([name, opts]) => (
            <fieldset key={name as string}>
              <legend className="mb-2 font-bold">{name}</legend>
              {(opts as string[]).map((o) => (
                <label key={o} className="flex items-center gap-2 py-0.5"><input type="checkbox" className="accent-granat" /> {o}</label>
              ))}
            </fieldset>
          ))}
        </aside>

        <section aria-labelledby="results-h">
          <div className="mb-4 flex items-baseline justify-between">
            <h1 id="results-h" style={{ fontSize: "1.5rem" }}>{q ? `Wyniki dla „${q}”` : "Wszystkie innowacje"}</h1>
            <p className="font-serif text-sm italic text-kamien">{CARDS.length} wyniki · dane przykładowe</p>
          </div>
          <ul className="grid gap-5 md:grid-cols-2">
            {CARDS.map((c) => {
              const cat = CAT[c.category];
              return (
                <li key={c.title} className="glass-strong lift flex flex-col gap-3 rounded-[var(--radius-card)] p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full ${cat.bg} px-2.5 py-0.5 text-xs font-bold ring-1 ring-white/80`}>
                      <span aria-hidden="true">{cat.icon}</span>{cat.label}
                    </span>
                    <span className="text-xs text-kamien">{c.area}</span>
                    <span className="ml-auto"><BasisLabel basis={c.basis} /></span>
                  </div>
                  <h2 style={{ fontSize: "1.25rem" }}><a href="#" className="text-atrament">{c.title}</a></h2>
                  <p className="text-sm text-kamien">{c.org}</p>
                  <p className="text-sm">{c.summary}</p>
                  <dl className="mt-auto grid grid-cols-3 gap-2 rounded-2xl bg-white/55 p-3 text-sm ring-1 ring-white/80">
                    <div><dt className="text-xs text-kamien">Wdrożenie</dt><dd className="font-bold">{c.level}</dd></div>
                    <div><dt className="text-xs text-kamien">Gotowość</dt><dd className="font-bold">{c.trl}</dd></div>
                    <div><dt className="text-xs text-kamien">Wiarygodność</dt><dd className="font-serif font-semibold tabular-nums">{c.score === null ? "Za mało danych" : `${c.score}/100`}</dd></div>
                  </dl>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-granat" /> Porównaj</label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
