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
  setVar("--card-full", `inset(0 0 calc(100% - ${Math.round(visible)}px) 0 round 20px 20px 0 0)`);
  const r = tile?.getBoundingClientRect();
  if (!r) { setVar("--card-rect", "inset(0 0 calc(100% - 120px) 0 round 20px)"); return; }
  const t = Math.max(0, r.top - top), l = Math.max(0, r.left - col.left), right = Math.max(0, col.right - r.right);
  setVar("--card-rect", `inset(${Math.round(t)}px ${Math.round(right)}px calc(100% - ${Math.round(t + r.height)}px) ${Math.round(l)}px round 20px)`);
}

function measureClose(id?: string) {
  const d = document.querySelector(".detail")?.getBoundingClientRect();
  if (!d) return;
  setVar("--card-full", `inset(${Math.round(Math.max(0, -d.top))}px 0 calc(100% - ${Math.round(Math.min(d.height, innerHeight - d.top))}px) 0 round 20px)`);
  // The tile will be back where it was on screen; express that place inside the panel as it sits now.
  const r = origin && origin.id === id && origin.list === listKey() ? origin.rect : null;
  if (!r) setVar("--card-rect", "inset(0 0 calc(100% - 120px) 0 round 20px)");
  if (r) { const t = r.top - d.top; setVar("--card-rect", `inset(${Math.round(t)}px ${Math.round(Math.max(0, d.right - r.right))}px calc(100% - ${Math.round(t + r.height)}px) ${Math.round(Math.max(0, r.left - d.left))}px round 20px)`); }
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
      measure(tile);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Before paint (and before the browser captures the new state): put the panel's top in view when the list was
  // scrolled, and return to the old scroll position when the card closes.
  useLayoutEffect(() => {
    if (first.current) return;
    if (karta) {
      const d = document.querySelector(".detail")?.getBoundingClientRect();
      if (d && d.top < GUTTER && !location.hash) window.scrollBy({ top: d.top - GUTTER, behavior: "instant" });
    } else if (prevKarta.current && origin?.id === prevKarta.current && origin.list === listKey()) {
      window.scrollTo({ top: origin.scrollY, behavior: "instant" });
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
      if (target) { target.scrollIntoView(); target.focus({ preventScroll: true }); if (document.activeElement !== target) document.getElementById("dTitle")?.focus({ preventScroll: true }); }
      else document.getElementById("dTitle")?.focus({ preventScroll: true });
    } else if (!karta && was) {
      const link = document.querySelector<HTMLElement>(`#karta-${CSS.escape(was)} .card-open`);
      link?.focus({ preventScroll: true });
      if (origin?.id !== was) link?.scrollIntoView({ block: "center" });
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

  // Closing: the panel shrinks to where its tile was (the list returns to the old scroll position).
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (e.target instanceof Element && e.target.closest(".detail-bar a.btn-secondary")) measureClose(kartaRef.current); };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Esc: sheet first, then the open card. Not while a menu or a select is handling the key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("details.menu[open]")) return;
      if (sheet) router.replace(closeSheetHref, { scroll: false });
      else if (karta) { measureClose(karta); router.push(backHref, { scroll: false, transitionTypes: ["card-close"] }); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, karta, backHref, closeSheetHref, router]);

  return null;
}
