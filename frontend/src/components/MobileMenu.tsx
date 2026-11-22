"use client";

/** Header menu for phones and tablets (below 1024px). A native <details>, so it opens and closes without JavaScript.
 *  With JavaScript it also closes on navigation (the layout stays mounted across client-side page changes), on Escape
 *  (focus returns to the button) and on a click or tap outside. */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function MobileMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // Close after every navigation (also when a link inside the menu is clicked, see onClick below).
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !el.open) return;
      el.open = false;
      el.querySelector("summary")?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (el.open && !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return (
    <details ref={ref} className="mobile-menu relative lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-atrament hover:bg-atrament/5 [&::-webkit-details-marker]:hidden">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="menu-icon-open">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="menu-icon-close">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        {label}
      </summary>
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a") && ref.current) ref.current.open = false;
        }}
        className="glass-strong absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-[var(--radius-card)] p-2 shadow-xl">
        {children}
      </div>
    </details>
  );
}
