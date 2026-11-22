import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate } from "@/components/Cards";
import { Icon } from "@/components/Icons";
import type { Locale } from "@/i18n/locale";
import { text } from "@/lib/api";
import { attempt, getSources, isFailure } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("srcs"))("title") };
}

/** Sources: the public sources the cards are collected from. Read-only. */
export default async function SourcesPage() {
  const [t, tk, ts, locale, res] = await Promise.all([getTranslations("srcs"), getTranslations("kard"), getTranslations("shell"), getLocale(), attempt(getSources("/zrodla"))]);
  return (
    <div className="page">
      <header className="page-head">
        <h1 tabIndex={-1}>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
      </header>
      {isFailure(res) ? (
        <div className="msg msg-err" role="alert"><Icon name="alert" /><p>{t("error")}</p></div>
      ) : (
        <>
          <p className="mono count">{t("count", { n: res.meta.total })}</p>
          <div className="tablewrap" tabIndex={0} role="region" aria-labelledby="srcCap">
            <table className="t srcs">
              <caption className="sr-only" id="srcCap">{t("caption")}</caption>
              <thead><tr><th scope="col">{t("name")}</th><th scope="col">{t("type")}</th><th scope="col">{t("collected")}</th><th scope="col">{t("cards")}</th><th scope="col">{t("license")}</th></tr></thead>
              <tbody>
                {res.data.map((s) => (
                  <tr key={s.id}>
                    <th scope="row"><a href={s.url} target="_blank" rel="noopener">{text(s.nameText, locale) || s.name}<span className="sr-only"> {ts("newTab")}</span></a></th>
                    <td>{tk(`t_${s.type}`)}</td>
                    <td className="num">{s.lastCollectedAt ? formatDate(s.lastCollectedAt, locale as Locale) : <span className="how">{t("none")}</span>}</td>
                    <td className="num">{s.cardCount}</td>
                    <td>{s.license || <span className="how">{t("none")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
