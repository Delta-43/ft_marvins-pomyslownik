import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate } from "@/components/Cards";
import { Icon } from "@/components/Icons";
import type { Locale } from "@/i18n/locale";
import { text } from "@/lib/api";
import { attempt, getSources, isFailure } from "@/lib/data";
import { fitter } from "@/components/Fit";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("srcs"))("title") };
}

/** Sources: the public sources the cards are collected from. Read-only. */
export default async function SourcesPage() {
  const [t, tk, ts, locale, res] = await Promise.all([getTranslations("srcs"), getTranslations("kard"), getTranslations("shell"), getLocale(), attempt(getSources("/zrodla"))]);
  const ft = await fitter("srcs");
  return (
    <div className="page">
      <header className="page-head">
        <h1 tabIndex={-1}>{ft("title")}</h1>
        <p className="lead">{ft("lead")}</p>
      </header>
      {isFailure(res) ? (
        <div className="msg msg-err" role="alert"><Icon name="alert" /><p>{ft("error")}</p></div>
      ) : (
        <>
          <p className="mono count">{ft("count", { n: res.meta.total })}</p>
          <div className="tablewrap" tabIndex={0} role="region" aria-labelledby="srcCap">
            <table className="t srcs">
              <caption className="sr-only" id="srcCap">{ft("caption")}</caption>
              <thead><tr><th scope="col">{ft("name")}</th><th scope="col">{ft("type")}</th><th scope="col">{ft("collected")}</th><th scope="col">{ft("cards")}</th><th scope="col">{ft("license")}</th></tr></thead>
              <tbody>
                {res.data.map((s) => (
                  <tr key={s.id}>
                    <th scope="row"><a href={s.url} target="_blank" rel="noopener">{text(s.nameText, locale) || s.name}<span className="sr-only"> {ts("newTab")}</span></a></th>
                    <td>{tk(`t_${s.type}`)}</td>
                    <td className="num">{s.lastCollectedAt ? formatDate(s.lastCollectedAt, locale as Locale) : <span className="how">{ft("none")}</span>}</td>
                    <td className="num">{s.cardCount}</td>
                    <td>{s.license || <span className="how">{ft("none")}</span>}</td>
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
