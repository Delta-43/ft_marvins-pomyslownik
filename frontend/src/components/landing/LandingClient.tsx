"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";

// Client behaviour of the landing page, ported from the brand prototype (landing/Landing.dc.html):
// shared pause state for the animations, prefers-reduced-motion, the mobile menu,
// and "#logowanie" links that scroll to the sign-in panel and focus its main button.

type Motion = { paused: boolean; reduced: boolean; toggle: () => void };
const MotionContext = createContext<Motion>({ paused: false, reduced: false, toggle: () => {} });
export const useMotion = () => useContext(MotionContext);

const HEADER_OFFSET = 96;

export function focusSignIn(reduced: boolean) {
  const sec = document.getElementById("logowanie");
  if (!sec) return;
  const y = sec.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
  (document.getElementById("sandbox-btn") ?? sec).focus({ preventScroll: true });
}

export function LandingShell({ children }: { children: React.ReactNode }) {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Any link to #logowanie scrolls to the sign-in panel and focuses its button.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href="#logowanie"]');
      if (!a) return;
      e.preventDefault();
      focusSignIn(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };
    document.addEventListener("click", onClick);
    if (location.hash === "#logowanie") setTimeout(() => focusSignIn(true), 400);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const toggle = useCallback(() => setPaused((p) => !p), []);
  return <MotionContext.Provider value={{ paused, reduced, toggle }}>{children}</MotionContext.Provider>;
}

/** "Zatrzymaj animację" control. Hidden when the user prefers reduced motion (nothing moves then). */
export function PauseButton({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const { paused, reduced, toggle } = useMotion();
  if (reduced) return null;
  const look = dark
    ? "border-papier bg-atrament text-papier hover:bg-[#2A2826]"
    : "border-atrament bg-white text-atrament hover:bg-papier";
  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] pr-[18px] pl-3.5 text-base font-bold ${look} ${className}`}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d={paused ? "M5 3v10l8.5-5Z" : "M4 3h3v10H4Z M9 3h3v10H9Z"} fill="currentColor" />
      </svg>
      {paused ? "Wznów animację" : "Zatrzymaj animację"}
    </button>
  );
}

const NAV = [
  { href: "#jak-to-dziala", label: "Jak to działa" },
  { href: "#dla-kogo", label: "Dla kogo" },
  { href: "#zasady", label: "Zasady" },
];

export function LandingHeader({ registerHref }: { registerHref: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btn.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // DESIGN.md 6: one primary button per view. The sign-in panel holds the primary action,
  // so the header uses a secondary button and a text link button.
  const secondary = "box-border flex min-h-11 items-center rounded-full border-[1.5px] border-atrament bg-white px-[22px] font-bold text-atrament no-underline hover:bg-papier hover:text-atrament";
  const textLink = "flex min-h-11 items-center px-2 font-bold text-granat underline underline-offset-4 hover:text-atrament";

  return (
    // DESIGN.md 6 top bar: min height 64, white, 1px Krawędź border, radius 16, wordmark 22px.
    <header className="sticky top-0 z-40 bg-papier px-[clamp(1rem,4vw,3rem)] py-2">
      <div className="mx-auto box-border flex min-h-16 max-w-[90rem] items-center gap-6 rounded-2xl border border-krawedz bg-white px-[clamp(1rem,2vw,1.5rem)] py-2.5">
        <Link href="/" aria-label="Pomysłownik!, strona główna" className="flex flex-none items-center gap-2 rounded-lg text-atrament no-underline">
          <Logo size={22} />
        </Link>
        <nav aria-label="Główna" className="ml-auto hidden gap-1 min-[1080px]:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="flex min-h-11 items-center px-3.5 font-medium text-atrament no-underline decoration-krawedz decoration-[3px] underline-offset-[6px] hover:text-atrament hover:underline"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden flex-none items-center gap-2.5 min-[1080px]:flex">
          <Link href={registerHref} className={textLink}>Załóż konto</Link>
          <a href="#logowanie" className={secondary}>Zaloguj się</a>
        </div>
        <button
          ref={btn}
          type="button"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-atrament bg-white pr-[18px] pl-3.5 font-bold text-atrament min-[1080px]:hidden"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Menu
        </button>
      </div>
      {open && (
        <div id="menu-mobile" className="mx-auto mt-2 flex max-w-[90rem] flex-col gap-3 rounded-2xl border border-krawedz bg-white px-[clamp(1rem,2vw,1.5rem)] pt-2 pb-5 min-[1080px]:hidden">
          <nav aria-label="Główna (menu)" className="flex flex-col">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-krawedz font-bold text-atrament no-underline">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2.5">
            <a href="#logowanie" onClick={() => setOpen(false)} className={secondary}>Zaloguj się</a>
            <Link href={registerHref} className={textLink}>Załóż konto</Link>
          </div>
        </div>
      )}
    </header>
  );
}
