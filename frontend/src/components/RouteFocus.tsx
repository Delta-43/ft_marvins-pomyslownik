"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** After a navigation between pages, focus moves to the page heading when it would otherwise be lost (the link that
 *  was used is gone, or was inside a menu that closed). Not on the first load, and never away from a control that
 *  still has focus, such as the search box. */
export function RouteFocus() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const id = window.setTimeout(() => {
      const el = document.activeElement as HTMLElement | null;
      const lost = !el || el === document.body || !el.isConnected || el.getClientRects().length === 0;
      if (lost) document.querySelector<HTMLElement>("main h1[tabindex], main #rTitle, main #dTitle")?.focus({ preventScroll: true });
    }, 50);
    return () => window.clearTimeout(id);
  }, [path]);
  return null;
}
