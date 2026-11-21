/** Small display pieces shared by the results list and the card page. Labels never rely on colour alone.
 *  Text comes from the dictionary (messages/*.json, namespace "bits"). */
import { useLocale, useTranslations } from "next-intl";
import type { Schemas } from "@/lib/api";
import { DATE_LOCALE, isLocale } from "@/i18n/locale";

export const AREA_STYLE: Record<Schemas["Area"], { bg: string; icon: string }> = {
  technological: { bg: "bg-uczelnie", icon: "⚙" },
  educational: { bg: "bg-patenty", icon: "🎓" },
  administrative: { bg: "bg-laboratoria", icon: "🏛" },
};

export function AreaChip({ area }: { area: Schemas["Area"] }) {
  const t = useTranslations("bits.area");
  const a = AREA_STYLE[area];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${a.bg} px-2.5 py-0.5 text-xs font-bold ring-1 ring-white/80`}>
      <span aria-hidden="true">{a.icon}</span>{t(area)}
    </span>
  );
}

/** Implementation level as words ("Pilotaż" / "Pilot"). */
export function LevelValue({ level }: { level: Schemas["ImplementationLevel"] }) {
  const t = useTranslations("bits.level");
  return <>{t(level)}</>;
}

export function BasisLabel({ basis }: { basis: Schemas["Basis"] }) {
  const t = useTranslations("bits");
  return basis === "confirmed" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-tak px-2 py-0.5 text-[0.7rem] font-bold text-white">{t("confirmed")}</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-atrament/70 bg-white/60 px-2 py-0.5 text-[0.7rem] font-bold">{t("estimate")}</span>
  );
}

/** A 0–100 score, or "not enough data" when there is no value. Never shows 0 for missing data. */
export function ScoreValue({ value, sampleSize }: { value: number | null | undefined; sampleSize?: number | null }) {
  const t = useTranslations("bits");
  if (value === null || value === undefined) {
    return (
      <span className="font-tech font-semibold text-kamien">
        {t("notEnoughData")}{typeof sampleSize === "number" && <span className="font-normal"> (n = {sampleSize})</span>}
      </span>
    );
  }
  return <span className="font-tech font-semibold tabular-nums">{value}/100</span>;
}

export function TrlValue({ trl }: { trl: { applicable: boolean; value?: number | null } }) {
  const t = useTranslations("bits");
  if (!trl.applicable) return <span className="font-tech font-semibold text-kamien">{t("notApplicable")}</span>;
  if (trl.value == null) return <span className="font-tech font-semibold text-kamien">{t("notEnoughData")}</span>;
  return <span className="font-tech font-semibold tabular-nums">TRL {trl.value}</span>;
}

export function DateValue({ iso }: { iso: string | null | undefined }) {
  const locale = useLocale();
  if (!iso) return <span className="font-tech">—</span>;
  const d = new Date(iso);
  const tag = DATE_LOCALE[isLocale(locale) ? locale : "pl"];
  return <time dateTime={iso} className="font-tech tabular-nums">{d.toLocaleDateString(tag, { day: "2-digit", month: "2-digit", year: "numeric" })}</time>;
}
