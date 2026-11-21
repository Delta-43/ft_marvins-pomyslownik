/** Small display pieces shared by the results list and the card page. Labels never rely on colour alone. */
import type { Schemas } from "@/lib/api";

export const AREA: Record<Schemas["Area"], { label: string; bg: string; icon: string }> = {
  technological: { label: "Technologiczne", bg: "bg-uczelnie", icon: "⚙" },
  educational: { label: "Edukacyjne", bg: "bg-patenty", icon: "🎓" },
  administrative: { label: "Administracyjne", bg: "bg-laboratoria", icon: "🏛" },
};

export const LEVEL: Record<Schemas["ImplementationLevel"], string> = {
  concept: "Koncepcja",
  prototype: "Prototyp",
  testing: "Testy",
  pilot: "Pilotaż",
  in_practice: "W praktyce",
};

/** Polish plural: plural(4, ["wynik", "wyniki", "wyników"]) -> "wyniki". */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  if (n === 1) return one;
  const d = n % 10, dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
}

export function AreaChip({ area }: { area: Schemas["Area"] }) {
  const a = AREA[area];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${a.bg} px-2.5 py-0.5 text-xs font-bold ring-1 ring-white/80`}>
      <span aria-hidden="true">{a.icon}</span>{a.label}
    </span>
  );
}

export function BasisLabel({ basis }: { basis: Schemas["Basis"] }) {
  return basis === "confirmed" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-tak px-2 py-0.5 text-[0.7rem] font-bold text-white">✓ Potwierdzone</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-atrament/70 bg-white/60 px-2 py-0.5 text-[0.7rem] font-bold">≈ Szacunek</span>
  );
}

/** A 0–100 score, or "Za mało danych" when there is no value. Never shows 0 for missing data. */
export function ScoreValue({ value, sampleSize }: { value: number | null | undefined; sampleSize?: number | null }) {
  if (value === null || value === undefined) {
    return (
      <span className="font-tech font-semibold text-kamien">
        Za mało danych{typeof sampleSize === "number" && <span className="font-normal"> (n = {sampleSize})</span>}
      </span>
    );
  }
  return <span className="font-tech font-semibold tabular-nums">{value}/100</span>;
}

export function TrlValue({ trl }: { trl: { applicable: boolean; value?: number | null } }) {
  if (!trl.applicable) return <span className="font-tech font-semibold text-kamien">Nie dotyczy</span>;
  if (trl.value == null) return <span className="font-tech font-semibold text-kamien">Za mało danych</span>;
  return <span className="font-tech font-semibold tabular-nums">TRL {trl.value}</span>;
}

export function DateValue({ iso }: { iso: string | null | undefined }) {
  if (!iso) return <span className="font-tech">—</span>;
  const d = new Date(iso);
  return <time dateTime={iso} className="font-tech tabular-nums">{d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })}</time>;
}
