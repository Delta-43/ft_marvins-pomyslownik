import { getLocale, getTranslations } from "next-intl/server";
import { LOCALES, type Locale } from "@/i18n/locale";

type Values = Record<string, string | number>;
type Translate = (key: string, values?: Values) => string;

/** A box as large as the longest of several texts, showing only the first. The others are drawn by CSS
 *  pseudo-elements in the same grid cell, invisible: they reserve space but are not in the page text, the
 *  accessible names, copy, find-in-page or translation tools, and they disappear with CSS off. */
export function Reserve({ text, others, bold, block }: { text: React.ReactNode; others: string[]; bold?: string; block?: boolean }) {
  const [g1 = "", g2 = ""] = others;
  return (
    <span className={block ? "fit fit-block" : "fit"} data-g1={g1} data-g2={g2}>
      {bold === undefined ? <span>{text}</span> : <span className="fit-cur" data-gb={bold}><span>{text}</span></span>}
    </span>
  );
}

/** Interface text that takes the same space in every language, so switching language moves nothing on screen.
 *
 *    const f = await fitter("login");   <h2>{f("title")}</h2>   <p>{f("lead", undefined, true)}</p>
 *
 *  `block` makes the box fill the line (paragraphs); the default shrinks to the text (buttons, labels, links).
 *  `reserveBold` also reserves the bold width, for text that turns bold when current (nav links). */
export async function fitter(namespace: string) {
  const locale = (await getLocale()) as Locale;
  const all = await Promise.all(LOCALES.map(async (l) => [l, (await getTranslations({ locale: l, namespace: namespace as never })) as unknown as Translate] as const));
  const current = all.find(([l]) => l === locale)![1];
  return function fit(key: string, values?: Values, block = false, reserveBold = false) {
    const text = current(key, values);
    const others = all.filter(([l]) => l !== locale).map(([, t]) => t(key, values));
    return <Reserve text={text} others={others} bold={reserveBold ? text : undefined} block={block} />;
  };
}
