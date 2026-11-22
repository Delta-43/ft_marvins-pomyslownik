import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("methodologyTitle") };
}

/** Text page. Public: readable without signing in (linked from the landing). */
export default async function Page() {
  const t = await getTranslations("pages");
  return (
    <article className="page page-narrow box">
      <header className="page-head">
        <h1 tabIndex={-1}>{t("methodologyTitle")}</h1>
        <p className="lead">{t("methodologyLead")}</p>
      </header>
      <section className="d-sec">
        <h2>{t("m1Title")}</h2>
        <p className="prose">{t("m1Text")}</p>
      </section>
      <section className="d-sec">
        <h2>{t("m2Title")}</h2>
        <p className="prose">{t("m2Text")}</p>
      </section>
      <section className="d-sec">
        <h2>{t("m3Title")}</h2>
        <p className="prose">{t("m3Text")}</p>
      </section>
      <section className="d-sec">
        <h2>{t("m4Title")}</h2>
        <p className="prose">{t("m4Text")}</p>
      </section>
      <section className="d-sec">
        <h2>{t("m5Title")}</h2>
        <p className="prose">{t("m5Text")}</p>
      </section>
    </article>
  );
}
