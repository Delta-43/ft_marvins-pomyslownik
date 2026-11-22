import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { PageMove, T } from "@/components/motion/Motion";
import { SearchForm } from "@/components/SearchForm";
import { text } from "@/lib/api";
import { attempt, getLatestTags, isFailure } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("find"))("metaTitle") };
}

/** Search: the title, the bar and the latest tags. Nothing else. A tag goes straight to its results. */
export default async function SearchPage() {
  const [t, locale, tags] = await Promise.all([getTranslations("find"), getLocale(), attempt(getLatestTags("/szukaj"))]);
  return (
    <>
    <PageMove />
    <div className="search-page">
      <h1 className="search-title">{t("title")}</h1>
      <SearchForm autoFocus />
      {!isFailure(tags) && tags.length > 0 && (
        <div className="tags-block">
          <h2 id="tagsH">{t("tags")}</h2>
          <ul className="chips" role="list" aria-labelledby="tagsH">
            {tags.map((tag) => (
              <li key={tag.slug}><Link className="chip" href={`/wyniki?tag=${tag.slug}`} scroll={false} transitionTypes={[T.search]}>{text(tag.label, locale)}</Link></li>
            ))}
          </ul>
        </div>
      )}
    </div>
    </>
  );
}
