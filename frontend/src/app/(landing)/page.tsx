import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { HeroArt } from "@/components/landing/HeroArt";
import { LandingShell, PauseButton } from "@/components/landing/LandingClient";

// Landing page ("/"), a faithful port of the brand prototype landing/Landing.dc.html (Alban).
// Public: no card data here (docs/FRONTEND-START.md section 6). Search needs an account, which protects the
// authors' IP; the real sign-in and registration live on /logowanie. Artwork: Blender renders in /public/landing.

export const metadata: Metadata = {
  title: "Pomysłownik! - Tu pomysły znajdują ludzi.",
  description:
    "Pomysłownik! łączy zespoły uczelni, laboratoria, właścicieli patentów i startupy w całej Polsce. Ze źródłami i uczciwą oceną.",
};

const SIGN_IN = "/logowanie";
const REGISTER = "/logowanie?tryb=rejestracja";
const MONO = "font-['Atkinson_Hyperlegible_Mono',ui-monospace,monospace]";
const PAD_X = "px-[clamp(1rem,4vw,3rem)]";
const WRAP = `mx-auto box-border max-w-[90rem] ${PAD_X}`;
const H2 = "m-0 font-display text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.1] font-bold tracking-[-0.01em] [text-wrap:balance]";
const H3 = "m-0 font-display text-[1.375rem] leading-[1.2] font-bold tracking-normal";
const CARD = "flex flex-col rounded-3xl border border-krawedz bg-white p-6";

