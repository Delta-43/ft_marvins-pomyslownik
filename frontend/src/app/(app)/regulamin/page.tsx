import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("termsTitle") };
}

/** Text page. Public: readable without signing in (linked from the landing). */
export default async function Page() {
  const t = await getTranslations("pages");
  return (
    <article className="page page-narrow box">
      <header className="page-head">
        <h1 tabIndex={-1}>{t("termsTitle")}</h1>
        <p className="lead">{t("termsLead")}</p>
      </header>
      <ul className="prose-list">
        <li>{t("terms1")}</li>
        <li>{t("terms2")}</li>
        <li>{t("terms3")}</li>
        <li>{t("terms4")}</li>
        <li>{t("terms5")}</li>
      </ul>
    </article>
  );
}
