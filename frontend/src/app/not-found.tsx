import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** 404 for unknown URLs and for notFound() calls (a card id that does not exist). */
export default async function NotFound() {
  const t = await getTranslations("status");
  return (
    <main id="main" className="panel-surface mx-auto my-16 max-w-xl space-y-4 p-8 text-center">
      <p className="tech text-5xl font-semibold text-granat">{t("notFoundCode")}</p>
      <h1 className="text-h2">{t("notFoundTitle")}</h1>
      <p className="text-kamien">{t("notFoundText")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link href="/szukaj" className="btn btn-primary">{t("notFoundSearch")}</Link>
        <Link href="/" className="btn btn-ghost">{t("home")}</Link>
      </div>
    </main>
  );
}
