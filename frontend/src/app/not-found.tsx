import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** 404 for unknown URLs and for notFound() calls (e.g. a card id that does not exist). */
export default async function NotFound() {
  const t = await getTranslations("status");
  return (
    <div className="glass mx-auto my-16 max-w-xl space-y-4 rounded-[2rem] p-8 text-center">
      <p className="font-tech text-5xl font-semibold text-granat">{t("notFoundCode")}</p>
      <h1 style={{ fontSize: "1.75rem" }}>{t("notFoundTitle")}</h1>
      <p className="text-kamien">{t("notFoundText")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link href="/szukaj" className="btn-primary rounded-full px-6 py-2.5 font-bold no-underline">{t("notFoundSearch")}</Link>
        <Link href="/" className="rounded-full px-5 py-2.5 font-bold">{t("home")}</Link>
      </div>
    </div>
  );
}
