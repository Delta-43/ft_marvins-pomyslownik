"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Keyboard and screen-reader behaviour of the results screen, on top of the server-rendered page:
 *  - opening a card moves focus to its title; closing it returns focus to the card in the list;
 *  - after a filter is removed or the page changes, focus goes to the results heading if it was lost;
 *  - Esc closes the open card, or the phone filter sheet;
 *  - the phone filter sheet behaves as a dialog (named, the page behind is inert, focus moves in and back);
 *  - the result count is announced after the list changes. */
/** Where the open card came from: the tile's id and the scroll position, so closing returns to the same place. */
/** Until when the card grow is playing. A close during it fades instead (a view transition cannot reverse mid-way). */
let growEnd = 0;
/** Cleanup for a tile that is waiting for its card (scroll listener, pressed state). */
let pending: (() => void) | null = null;
const growing = () => performance.now() < growEnd;
let origin: { id: string; scrollY: number; rect: DOMRect; list: string } | null = null;
/** The list a URL shows: its query without the open card and the sheet. */
const listKey = () => { const u = new URLSearchParams(location.search); u.delete("karta"); u.delete("filtry"); return u.toString(); };
const GUTTER = 12;
const setVar = (name: string, value: string) => document.documentElement.style.setProperty(name, value);

/** The window the card grows from (or shrinks to): the tile's rectangle inside the results column, and the part of
 *  the column that is on screen. Set before the navigation, so the view transition's keyframes can use them. */
function measure(tile: Element | null) {
  const col = document.querySelector(".results-col")?.getBoundingClientRect();
  if (!col) return;
  const top = Math.max(col.top, GUTTER);            // where the panel's top edge will be (the page scrolls it into view)
  const visible = Math.max(120, innerHeight - top);
  setVar("--card-full", `inset(0 0 calc(100% - ${Math.round(visible)}px) 0 round var(--radius-card) var(--radius-card) 0 0)`);
  const r = tile?.getBoundingClientRect();
  if (!r) { setVar("--card-dy", "0px"); setVar("--card-rect", "inset(0 0 calc(100% - 120px) 0 round var(--radius-card))"); return; }
  const t = Math.max(0, r.top - top), l = Math.max(0, r.left - col.left), right = Math.max(0, col.right - r.right);
  // The panel's own header starts where the tile is and rises into place, so the tile's tag and title become the card's.
  setVar("--card-dy", `${Math.round(t)}px`);
  setVar("--card-rect", `inset(0 ${Math.round(right)}px calc(100% - ${Math.round(r.height)}px) ${Math.round(l)}px round var(--radius-card))`);
}

/** Open the folded part (<details>) that holds or is this element, so a jump link or a source number never lands on
 *  something hidden. */
function unfold(el: Element | null) {
  if (!el) return;
  el.closest("details")?.setAttribute("open", "");
  el.querySelector("details.d-fold")?.setAttribute("open", "");
}

function measureClose(id?: string) {
  const d = document.querySelector(".detail")?.getBoundingClientRect();
  if (!d) return;
  const cut = d.bottom > innerHeight ? "var(--radius-card) var(--radius-card) 0 0" : "var(--radius-card)";
  const full = `inset(${Math.round(Math.max(0, -d.top))}px 0 calc(100% - ${Math.round(Math.min(d.height, innerHeight - d.top))}px) 0 round ${cut})`;
  setVar("--card-full", full);
  // The tile will be back where it was on screen; express that place inside the panel as it sits now.
  const r = origin && origin.id === id && origin.list === listKey() ? origin.rect : null;
  const s = Math.max(0, -d.top);
  if (!r) { setVar("--card-dy", "0px"); setVar("--card-rect", full); }
  else {
    setVar("--card-dy", `${Math.round(r.top - d.top - s)}px`);
    setVar("--card-rect", `inset(${Math.round(s)}px ${Math.round(Math.max(0, d.right - r.right))}px calc(100% - ${Math.round(s + r.height)}px) ${Math.round(Math.max(0, r.left - d.left))}px round var(--radius-card))`);
  }
}

