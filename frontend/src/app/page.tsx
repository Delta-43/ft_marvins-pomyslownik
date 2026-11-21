import Link from "next/link";

// Landing page ("/"). PLACEHOLDER: Alban is designing the creative for this page.
// Replace the visuals freely, but keep the message (search needs an account) and the link to /logowanie.
export default function LandingPage() {
  return (
    <section className="mx-auto flex min-h-[75vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="glass flex w-full flex-col items-center gap-7 rounded-[2.5rem] px-8 py-16 sm:px-16">
      <span className="glass rounded-full px-4 py-1 text-sm font-bold text-granat">Hacknation 2026 · Pomysłownik!</span>
      <h1 className="text-5xl sm:text-6xl">Polskie innowacje <span className="bg-gradient-to-r from-granat to-[#6B4FC8] bg-clip-text text-transparent">w jednym miejscu</span></h1>
      <p className="max-w-xl text-lg text-kamien">
        Uczelnie, patenty, laboratoria i startupy z całej Polski. Ze źródłami i uczciwą oceną.
      </p>
      <p className="max-w-xl">
        Aby wyszukiwać innowacje, musisz się zalogować. Chroni to własność intelektualną twórców.
      </p>
      <Link
        href="/logowanie"
        className="btn-liquid inline-flex h-14 items-center rounded-full px-10 text-lg font-bold no-underline"
      >
        Zaloguj się, aby szukać
      </Link>
      <p className="font-serif text-sm italic font-light text-kamien">[Miejsce na grafikę strony startowej: Alban]</p>
      </div>
    </section>
  );
}
