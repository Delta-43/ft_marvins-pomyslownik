import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { MobileMenu } from "@/components/MobileMenu";
import { NavigationProgress } from "@/components/NavigationProgress";
import { CompareTray } from "@/components/compare/CompareTray";
import { T, TransitionTrigger, vt } from "@/components/motion/Motion";
import { signOut } from "@/app/actions/auth";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/cookie";

// App chrome (glass header, colour field, footer) for every route except the landing page.
// The landing ("/") lives in the (landing) group and brings its own header and footer.
// Texts come from messages/*.json; the PL/EN switch sits in the footer.
// Motion: the header and footer are anchored (they never slide with page content) and fade in after the opening
// move; the logo is the shared object that flies here from the landing hero, and takes the reader back.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const signedIn = store.has(SESSION_COOKIE);
  const demo = signedIn && store.has(DEMO_COOKIE);
  const [t, tc] = await Promise.all([getTranslations("layout"), getTranslations("comparePage")]);

  /** Nav links, shared by the desktop row and the phone menu. */
  const items = (variant: "row" | "menu") => {
    const button = variant === "row" ? "btn-primary cursor-pointer rounded-full px-4 py-1.5 font-bold" : "btn-primary mt-1 min-h-11 w-full cursor-pointer rounded-2xl px-4 font-bold";
    return (
      <>
        {signedIn ? (
          <>
            <li><Link href="/szukaj" transitionTypes={[T.toSearch]}>{t("search")}</Link></li>
            <li><Link href="/wyniki" transitionTypes={[T.search]}>{t("results")}</Link></li>
            {/* F4: "Compare (n)" once a card is chosen; shown in the desktop row and the phone menu. */}
            <CompareTray label={tc("trayLabel")} countLabel={tc("trayCount", { count: "{count}" })} />
            <li><Link href="/profil">{t("profile")}</Link></li>
            <li>
              <form action={signOut}>
                <button type="submit" className={button}>{t("signOut")}</button>
              </form>
            </li>
          </>
        ) : (
          <li><Link href="/logowanie" className={`btn-primary !text-white font-bold ${variant === "menu" ? "justify-center" : ""}`}>{t("signIn")}</Link></li>
        )}
        {variant === "menu" && <li aria-hidden="true" className="my-1 border-t border-atrament/10" />}
        <li><a href="/design/Komponenty.dc.html">{t("components")}</a></li>
        <li><a href="/design/Identyfikacja%20wizualna.dc.html">{t("identity")}</a></li>
      </>
    );
  };

  return (
    <>
      {/* The app's canvas: Papier and the colour field. Named, so on the opening it is the window that sweeps
          open over the landing hero, and on closing the window that slides shut. */}
      <div style={vt("app-canvas")} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[#F4EEE6]">
        <div className="aurora"><span /><span /><span /></div>
      </div>
      <TransitionTrigger />
      <header style={vt("app-header")} className="glass-bar sticky top-0 z-40 border-b">
        <nav aria-label={t("navLabel")} className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6 lg:gap-6 lg:py-3">
          {/* The logo closes the app window and goes back to the landing (the opening move in reverse). */}
          <Link href="/" aria-label={t("homeLabel")} transitionTypes={[T.closing]} className="flex min-w-0 shrink items-center rounded-lg no-underline transition-transform duration-150 active:scale-[0.97]">
            <span style={vt("brand-logo")} className="block"><Logo /></span>
          </Link>
          {demo && <span className="shrink-0 rounded-full bg-iskra px-2.5 py-0.5 text-xs font-bold text-atrament shadow-sm">{t("demoBadge")}</span>}
          {/* Desktop (1024px and up): links in a row. */}
          <ul className="ml-auto hidden items-center gap-1 text-sm lg:flex [&_a]:rounded-full [&_a]:px-3 [&_a]:py-1.5 [&_a]:no-underline [&_a]:text-atrament [&_a:not(.btn-primary):hover]:bg-atrament/5">
            {items("row")}
          </ul>
          {/* Phones and tablets: the same links behind a Menu button (works without JavaScript). */}
          <div className="ml-auto lg:hidden">
            <MobileMenu label={t("menu")}>
              <ul className="flex flex-col gap-1 text-base [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:rounded-2xl [&_a]:px-4 [&_a]:no-underline [&_a]:text-atrament [&_a:not(.btn-primary):hover]:bg-atrament/5">
                {items("menu")}
              </ul>
            </MobileMenu>
          </div>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="relative flex-1">
        {children}
        {/* Loading state for in-app navigation. Suspense only because it reads the search params; it never holds
            back the page, which always arrives complete on a first load (works without JavaScript). */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
      </main>
      <footer style={vt("app-footer")} className="glass-bar mt-12 border-t text-sm text-kamien">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span>{t("footer")}</span>
          <LanguageSwitch />
        </div>
      </footer>
    </>
  );
}
