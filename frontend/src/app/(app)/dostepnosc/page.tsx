import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("accessibilityTitle") };
}

/** Text page. Public: readable without signing in (linked from the landing). */
export default async function Page() {
  const t = await getTranslations("pages");
  return (
    <article className="page page-narrow box">
      <header className="page-head">
        <h1 tabIndex={-1}>{t("accessibilityTitle")}</h1>
        <p className="lead">{t("accessibilityLead")}</p>
      </header>
      <ul className="prose-list">
        <li>{t("a11y1")}</li>
        <li>{t("a11y2")}</li>
        <li>{t("a11y3")}</li>
        <li>{t("a11y4")}</li>
        <li>{t("a11y5")}</li>
        <li>{t("a11y6")}</li>
        <li>{t("a11y7")}</li>
        <li>{t("a11yChecked")}</li>
        <li>{t("a11yContact")}</li>
      </ul>
    </article>
  );
}
