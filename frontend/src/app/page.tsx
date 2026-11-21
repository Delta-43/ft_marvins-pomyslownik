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

// "Search Page" frame: centred search bar, plus the six audience presets from the task.
export default function SearchPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1>Znajdź polską innowację</h1>
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
                className="inline-block rounded-full border border-atrament px-4 py-1.5 text-sm text-atrament no-underline hover:bg-iskra"
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
