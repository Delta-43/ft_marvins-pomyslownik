import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("accessibilityTitle") };
}

/** Each section of the statement: a heading key and its list items (keys in `pages`). Every sentence must stay true
 *  on the live site: update the date and the numbers after each check (`frontend/scripts/a11y-check.mjs`). */
const SECTIONS = [
  { title: "a11yStatusTitle", items: ["a11yStatus1", "a11yStatus2"] },
  { title: "a11yFeaturesTitle", items: ["a11yFeature1", "a11yFeature2", "a11yFeature3", "a11yFeature4", "a11yFeature5"] },
  { title: "a11yCheckedTitle", items: ["a11yChecked1", "a11yChecked2", "a11yChecked3", "a11yChecked4", "a11yChecked5"] },
  { title: "a11yNotCheckedTitle", items: ["a11yNotChecked1", "a11yNotChecked2", "a11yNotChecked3"] },
  { title: "a11yLimitsTitle", items: ["a11yLimit1", "a11yLimit2", "a11yLimit3"] },
] as const;

/** Text page. Public: readable without signing in (linked from the landing). */
export default async function Page() {
  const t = await getTranslations("pages");
  const ts = await getTranslations("shell");
  return (
    <article className="page page-narrow box">
      <header className="page-head">
        <h1 tabIndex={-1}>{t("accessibilityTitle")}</h1>
        <p className="lead">{t("accessibilityLead")}</p>
      </header>
      {SECTIONS.map((s) => (
        <section className="d-sec" key={s.title}>
          <h2>{t(s.title)}</h2>
          <ul className="prose-list">
            {s.items.map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </section>
      ))}
      <section className="d-sec">
        <h2>{t("a11yReportTitle")}</h2>
        <p className="prose">
          {t.rich("a11yReport", { link: (chunks) => <a href={ts("helpUrl")}>{chunks}</a> })}
        </p>
      </section>
    </article>
  );
}
