"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** The nav menus are native <details>. This closes an open one on Esc (focus back to its button), on a click or
 *  focus move outside it, and after a navigation. */
export function MenuCloser() {
  const where = usePathname() + "?" + useSearchParams().toString();
  useEffect(() => {
    const open = () => [...document.querySelectorAll<HTMLDetailsElement>("details.menu[open]")];
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const menus = open();
      if (!menus.length) return;
      e.preventDefault();
      menus.forEach((d) => { d.open = false; });
      menus[0].querySelector("summary")?.focus();
    };
    const closeOutside = (target: EventTarget | null) => open().forEach((d) => { if (!(target instanceof Node) || !d.contains(target)) d.open = false; });
    const onPointer = (e: PointerEvent) => closeOutside(e.target);
    const onFocusOut = (e: FocusEvent) => { if (e.relatedTarget) closeOutside(e.relatedTarget); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusout", onFocusOut);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); document.removeEventListener("focusout", onFocusOut); };
  }, []);
  useEffect(() => { document.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((d) => { d.open = false; }); }, [where]);
  return null;
}
