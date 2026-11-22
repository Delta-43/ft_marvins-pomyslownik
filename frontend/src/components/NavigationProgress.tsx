"use client";

/** Loading state for in-app navigation: a progress bar at the top and a polite "loading" announcement while the next
 *  page is on its way. The current page stays fully visible underneath, so when the new page arrives the view
 *  transition (globals.css "Motion") plays from the real screen, not from a placeholder. First page loads never show
 *  it: they arrive as one complete HTML document, so every page also works without JavaScript. */
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

// Pages rendered by the app (client-side navigation). Other links (design pages, external sites) are full loads.
const APP_PATHS = ["/", "/szukaj", "/wyniki", "/karta", "/porownaj", "/profil", "/logowanie"];
const GIVE_UP_MS = 15000; // a navigation that never finishes (network error) must not leave the bar running

export function NavigationProgress() {
  const t = useTranslations("status");
  const pathname = usePathname();
  const search = useSearchParams();
  const here = `${pathname}?${search}`;
  // The URL the click happened on. Derived in render (not in an effect), so the bar is gone in the very commit that
  // brings the new page, and never ends up in the new page's snapshot.
  const [from, setFrom] = useState<string | null>(null);
  const loading = from !== null && from === here;

  // Start on a click that Next.js will turn into a client-side navigation. Capture phase, because <Link> calls
  // preventDefault on the click to take over the navigation.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab or window
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page or #anchor
      if (!APP_PATHS.some((p) => url.pathname === p || (p !== "/" && url.pathname.startsWith(`${p}/`)))) return;
      setFrom(`${location.pathname}?${location.search.replace(/^\?/, "")}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const main = document.getElementById("main");
    if (!loading) {
      main?.removeAttribute("aria-busy");
      return;
    }
    main?.setAttribute("aria-busy", "true");
    const giveUp = setTimeout(() => setFrom(null), GIVE_UP_MS);
    return () => clearTimeout(giveUp);
  }, [loading]);

  return (
    <>
      {/* Always rendered, so screen readers already know the live region when the text appears. */}
      <p role="status" aria-live="polite" className="sr-only">{loading ? t("loadingResults") : ""}</p>
      {loading && (
        <div aria-hidden="true" className="nav-progress fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-granat/15">
          <span className="block h-full w-1/3 rounded-full bg-granat" />
        </div>
      )}
    </>
  );
}
