import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

const AUDIENCES = [
  "Inwestorzy i firmy",
  "Instytucje publiczne",
  "Uczelnie",
  "Szkoły",
  "Startupy i przedsiębiorstwa",
  "Wynalazcy indywidualni",
];

// "Search Page" frame (/szukaj, signed-in only): centred search bar, plus the six audience presets from the task.
export default function SearchPage() {
  return (
    <section className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1 className="text-5xl sm:text-6xl">Znajdź polską <span className="bg-gradient-to-r from-granat to-[#6B4FC8] bg-clip-text text-transparent">innowację</span></h1>
      <p className="max-w-xl text-lg text-kamien">
        Istniejące rozwiązania technologiczne, edukacyjne i administracyjne. Każda wartość ze źródłem, oznaczona jako fakt lub szacunek.
      </p>
      <SearchBar large />
      <div>
        <h2 className="mb-3 text-base font-bold" style={{ fontSize: "1rem" }}>Szukam jako</h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {AUDIENCES.map((a) => (
            <li key={a}>
              <Link
                href={`/wyniki?odbiorca=${encodeURIComponent(a)}`}
                className="glass lift inline-block rounded-full px-4 py-2 text-sm font-medium text-atrament no-underline hover:bg-iskra/80"
              >
                {a}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
