import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/Icons";
import { fitter } from "@/components/Fit";
import { FIRST_SEARCH_PARAM } from "@/lib/cookie";

/** The search bar: one object on the search and results screens (56 px pill, the primary button inside). A plain GET form.
 *  `firstAudience`: the role chosen at registration, sent as the audience of the first search (TASKS.md A10). */
export async function SearchForm({ q = "", autoFocus = false, firstAudience }: { q?: string; autoFocus?: boolean; firstAudience?: string }) {
  const t = await getTranslations("find");
  const ft = await fitter("find");
  return (
    <form className="search-form" action="/wyniki" role="search">
      {firstAudience && <><input type="hidden" name="audience" value={firstAudience} /><input type="hidden" name={FIRST_SEARCH_PARAM} value="1" /></>}
      <Icon name="search" />
      <label htmlFor="q" className="sr-only">{ft("label")}</label>
      <input id="q" name="q" type="search" defaultValue={q} placeholder={t("placeholder")} autoComplete="off" enterKeyHint="search" autoFocus={autoFocus} />
      <button className="btn btn-primary" type="submit"><Icon name="search" /><span className="t">{ft("submit")}</span></button>
    </form>
  );
}
