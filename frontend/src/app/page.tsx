import Link from "next/link";

// Landing page ("/"). PLACEHOLDER: Alban is designing the creative for this page.
// Replace the visuals freely, but keep the message (search needs an account) and the link to /logowanie.
export default function LandingPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1>Polskie innowacje w jednym miejscu</h1>
      <p className="max-w-xl text-lg text-kamien">
        Uczelnie, patenty, laboratoria i startupy z całej Polski. Ze źródłami i uczciwą oceną.
      </p>
      <p className="max-w-xl">
        Aby wyszukiwać innowacje, musisz się zalogować. Chroni to własność intelektualną twórców.
      </p>
      <Link
        href="/logowanie"
        className="inline-flex h-12 items-center rounded-full bg-granat px-8 font-bold text-white no-underline hover:bg-atrament"
      >
        Zaloguj się, aby szukać
      </Link>
      <p className="font-mono text-xs text-kamien">[Miejsce na grafikę strony startowej: Alban]</p>
    </section>
  );
}
