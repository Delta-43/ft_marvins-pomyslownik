import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/SearchBar";
import { api, pick, type Schemas } from "@/lib/api";

// "Search Page" frame (/szukaj, signed-in only): centred search bar, plus the six audience presets from the task.
export default async function SearchPage() {
  const [t, locale] = await Promise.all([getTranslations("search"), getLocale()]);
  // Public endpoint. The six audiences from the task, each with its default filters on the backend.
  const audiences = await api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data).catch(() => []);
  return (
    <section className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1 className="text-5xl sm:text-6xl">
        {t.rich("title", { hl: (c) => <span className="bg-gradient-to-r from-granat to-[#6B4FC8] bg-clip-text text-transparent">{c}</span> })}
      </h1>
      <p className="max-w-xl text-lg text-kamien">{t("lead")}</p>
      <SearchBar large />
      <div>
        <h2 className="mb-3 text-base font-bold" style={{ fontSize: "1rem" }}>{t("audiences")}</h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {audiences.map((a) => (
            <li key={a.id}>
              <Link
                href={`/wyniki?audience=${a.id}`}
                title={pick(a.description, locale)}
                className="glass lift inline-block rounded-full px-4 py-2 text-sm font-medium text-atrament no-underline hover:bg-iskra/80"
              >
                {pick(a.label, locale)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
