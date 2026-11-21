import type { Metadata } from "next";
import Link from "next/link";
import { HeroArt } from "@/components/landing/HeroArt";

// Landing page ("/"). Public: no card data here (docs/FRONTEND-START.md section 6).
// Message kept from the flow: search needs an account, which protects the authors' IP. Entry point is /logowanie.
// Artwork: Blender renders in /public/landing (Alban).

export const metadata: Metadata = {
  title: "Pomysłownik! - Tu pomysły znajdują ludzi.",
  description:
    "Pomysłownik! łączy zespoły uczelni, laboratoria, właścicieli patentów i startupy w całej Polsce. Ze źródłami i uczciwą oceną.",
};

const LOGIN = "/logowanie";
const REGISTER = "/logowanie?tryb=rejestracja";

const STEPS = [
  { title: "Zaloguj się i wybierz rolę", text: "Twoja rola ustawia startowe filtry. Zmienisz ją w profilu." },
  { title: "Szukaj po dziedzinie, regionie i typie", text: "Technologia, medycyna, robotyka, AI — od małych uczelni po duże." },
  { title: "Sprawdź źródła i dotrzyj do zespołu", text: "Każda liczba ma źródło i datę." },
];

const DOORS = [
  { name: "Uczelnie", text: "Zespoły badawcze i ich dorobek wdrożeniowy.", bg: "bg-uczelnie", img: "cat-uczelnie",
    icon: <><path d="M2 6.5L8 3l6 3.5Z" /><path d="M4.5 8v4M8 8v4M11.5 8v4M2.5 13.5h11" /></> },
  { name: "Patenty", text: "Zgłoszenia i patenty gotowe do licencji.", bg: "bg-patenty", img: "cat-patenty",
    icon: <><path d="M4 2h5.5L12.5 5v9h-8.5Z" /><path d="M6.5 8h4M6.5 11h4" /></> },
  { name: "Laboratoria", text: "Pracownie, aparatura i usługi badawcze.", bg: "bg-laboratoria", img: "cat-laboratoria",
    icon: <><path d="M6 2h4M7 2v4.5L3.2 13a1 1 0 0 0 .9 1.5h7.8a1 1 0 0 0 .9-1.5L9 6.5V2" /><path d="M5 10.5h6" /></> },
  { name: "Startupy", text: "Spółki wyrosłe z badań.", bg: "bg-startupy", img: "cat-startupy",
    icon: <><path d="M2 12l4-4 3 2.5L14 4.5" /><path d="M10 4.5h4v4" /></> },
];

