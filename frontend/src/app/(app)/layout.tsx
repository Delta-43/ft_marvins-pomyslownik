import Link from "next/link";
import { cookies } from "next/headers";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/actions/auth";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/cookie";

// App chrome (glass header, colour field, footer) for every route except the landing page.
// The landing ("/") lives in the (landing) group and brings its own header and footer.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const signedIn = store.has(SESSION_COOKIE);
  const demo = signedIn && store.has(DEMO_COOKIE);
  return (
    <>
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      <header className="glass-bar sticky top-0 z-40 border-b">
        <nav aria-label="Główna" className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          <Link href="/" aria-label="Pomysłownik!, strona główna" className="flex items-center no-underline"><Logo /></Link>
          <ul className="ml-auto flex items-center gap-1 text-sm [&_a]:rounded-full [&_a]:px-3 [&_a]:py-1.5 [&_a]:no-underline [&_a]:text-atrament [&_a:not(.btn-primary):hover]:bg-atrament/5">
            {signedIn ? (
              <>
                {demo && <li className="mr-1 rounded-full bg-iskra px-2.5 py-0.5 text-xs font-bold text-atrament shadow-sm">Tryb demo</li>}
                <li><Link href="/szukaj">Szukaj</Link></li>
                <li><Link href="/wyniki">Wyniki</Link></li>
                <li><Link href="/profil">Profil</Link></li>
                <li>
                  <form action={signOut}>
                    <button type="submit" className="btn-primary cursor-pointer rounded-full px-4 py-1.5 font-bold">Wyloguj</button>
                  </form>
                </li>
              </>
            ) : (
              <li><Link href="/logowanie" className="btn-primary !text-white font-bold">Zaloguj się</Link></li>
            )}
            <li><a href="/design/Komponenty.dc.html">Komponenty</a></li>
            <li><a href="/design/Identyfikacja%20wizualna.dc.html">Identyfikacja</a></li>
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <footer className="glass-bar mt-12 border-t text-sm text-kamien">
        <div className="mx-auto max-w-6xl px-6 py-4">Pomysłownik! · Hacknation 2026 · podgląd projektu, dane przykładowe</div>
      </footer>
    </>
  );
}
