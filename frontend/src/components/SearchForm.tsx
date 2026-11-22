import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/Icons";

/** The search bar: one object on the search and results screens (56 px pill, the primary button inside). A plain GET form. */
export async function SearchForm({ q = "", autoFocus = false }: { q?: string; autoFocus?: boolean }) {
  const t = await getTranslations("find");
  return (
    <form className="search-form" action="/wyniki" role="search">
      <Icon name="search" />
      <label htmlFor="q" className="sr-only">{t("label")}</label>
      <input id="q" name="q" type="search" defaultValue={q} placeholder={t("placeholder")} autoComplete="off" enterKeyHint="search" autoFocus={autoFocus} />
      <button className="btn btn-primary" type="submit"><Icon name="search" /><span className="t">{t("submit")}</span></button>
    </form>
  );
}
