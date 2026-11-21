"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Client behaviour of the landing page, ported from the brand prototype (landing/Landing.dc.html):
// shared pause state for the animations, prefers-reduced-motion,
// and "#logowanie" links that scroll to the sign-in panel and focus its main button.

type Motion = { paused: boolean; reduced: boolean; toggle: () => void };
const MotionContext = createContext<Motion>({ paused: false, reduced: false, toggle: () => {} });
export const useMotion = () => useContext(MotionContext);

// No sticky header on the landing page: keep a small gap above the panel.
const HEADER_OFFSET = 24;

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
export function PauseButton({
  dark = false,
  className = "",
  pauseLabel = "Zatrzymaj animację",
  resumeLabel = "Wznów animację",
}: { dark?: boolean; className?: string; pauseLabel?: string; resumeLabel?: string }) {
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
      {paused ? resumeLabel : pauseLabel}
    </button>
  );
}
