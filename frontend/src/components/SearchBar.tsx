import { useTranslations } from "next-intl";
import { vt } from "@/components/motion/Motion";
import { SearchForm } from "@/components/SearchForm";

/** Search bar from the Search Page frame (800×80, pill). A plain GET form to /wyniki, so it works without JavaScript;
 *  with JavaScript the submit becomes a client navigation that plays the search → results move. The bar is one
 *  shared object on both pages (the "search-bar" name), so it glides from the centre of the search page to the top of the
 *  results, and back. */
export function SearchBar({ defaultValue = "", large = false }: { defaultValue?: string; large?: boolean }) {
  const t = useTranslations("search");
  return (
    <div style={vt("search-bar")} className="w-full">
      <SearchForm label={t("label")} placeholder={t("placeholder")} submit={t("submit")} defaultValue={defaultValue} large={large} />
    </div>
  );
}