const AUDIENCES = [
  { name: "Naukowiec", text: "Znajdź partnerów do wdrożeń.", d: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9" },
  { name: "Biznes", text: "Znajdź technologię i zespół.", d: "M3.5 8h17v11h-17Z M8.5 8V5.5h7V8 M3.5 13h17" },
  { name: "Inwestor", text: "Znajdź projekty gotowe do rozwoju.", d: "M4 4v16h16 M8 15l4-4 3 3 5-6 M16 8h4v4" },
  { name: "Student", text: "Znajdź miejsce na praktyki i badania.", d: "M2 9.5l10-5 10 5-10 5Z M6 11.5v4.5c3.5 2.5 8.5 2.5 12 0v-4.5 M22 9.5v5" },
  { name: "Administracja publiczna", text: "Zobacz potencjał regionu.", d: "M3 9.5L12 4l9 5.5Z M5.5 11v7 M10 11v7 M14 11v7 M18.5 11v7 M3 20.5h18" },
  { name: "Media", text: "Sprawdzaj fakty u źródła.", d: "M4 5h12v14H6.5A2.5 2.5 0 0 1 4 16.5Z M16 9h4v8a2 2 0 0 1-4 0 M7.5 9h5 M7.5 12.5h5 M7.5 16h3" },
];

/** Big outlined section number ("01"). Decorative. */
function SectionNumber({ n, dark = false }: { n: string; dark?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="font-display block w-[clamp(6rem,14vw,13rem)] flex-none text-[clamp(4.5rem,11vw,10rem)] font-bold leading-[0.9] tracking-[-0.03em] text-transparent"
      style={{ WebkitTextStroke: `2px ${dark ? "#F7F2EB" : "#141414"}` }}
    >
      {n}
    </span>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" className={className}>
      <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Picture({ name, alt = "", className, w, h, lazy = true }: { name: string; alt?: string; className?: string; w: number; h: number; lazy?: boolean }) {
  return (
    <picture>
      <source srcSet={`/landing/${name}.avif`} type="image/avif" />
      <img src={`/landing/${name}.webp`} alt={alt} width={w} height={h} loading={lazy ? "lazy" : undefined} className={className} />
    </picture>
  );
}

const container = "mx-auto max-w-[90rem] px-[clamp(1rem,4vw,3rem)]";
const sectionTitle = "m-0 text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.05] tracking-[-0.02em] [text-wrap:balance]";

export default function LandingPage() {
  return (
    <div className="text-lg">
      {/* Hero */}
      <section aria-labelledby="h-hero" className="relative overflow-hidden">
        <div className={`${container} flex min-h-[calc(100svh-4.5rem)] flex-wrap gap-[clamp(2rem,4vw,4rem)] pt-[clamp(2rem,5vw,4rem)]`}>
          <div className="flex min-w-0 flex-[7_1_34rem] flex-col">
            <p className="m-0 text-sm font-bold tracking-[0.18em]">PLATFORMA DLA INNOWATORÓW</p>
            <h1 id="h-hero" className="mt-5 mb-0 pt-[0.06em] text-[clamp(3.5rem,9vw,9rem)] leading-[1.05] tracking-[-0.02em] [text-wrap:balance]">
              Tu pomysły znajdują ludzi.
            </h1>
            <p className="mt-7 mb-0 max-w-[60ch] text-[clamp(1.125rem,1.4vw,1.375rem)] [text-wrap:pretty]">
              Pomysłownik! łączy zespoły uczelni, laboratoria, właścicieli patentów i startupy w całej Polsce. Zobacz, kto pracuje nad tym,
              czego szukasz — i jak do niego dotrzeć.
            </p>
            <div className="relative mt-6 -ml-[clamp(1rem,4vw,3rem)] flex-[1_0_clamp(320px,38vw,560px)] overflow-hidden">
              <HeroArt />
            </div>
          </div>

          {/* Sign-in call to action. The real sign-in lives on /logowanie. */}
          <div className="flex min-w-0 flex-[5_1_22rem] flex-col justify-center pb-[clamp(2rem,5vw,4rem)]">
            <div id="logowanie" className="glass-strong flex flex-col gap-5 rounded-[var(--radius-card)] p-[clamp(1.5rem,3vw,2.5rem)]">
              <div>
                <h2 className="m-0 text-[2rem]">Zaloguj się</h2>
                <p className="m-0 mt-1 text-base text-kamien">Karty innowacji są dostępne po zalogowaniu — chronimy własność intelektualną autorów.</p>
              </div>
              <Link href={LOGIN} className="btn-primary inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-6 text-lg font-bold no-underline">
                Zaloguj się, aby szukać <Arrow />
              </Link>
              <p className="m-0 text-base">
                Nie masz konta?{" "}
                <Link href={REGISTER} className="font-bold underline underline-offset-[0.2em]">Załóż konto</Link>
              </p>
              <p className="m-0 flex gap-3 rounded-2xl bg-papier/80 p-4 text-sm text-kamien">
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className="mt-0.5 flex-none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                W wersji demonstracyjnej logujesz się tożsamością testową. To nie jest weryfikacja krajowa.
              </p>
            </div>
          </div>
        </div>
        <p aria-hidden="true" className="absolute top-1/2 right-2.5 m-0 hidden -translate-y-1/2 rotate-180 font-mono text-sm tracking-[0.2em] whitespace-nowrap text-kamien [writing-mode:vertical-rl] lg:block">
          POMYSŁOWNIK! · WERSJA DEMO · 2026
        </p>
      </section>

      {/* 01 How it works */}
      <section id="jak-to-dziala" aria-labelledby="h-jak" className={`${container} flex flex-wrap gap-[clamp(1.5rem,4vw,4rem)] py-[clamp(4rem,9vw,8rem)]`}>
        <SectionNumber n="01" />
        <div className="min-w-0 flex-[1_1_40rem]">
          <h2 id="h-jak" className={sectionTitle}>Jak to działa</h2>
          <ol className="mt-14 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-x-8 gap-y-12 p-0">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative flex flex-col gap-3 border-t border-atrament pt-8">
                <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" className="absolute -top-[9px] left-0 box-content bg-[#F4EEE6] pr-2">
                  <path d="M9 0C9.8 5.6 12.4 8.2 18 9 12.4 9.8 9.8 12.4 9 18 8.2 12.4 5.6 9.8 0 9 5.6 8.2 8.2 5.6 9 0Z" fill="#141414" />
                </svg>
                <span aria-hidden="true" className="font-display text-[clamp(4rem,7vw,6.5rem)] leading-none font-normal tracking-[-0.03em]">{i + 1}</span>
                <h3 className="m-0 text-[1.625rem] leading-[1.15]">{s.title}</h3>
                <p className="m-0 max-w-[34ch]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 02 Four doors */}
      <section id="cztery-drzwi" aria-labelledby="h-drzwi" className={`${container} flex flex-wrap gap-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,9vw,8rem)]`}>
        <SectionNumber n="02" />
        <div className="min-w-0 flex-[1_1_40rem]">
          <h2 id="h-drzwi" className={`${sectionTitle} max-w-[16ch]`}>Cztery drzwi do polskich innowacji</h2>
          <ul className="mt-18 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] gap-x-6 gap-y-15 p-0">
            {DOORS.map((d) => (
              <li key={d.name}>
                <Link
                  href={LOGIN}
                  className={`${d.bg} lift relative flex h-full min-h-[300px] flex-wrap gap-5 rounded-[var(--radius-card)] px-7 pt-14 pb-7 text-atrament no-underline focus-visible:-translate-y-1`}
                >
                  <span aria-hidden="true" className="absolute -top-7 left-7 grid size-14 place-items-center rounded-full border-4 border-papier bg-atrament">
                    <svg viewBox="0 0 16 16" width="24" height="24">
                      <g fill="none" stroke="#F7F2EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{d.icon}</g>
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-[1_1_14rem] flex-col gap-2.5">
                    <h3 className="m-0 text-[clamp(1.75rem,2.6vw,2.25rem)]">{d.name}</h3>
                    <span>{d.text}</span>
                    <span className="mt-auto flex items-center gap-3 pt-4 text-base font-bold">
                      <span aria-hidden="true" className="grid size-12 flex-none place-items-center rounded-full bg-atrament text-papier"><Arrow /></span>
                      Zaloguj się, aby przeglądać
                    </span>
                  </span>
                  <span aria-hidden="true" className="flex w-[140px] flex-none items-center self-center">
                    <Picture name={d.img} w={140} h={140} className="size-[140px] object-contain" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 03 Constellation */}
      <section id="konstelacja" aria-labelledby="h-konst" className="bg-atrament text-papier">
        <div className={`${container} flex flex-wrap items-center gap-[clamp(2rem,4vw,4rem)] py-[clamp(4rem,9vw,8rem)]`}>
          <div className="flex min-w-0 flex-[1_1_24rem] flex-col items-start gap-6">
            <SectionNumber n="03" dark />
            <h2 id="h-konst" className="m-0 text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-papier [text-wrap:balance]">
              Każdy węzeł to ktoś, kto coś <span className="text-iskra">tworzy</span>.
            </h2>
            <p className="m-0 max-w-[40ch] text-xl text-[#E4DDD2]">Pomysłownik! pokazuje połączenia między nauką, biznesem i administracją.</p>
          </div>
          <div aria-hidden="true" className="relative min-w-0 flex-[1.5_1_30rem] overflow-hidden rounded-[var(--radius-card)] bg-[radial-gradient(120%_90%_at_65%_40%,#1B3F8F_0%,#141414_72%)]">
            <Picture name="konstelacja" w={2000} h={1000} className="block aspect-[4/3] w-full object-cover object-[82%_50%]" />
          </div>
        </div>
      </section>

      {/* 04 Audiences */}
      <section id="dla-kogo" aria-labelledby="h-kto" className={`${container} flex flex-wrap gap-[clamp(1.5rem,4vw,4rem)] py-[clamp(4rem,9vw,8rem)]`}>
        <SectionNumber n="04" />
        <div className="min-w-0 flex-[1_1_40rem]">
          <h2 id="h-kto" className={sectionTitle}>Dla kogo jest Pomysłownik!</h2>
          <ul className="mt-14 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] gap-5 p-0">
            {AUDIENCES.map((a) => (
              <li key={a.name} className="glass flex flex-col gap-3.5 rounded-[var(--radius-card)] p-7">
                <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
                  <path d={a.d} fill="none" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="m-0 text-[1.625rem] leading-[1.15]">{a.name}</h3>
                <p className="m-0">{a.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 05 Principles */}
      <section id="zasady" aria-labelledby="h-zasady" className={`${container} flex flex-wrap gap-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,9vw,8rem)]`}>
        <SectionNumber n="05" />
        <div className="min-w-0 flex-[1_1_40rem]">
          <h2 id="h-zasady" className={sectionTitle}>Rzetelnie i dostępnie</h2>
          <ul className="mt-14 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-5 p-0">
            <li className="glass flex flex-col gap-4 rounded-[var(--radius-card)] p-7">
              <h3 className="m-0 text-[1.625rem] leading-[1.15]">Źródło przy każdej liczbie</h3>
              <p className="m-0 self-start rounded-xl bg-papier px-3.5 py-2.5 font-mono text-sm text-kamien">Źródło: GUS · 12.03.2026 [PRZYKŁAD]</p>
            </li>
            <li className="glass flex flex-col gap-4 rounded-[var(--radius-card)] p-7">
              <h3 className="m-0 text-[1.625rem] leading-[1.15]">Potwierdzone czy szacunek</h3>
              <div className="flex flex-wrap gap-2.5">
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-atrament pr-3.5 pl-2.5 text-[0.9375rem] font-bold text-papier">
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="#F7F2EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Potwierdzone
                </span>
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-atrament pr-3.5 pl-2.5 text-[0.9375rem] font-bold">
                  <span aria-hidden="true" className="font-mono">~</span>Szacunek
                </span>
              </div>
              <p className="m-0">„Potwierdzone” to wartość wprost ze źródła, a „Szacunek” to wartość wyliczona z danych publicznych.</p>
            </li>
            <li className="glass flex flex-col gap-4 rounded-[var(--radius-card)] p-7">
              <h3 className="m-0 text-[1.625rem] leading-[1.15]">Dostępność WCAG 2.2 AA</h3>
              <p className="m-0">Klawiatura, kontrast, czytniki ekranu, tryb bez animacji.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="h-cta" className="bg-atrament text-papier">
        <div className={`${container} flex flex-wrap items-center justify-between gap-[clamp(2rem,4vw,4rem)] py-[clamp(4rem,8vw,7rem)]`}>
          <div className="flex min-w-0 flex-[1_1_28rem] flex-col items-start gap-9">
            <h2 id="h-cta" className="m-0 text-[clamp(3rem,8vw,8rem)] leading-[1.05] tracking-[-0.02em] text-papier [text-wrap:balance]">Znajdź swoich ludzi.</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={LOGIN} className="btn-accent inline-flex min-h-13 items-center rounded-full px-7 font-bold no-underline">Zaloguj się</Link>
              <Link href={REGISTER} className="inline-flex min-h-13 items-center rounded-full border-[1.5px] border-papier px-7 font-bold text-papier no-underline transition-colors hover:bg-[#2A2826]">
                Załóż konto
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="min-w-0 flex-[0_1_26rem]">
            <Picture name="cta-sygnet" w={1600} h={1600} className="block h-auto w-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
