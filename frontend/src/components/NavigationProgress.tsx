"use client";

/** Loading state for in-app navigation (replaces loading.tsx).
 *
 *  loading.tsx made every first page load stream: the content sat in <div hidden> until a script swapped it in, so
 *  without JavaScript every signed-in page, and sign-in itself, stayed on the skeleton. Now first loads arrive as one
 *  complete HTML document, and this component shows the loading state only when JavaScript navigates:
 *  a click on an internal link immediately shows a progress bar and the skeleton of the destination over the page,
 *  marks <main> busy and announces "loading" once; it all clears when the URL changes. Unlike loading.tsx it also
 *  covers paging and filter chips (same page, new search params). */
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageSkeleton, ResultsSkeleton } from "./Skeletons";

// Pages rendered by the app (client-side navigation). Other links (design pages, external sites) are full loads.
const APP_PATHS = ["/szukaj", "/wyniki", "/karta", "/porownaj", "/profil", "/logowanie"];
const GIVE_UP_MS = 15000; // a navigation that never finishes (network error) must not leave the page covered

export function NavigationProgress() {
  const t = useTranslations("status");
  const pathname = usePathname();
  const search = useSearchParams();
  const [target, setTarget] = useState<string | null>(null);

  // The URL changed: the new page is in place.
  useEffect(() => setTarget(null), [pathname, search]);

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
      if (!APP_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return;
      setTarget(url.pathname);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const main = document.getElementById("main");
    if (!target) {
      main?.removeAttribute("aria-busy");
      return;
    }
    main?.setAttribute("aria-busy", "true");
    const giveUp = setTimeout(() => setTarget(null), GIVE_UP_MS);
    return () => clearTimeout(giveUp);
  }, [target]);

  return (
    <>
      {/* Always rendered, so screen readers already know the live region when the text appears. */}
      <p role="status" aria-live="polite" className="sr-only">{target ? t("loadingResults") : ""}</p>
      {target && (
        <>
          <div aria-hidden="true" className="nav-progress fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-granat/15">
            <span className="block h-full w-1/3 rounded-full bg-granat" />
          </div>
          <div aria-hidden="true" className="nav-overlay absolute inset-0 z-20 overflow-hidden">
            {target === "/wyniki" ? <ResultsSkeleton /> : <PageSkeleton />}
            <p className="text-center text-sm text-kamien">{t("loadingLabel")}</p>
          </div>
        </>
      )}
    </>
  );
}
