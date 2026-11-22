import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { fitter, Reserve } from "@/components/Fit";
import { AREA_ICON, Icon } from "@/components/Icons";
import { PageMove, T } from "@/components/motion/Motion";
import { SearchForm } from "@/components/SearchForm";
import { LOCALES, type Locale } from "@/i18n/locale";
import { text } from "@/lib/api";
import { attempt, DEMO_CARDS, getCard, getLatestTags, isFailure } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("find"))("metaTitle") };
}

/** Search: the title, the bar, the latest tags and the two example cards for the demo. A tag goes straight to its
 *  results; an example opens its card inside the search its demo script uses. Tag labels are fetched in all three
 *  languages and stacked like <Fit>, so switching language never moves the page. */
export default async function SearchPage() {
  const locale = (await getLocale()) as Locale;
  const [ft, fk] = await Promise.all([fitter("find"), fitter("kard")]);
  const [tagSets, examples] = await Promise.all([
    Promise.all(LOCALES.map((l) => attempt(getLatestTags("/szukaj", l)))),
    Promise.all(DEMO_CARDS.map((d) => attempt(getCard(d.id, "/szukaj")))),
  ]);
  const current = tagSets[LOCALES.indexOf(locale)];
  const tags = isFailure(current) ? [] : current;
  const labelIn = (slug: string) => LOCALES.map((l, i) => {
    const set = tagSets[i];
    const tag = isFailure(set) ? undefined : set.find((x) => x.slug === slug);
    return [l, tag ? text(tag.label, l) : ""] as const;
  });
  const shown = examples.map((c, i) => (isFailure(c) ? null : { card: c, href: `/wyniki?${DEMO_CARDS[i].list}&karta=${c.id}` })).filter((x) => !!x);

  return (
    <>
    <PageMove />
    <div className="search-page">
      <h1 className="search-title">{ft("title")}</h1>
      <SearchForm autoFocus />
      {tags.length > 0 && (
        <div className="tags-block">
          <h2 id="tagsH">{ft("tags")}</h2>
          <ul className="chips" role="list" aria-labelledby="tagsH">
            {tags.map((tag) => (
              <li key={tag.slug}>
                <Link className="chip" href={`/wyniki?tag=${tag.slug}`} scroll={false} transitionTypes={[T.search]}>
                  <Reserve text={text(tag.label, locale)} others={labelIn(tag.slug).filter(([l]) => l !== locale).map(([, label]) => label)} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {shown.length > 0 && (
        <section className="examples" aria-labelledby="exH">
          <h2 id="exH">{ft("examples")}</h2>
          <p>{ft("examplesNote")}</p>
          <ul role="list">
            {shown.map(({ card, href }) => (
              <li key={card.id} className="example">
                <h3><Link href={href} scroll={false} transitionTypes={[T.search]}>{text(card.title, locale)}</Link></h3>
                <span className={`area-tag a-${card.area}`}><span className="dot"><Icon name={AREA_ICON[card.area] ?? "doc"} /></span>{fk(`area_${card.area}`)}</span>
                <p className="org">{card.organisation.name}</p>
                <p className="facts">
                  <span className="fact-pair"><span className="k">{fk("level")}:</span> <b>{fk(`lvl_${card.implementationLevel.value}`)}</b> {card.implementationLevel.basis === "confirmed" ? <span className="badge b-conf"><Icon name="check" />{fk("confirmed")}</span> : <span className="badge b-est"><span className="tilde" aria-hidden="true">≈</span>{fk("estimate")}</span>}</span>
                  {card.polishIpStatus === "confirmed" && <span className="fact-pair"><span className="k">{fk("ipShort")}:</span> <b>{fk("yes")}</b> <span className="badge b-conf"><Icon name="check" />{fk("confirmed")}</span></span>}
                </p>
                <p className="card-foot">{fk("sourcesN", { n: card.sourceCount })}</p>
                <span className="chev" aria-hidden="true"><Icon name="chev" /></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
    </>
  );
}