export function ResultsClient({ karta, sheet, backHref, closeSheetHref, status }: { karta?: string; sheet: boolean; backHref: string; closeSheetHref: string; status: string }) {
  const router = useRouter();
  const sp = useSearchParams().toString();
  const prevKarta = useRef(karta);
  const prevSheet = useRef(sheet);
  const first = useRef(true);
  const kartaRef = useRef(karta);
  kartaRef.current = karta;

  // Opening: remember the tile and measure it before the page changes.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a.card-open") : null;
      const tile = link?.closest("li.card");
      if (!tile || e.metaKey || e.ctrlKey || e.shiftKey) return;
      origin = { id: tile.id.replace("karta-", ""), scrollY: window.scrollY, rect: tile.getBoundingClientRect(), list: listKey() };
      tile.setAttribute("data-opening", "");
      measure(tile);
      const again = () => { measure(tile); if (origin) { origin.scrollY = scrollY; origin.rect = tile.getBoundingClientRect(); } };
      addEventListener("scroll", again, { passive: true });
      pending?.();
      pending = () => { removeEventListener("scroll", again); tile.removeAttribute("data-opening"); };
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Before paint (and before the browser captures the new state): put the panel's top in view when the list was
  // scrolled, and return to the old scroll position when the card closes.
  useLayoutEffect(() => {
    if (first.current) return;
    pending?.(); pending = null;
    if (karta) {
      if (karta !== prevKarta.current) growEnd = performance.now() + 400;
      const tg = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (tg) { unfold(tg); tg.scrollIntoView({ behavior: "instant" }); }
      else {
        const d = document.querySelector(".detail")?.getBoundingClientRect();
        if (d && d.top < GUTTER) window.scrollBy({ top: d.top - GUTTER, behavior: "instant" });
      }
    } else if (prevKarta.current && origin?.id === prevKarta.current && origin.list === listKey()) {
      window.scrollTo({ top: origin.scrollY, behavior: "instant" });
    } else if (prevKarta.current) {
      document.getElementById(`karta-${CSS.escape(prevKarta.current)}`)?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [karta]);

  // Focus after a view change.
  useEffect(() => {
    if (first.current) return;
    const was = prevKarta.current;
    prevKarta.current = karta;
    if (karta && karta !== was) {
      const hash = location.hash.slice(1);
      const target = hash ? document.getElementById(hash) : null;
      if (target) { (target.querySelector<HTMLElement>("details.d-fold > summary") ?? target).focus({ preventScroll: true }); if (document.activeElement !== target) document.getElementById("dTitle")?.focus({ preventScroll: true }); }
      else document.getElementById("dTitle")?.focus({ preventScroll: true });
    } else if (!karta && was) {
      const link = document.querySelector<HTMLElement>(`#karta-${CSS.escape(was)} .card-open`);
      link?.focus({ preventScroll: true });
    } else if (document.activeElement === document.body || !document.activeElement) {
      document.getElementById("rTitle")?.focus({ preventScroll: true });
    }
  }, [sp, karta]);

  // Announce the count when the list changed (not on first load, not while a card is open).
  useEffect(() => {
    const live = document.getElementById("rStatus");
    if (!live) return;
    if (karta) { live.textContent = ""; return; }
    if (first.current) return;
    live.textContent = "";
    const id = window.setTimeout(() => { live.textContent = status; }, 120);
    return () => window.clearTimeout(id);
  }, [sp, karta, status]);

  // Phone filter sheet as a dialog.
  useEffect(() => {
    const form = document.getElementById("filtry");
    const phone = window.matchMedia("(max-width: 820px)").matches;
    const behind = [document.querySelector(".skip-link"), document.querySelector("header.nav"), document.querySelector(".search-form"), document.querySelector(".results-col")];
    if (sheet && phone && form) {
      form.setAttribute("role", "dialog");
      form.setAttribute("aria-modal", "true");
      behind.forEach((el) => el?.setAttribute("inert", ""));
      if (!prevSheet.current || first.current) document.getElementById("fTitle")?.focus({ preventScroll: true });
    } else {
      form?.removeAttribute("role");
      form?.removeAttribute("aria-modal");
      behind.forEach((el) => el?.removeAttribute("inert"));
      if (prevSheet.current && !sheet) document.querySelector<HTMLElement>(".filters-btn")?.focus({ preventScroll: true });
    }
    prevSheet.current = sheet;
    return () => behind.forEach((el) => el?.removeAttribute("inert"));
  }, [sheet, sp]);

  useEffect(() => { first.current = false; }, []);

  // Arriving with a hash (a shared link, "Źródła: n" from a tile without JavaScript navigation): open that part.
  useEffect(() => {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (target) { unfold(target); target.scrollIntoView(); }
  }, []);

  // Back and Forward between #src-n and other in-card hashes: open the part the hash points to.
  useEffect(() => {
    const onHash = () => { const el = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; unfold(el); };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  // Jump links, source numbers [n] and history rows inside the card open the folded part they point to.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('.detail a[href^="#"]') : null;
      if (a) unfold(document.getElementById(decodeURIComponent(a.hash.slice(1))));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Closing: the panel shrinks to where its tile was (the list returns to the old scroll position).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      // During the grow the panel is not clickable yet: ignore clicks on it rather than act on an unseen page.
      if (growing() && e.target.closest(".detail")) { e.preventDefault(); e.stopPropagation(); return; }
      if (e.target.closest(".detail-bar a.btn-secondary")) measureClose(kartaRef.current);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Phone filter sheet: open and close at the tap; the URL follows. CSS transitions retarget if the server disagrees.
  useEffect(() => {
    const area = () => document.querySelector(".results-area");
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el || !matchMedia("(max-width: 820px)").matches) return;
      if (el.closest("a.filters-btn")) area()?.setAttribute("data-sheet", "open");
      else if (el.closest(".sheet-backdrop, .fhead a.close, .filters .apply-phone")) area()?.removeAttribute("data-sheet");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Esc: sheet first, then the open card. Not while a menu or a select is handling the key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("details.menu[open]")) return;
      if (sheet) { document.querySelector(".results-area")?.removeAttribute("data-sheet"); router.replace(closeSheetHref, { scroll: false }); }
      else if (karta) {
        if (growing()) { router.push(backHref, { scroll: false }); return; }
        measureClose(karta); router.push(backHref, { scroll: false, transitionTypes: ["card-close"] });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, karta, backHref, closeSheetHref, router]);

  return null;
}