const STEPS = [
  { title: "Zaloguj się i wybierz rolę", text: "Twoja rola ustawia startowe filtry. Zmienisz ją w profilu." },
  { title: "Szukaj po dziedzinie, regionie i typie", text: "Technologia, medycyna, robotyka, AI. Od małych uczelni po duże." },
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

function SectionNumber({ n, dark = false }: { n: string; dark?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex-none font-display text-[clamp(4.5rem,11vw,10rem)] leading-[0.9] font-bold tracking-[-0.03em] text-transparent ${dark ? "" : "w-[clamp(6rem,14vw,13rem)]"}`}
      style={{ WebkitTextStroke: `2px ${dark ? "#FFD93D" : "#1B3F8F"}` }}
    >
      {n}.
    </span>
  );
}

function Arrow({ size = 18, stroke = "currentColor" }: { size?: number; stroke?: string }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Picture({ name, w, h, className, lazy = true }: { name: string; w: number; h: number; className?: string; lazy?: boolean }) {
  return (
    <picture>
      <source srcSet={`/landing/${name}.avif`} type="image/avif" />
      <img src={`/landing/${name}.webp`} alt="" width={w} height={h} loading={lazy ? "lazy" : undefined} className={className} />
    </picture>
  );
}

function Grain({ id }: { id: string }) {
  return (
    <svg width="100%" height="100%" className="pointer-events-none absolute inset-0 opacity-5 mix-blend-screen">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** Sign-in panel (PanelLogowania, default state). The test-identity button leads to the real sign-in. */
function SignInPanel() {
  return (
    <section
      id="logowanie"
      tabIndex={-1}
      aria-labelledby="h-logowanie"
      className="box-border flex w-full flex-col gap-5 rounded-3xl border border-krawedz bg-white p-6 text-[1.125rem] leading-[1.55] text-atrament outline-none"
    >
      <div className="flex flex-col gap-1">
        <h2 id="h-logowanie" className="m-0 font-display text-[2rem] leading-[1.1] font-bold tracking-[-0.01em]">Zaloguj się</h2>
        <p className="m-0 text-kamien">Wybierz sposób logowania</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <Link
          id="sandbox-btn"
          href={SIGN_IN}
          aria-describedby="sandbox-help"
          className="flex min-h-11 w-full items-center gap-3 rounded-full bg-granat px-[22px] py-1.5 text-left text-base leading-[1.3] font-bold text-papier no-underline hover:bg-[#14306E] hover:text-papier"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="flex-none">
            <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.9-3.8 3.6-5.8 7-5.8s6.1 2 7 5.8" /></g>
          </svg>
          <span className="flex-1">Kontynuuj z tożsamością testową</span>
          <span className={`flex-none rounded-md bg-papier px-2 py-0.5 text-sm font-medium tracking-[0.06em] text-atrament ${MONO}`}>TEST</span>
        </Link>
        <p id="sandbox-help" className="m-0 text-base text-kamien">To nie jest weryfikacja krajowa. Służy wyłącznie do wersji demonstracyjnej.</p>
      </div>
      <hr className="m-0 border-0 border-t border-krawedz" />
      <p className="m-0 flex flex-wrap items-center gap-1.5">
        Nie masz konta?
        <Link href={REGISTER} className="rounded font-bold text-granat underline underline-offset-4 hover:text-atrament">Zarejestruj się</Link>
      </p>
      {/* Info message (DESIGN.md 6): icon, bold lead word, Granat 1.5px border on #EEF1F8, radius 16, padding 16. */}
      <div className="flex gap-3 rounded-2xl border-[1.5px] border-granat bg-[#EEF1F8] p-4">
        <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true" className="mt-0.5 flex-none">
          <circle cx="10" cy="10" r="10" fill="#1B3F8F" /><circle cx="10" cy="5.8" r="1.3" fill="#FFFFFF" /><path d="M10 9v5.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <p className="m-0 text-base"><strong>Informacja.</strong> Karty są dostępne po zalogowaniu. Chronimy własność intelektualną autorów.</p>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-[18px] gap-y-2 p-0 text-base">
        <li><a href="#regulamin" className="rounded text-atrament underline underline-offset-[0.2em] hover:text-granat">Regulamin</a></li>
        <li><a href="#deklaracja-dostepnosci" className="rounded text-atrament underline underline-offset-[0.2em] hover:text-granat">Deklaracja dostępności</a></li>
      </ul>
    </section>
  );
}

export default function LandingPage() {
  return (
    <LandingShell>
      <div id="landing-root" className="flex-1 bg-papier font-body text-[1.125rem] leading-[1.55] text-atrament antialiased">
        <a href="#logowanie" className="absolute top-3 -left-[9999px] z-[100] flex min-h-11 items-center rounded-full bg-atrament px-5 font-bold text-papier no-underline focus:left-4">
          Przejdź do logowania
        </a>

        <main id="main" tabIndex={-1} className="outline-none">
          {/* Hero */}
          <section aria-labelledby="h1" className="relative overflow-hidden">
            <div className={`${WRAP} flex min-h-svh flex-wrap gap-[clamp(2rem,4vw,4rem)] pt-[clamp(2rem,5vw,4rem)]`}>
              <div className="flex min-w-0 flex-[7_1_34rem] flex-col">
                <p className="m-0 text-sm font-bold tracking-[0.18em]">PLATFORMA DLA INNOWATORÓW</p>
                <h1 id="h1" className="mt-5 mb-0 pt-[0.06em] font-display text-[clamp(3.5rem,9vw,9rem)] leading-[1.1] font-bold tracking-[-0.01em] [text-wrap:balance]">
                  Tu pomysły znajdują ludzi.
                </h1>
                <p className="mt-7 mb-0 max-w-[60ch] text-[clamp(1.125rem,1.4vw,1.375rem)] leading-[1.55] [text-wrap:pretty]">
                  Pomysłownik! łączy zespoły uczelni, laboratoria, właścicieli patentów i startupy w całej Polsce. Zobacz, kto pracuje nad tym, czego szukasz, i jak do niego dotrzeć.
                </p>
                <HeroArt />
              </div>
              <div className="flex min-w-0 flex-[5_1_22rem] flex-col justify-center pb-[clamp(2rem,5vw,4rem)]">
                <SignInPanel />
              </div>
            </div>
            <p aria-hidden="true" className={`absolute top-1/2 right-2.5 m-0 hidden -translate-y-1/2 rotate-180 text-sm tracking-[0.2em] whitespace-nowrap text-kamien [writing-mode:vertical-rl] min-[1080px]:block ${MONO}`}>
              Pomysłownik! · wersja demo · 2026
            </p>
          </section>

          {/* 01 Jak to działa */}
          <section id="jak-to-dziala" aria-labelledby="h-jak" className={`${WRAP} flex flex-wrap gap-[clamp(1.5rem,4vw,4rem)] py-[clamp(4rem,9vw,8rem)]`}>
            <SectionNumber n="01" />
            <div className="min-w-0 flex-[1_1_40rem]">
              <h2 id="h-jak" className={H2}>Jak to działa</h2>
              <ol className="mt-14 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-x-8 gap-y-12 p-0">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="relative flex flex-col gap-3 border-t border-atrament pt-8">
                    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" className="absolute -top-[9px] left-0 box-content bg-papier pr-2">
                      <path d="M9 0C9.8 5.6 12.4 8.2 18 9 12.4 9.8 9.8 12.4 9 18 8.2 12.4 5.6 9.8 0 9 5.6 8.2 8.2 5.6 9 0Z" fill="#141414" />
                    </svg>
                    <span aria-hidden="true" className="font-display text-[clamp(4rem,7vw,6.5rem)] leading-none font-normal tracking-[-0.03em]">{i + 1}</span>
                    <h3 className={H3}>{s.title}</h3>
                    <p className="m-0 max-w-[34ch]">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* 02 Cztery drzwi */}
          <section id="cztery-drzwi" aria-labelledby="h-drzwi" className={`${WRAP} flex flex-wrap gap-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,9vw,8rem)]`}>
            <SectionNumber n="02" />
            <div className="min-w-0 flex-[1_1_40rem]">
              <h2 id="h-drzwi" className={`${H2} max-w-[16ch]`}>Cztery drzwi do polskich innowacji</h2>
              <ul className="mt-[72px] mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] gap-x-6 gap-y-[60px] p-0">
                {DOORS.map((d) => (
                  <li key={d.name}>
                    <a
                      href="#logowanie"
                      className={`${d.bg} relative box-border flex h-full min-h-[300px] flex-wrap gap-5 rounded-3xl px-6 pt-14 pb-6 text-atrament no-underline transition-transform duration-200 ease-[ease] hover:-translate-y-1 hover:text-atrament focus:-translate-y-1`}
                    >
                      <span aria-hidden="true" className="absolute -top-7 left-6 box-border grid size-14 place-items-center rounded-full border-4 border-papier bg-atrament">
                        <svg viewBox="0 0 16 16" width="24" height="24">
                          <g fill="none" stroke="#F7F2EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{d.icon}</g>
                        </svg>
                      </span>
                      <span className="flex min-w-0 flex-[1_1_14rem] flex-col gap-2.5">
                        <h3 className="m-0 font-display text-[1.5rem] leading-[1.2] font-bold tracking-normal">{d.name}</h3>
                        <span>{d.text}</span>
                        <span className="mt-auto flex items-center gap-3 pt-4 text-base font-bold">
                          <span aria-hidden="true" className="grid size-11 flex-none place-items-center rounded-full bg-atrament"><Arrow stroke="#F7F2EB" /></span>
                          Zaloguj się, aby przeglądać
                        </span>
                      </span>
                      <span aria-hidden="true" className="flex w-[140px] flex-[0_0_140px] flex-col items-center gap-2 self-center">
                        <Picture name={d.img} w={140} h={140} className="block size-[140px] object-contain" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 03 Konstelacja */}
          <section id="konstelacja" aria-labelledby="h-konst" tabIndex={-1} className="landing-dark bg-atrament text-papier outline-none">
            <div className={`${WRAP} flex flex-wrap items-center gap-[clamp(2rem,4vw,4rem)] py-[clamp(4rem,9vw,8rem)]`}>
              <div className="flex min-w-0 flex-[1_1_24rem] flex-col items-start gap-6 bg-atrament">
                <SectionNumber n="03" dark />
                <h2 id="h-konst" className="m-0 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] font-bold tracking-[-0.01em] text-papier [text-wrap:balance]">
                  Każdy węzeł to ktoś, kto coś <span className="text-iskra">tworzy</span>.
                </h2>
                <p className="m-0 max-w-[40ch] text-xl text-[#E4DDD2]">Pomysłownik! pokazuje połączenia między nauką, biznesem i administracją.</p>
                <PauseButton dark />
              </div>
              <div aria-hidden="true" className="relative min-w-0 flex-[1.5_1_30rem] overflow-hidden rounded-3xl bg-[radial-gradient(120%_90%_at_65%_40%,#1B3F8F_0%,#141414_72%)]">
                <Picture name="konstelacja" w={2000} h={1000} className="block h-[1000px] w-full object-cover object-[82%_50%]" />
                <Grain id="grain-k" />
              </div>
            </div>
          </section>

          {/* 04 Dla kogo */}
          <section id="dla-kogo" aria-labelledby="h-kto" className={`${WRAP} flex flex-wrap gap-[clamp(1.5rem,4vw,4rem)] py-[clamp(4rem,9vw,8rem)]`}>
            <SectionNumber n="04" />
            <div className="min-w-0 flex-[1_1_40rem]">
              <h2 id="h-kto" className={H2}>Dla kogo jest Pomysłownik!</h2>
              <ul className="mt-14 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] gap-5 p-0">
                {AUDIENCES.map((a) => (
                  <li key={a.name} className={`${CARD} gap-3.5`}>
                    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
                      <path d={a.d} fill="none" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h3 className={H3}>{a.name}</h3>
                    <p className="m-0">{a.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 05 Zasady */}
          <section id="zasady" aria-labelledby="h-zasady" className={`${WRAP} flex flex-wrap gap-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,9vw,8rem)]`}>
            <SectionNumber n="05" />
            <div className="min-w-0 flex-[1_1_40rem]">
              <h2 id="h-zasady" className={H2}>Rzetelnie i dostępnie</h2>
              <ul className="mt-14 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-5 p-0">
                <li className={`${CARD} gap-4`}>
                  <h3 className={H3}>Źródło przy każdej liczbie</h3>
                  <p className={`m-0 self-start rounded-xl bg-papier px-3.5 py-2.5 text-sm text-kamien ${MONO}`}>Źródło: GUS · 12.03.2026 [PRZYKŁAD]</p>
                </li>
                <li className={`${CARD} gap-4`}>
                  <h3 className={H3}>Potwierdzone czy szacunek</h3>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-atrament pr-[13px] pl-2.5 text-[0.9375rem] font-bold text-papier">
                      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="#F7F2EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Potwierdzone
                    </span>
                    <span className="box-border inline-flex min-h-8 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-atrament pr-[13px] pl-2.5 text-[0.9375rem] font-bold">
                      <span aria-hidden="true" className={MONO}>~</span>Szacunek
                    </span>
                  </div>
                  <p className="m-0">„Potwierdzone” to wartość wprost ze źródła, a „Szacunek” to wartość wyliczona z danych publicznych.</p>
                </li>
                <li className={`${CARD} gap-4`}>
                  <h3 className={H3}>Dostępność WCAG 2.2 AA</h3>
                  <p className="m-0">Klawiatura, kontrast, czytniki ekranu, tryb bez animacji.</p>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <section aria-labelledby="h-cta" className="landing-dark bg-atrament text-papier">
            <div className={`${WRAP} flex flex-wrap items-center justify-between gap-[clamp(2rem,4vw,4rem)] py-[clamp(4rem,8vw,7rem)]`}>
              <div className="flex min-w-0 flex-[1_1_28rem] flex-col items-start gap-9">
                <h2 id="h-cta" className="m-0 font-display text-[clamp(3rem,8vw,8rem)] leading-[1.1] font-bold tracking-[-0.01em] text-papier [text-wrap:balance]">Znajdź swoich ludzi.</h2>
                <div className="flex flex-wrap gap-3">
                  <a href="#logowanie" className="flex min-h-11 items-center rounded-full bg-iskra px-[22px] font-bold text-atrament no-underline hover:bg-[#F5CC1F] hover:text-atrament">Zaloguj się</a>
                  <Link href={REGISTER} className="box-border flex min-h-11 items-center rounded-full border-[1.5px] border-papier bg-atrament px-[22px] font-bold text-papier no-underline hover:bg-[#2A2826] hover:text-papier">Załóż konto</Link>
                </div>
              </div>
              <div aria-hidden="true" className="relative min-w-0 flex-[0_1_26rem]">
                <Picture name="cta-sygnet" w={1600} h={1600} className="block h-auto w-full" />
              </div>
            </div>
          </section>
        </main>

        <a
          href="#konstelacja"
          className="fixed right-[clamp(1rem,3vw,2rem)] bottom-[clamp(1rem,3vw,2rem)] z-30 flex min-h-11 items-center gap-2.5 rounded-full bg-atrament pr-5 pl-3.5 font-bold text-papier no-underline shadow-[0_0_0_2px_#F7F2EB] hover:bg-[#2A2826] hover:text-papier"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <g stroke="#F7F2EB" strokeWidth="1.2" strokeOpacity="0.7"><line x1="5" y1="17" x2="12" y2="8" /><line x1="12" y1="8" x2="19" y2="15" /><line x1="5" y1="17" x2="19" y2="15" /></g>
            <circle cx="5" cy="17" r="2.6" fill="#A9DCE6" /><circle cx="19" cy="15" r="2.6" fill="#CDB8F0" /><circle cx="12" cy="8" r="3.2" fill="#FFD93D" />
          </svg>
          Mapa idei
        </a>

        <footer className="landing-dark border-t border-[#3A3733] bg-atrament text-papier">
          <div className={`${WRAP} flex flex-wrap items-center justify-between gap-x-10 gap-y-6 pt-10 pb-[104px]`}>
            <div className="flex items-center gap-2">
              <Logo inverted size={22} title="Pomysłownik!" />
            </div>
            <nav aria-label="Stopka">
              <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-base">
                <li><a href="#regulamin" className="text-papier underline underline-offset-[0.2em] hover:text-iskra">Regulamin</a></li>
                <li><a href="#deklaracja-dostepnosci" className="text-papier underline underline-offset-[0.2em] hover:text-iskra">Deklaracja dostępności</a></li>
                <li><a href="#o-projekcie" className="text-papier underline underline-offset-[0.2em] hover:text-iskra">O projekcie</a></li>
              </ul>
            </nav>
            <p className="m-0 text-base text-[#E4DDD2]">Wersja demonstracyjna · 2026</p>
          </div>
        </footer>
      </div>
    </LandingShell>
  );
}
