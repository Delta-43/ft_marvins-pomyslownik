"use client";

/** The compare selection (F4): up to four cards the user wants to compare, kept for this browser tab.
 *
 *  One store for every place that adds or shows cards: the "Compare" ticks on /wyniki (F2), the "Add to comparison"
 *  button on a card page, the header tray and the comparison page. Stored in sessionStorage under one key, so it
 *  survives paging, new searches and moving between pages. Only card ids and titles are kept, never tokens or
 *  personal data. If storage is blocked, the selection lives in memory for the current page view. */
import { useSyncExternalStore } from "react";
import { COMPARE_MAX } from "@/lib/compare-limits";

export { COMPARE_MAX, COMPARE_MIN } from "@/lib/compare-limits";
export const COMPARE_KEY = "pomyslownik:compare";
/** Fired on window after every change, so separate components (and older code reading the same key) can refresh. */
export const COMPARE_EVENT = "pomyslownik:compare-change";

export type CompareItem = { id: string; title: string };

const EMPTY: CompareItem[] = [];
let cache: CompareItem[] | null = null;
const listeners = new Set<() => void>();

function load(): CompareItem[] {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(COMPARE_KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw.filter((x): x is CompareItem => typeof x?.id === "string" && typeof x?.title === "string").slice(0, COMPARE_MAX)
      : [];
  } catch {
    return []; // storage blocked or corrupt: start empty, the page still works
  }
}

export function readSelection(): CompareItem[] {
  if (!cache) cache = load();
  return cache;
}

export function writeSelection(next: CompareItem[]) {
  // Keep order, drop duplicates, cap at the maximum.
  const seen = new Set<string>();
  cache = next.filter((i) => !seen.has(i.id) && seen.add(i.id)).slice(0, COMPARE_MAX);
  try {
    sessionStorage.setItem(COMPARE_KEY, JSON.stringify(cache));
  } catch {
    /* storage blocked: keep the selection in memory for this page view */
  }
  listeners.forEach((l) => l());
  window.dispatchEvent(new Event(COMPARE_EVENT));
}

export function addToSelection(item: CompareItem): boolean {
  const s = readSelection();
  if (s.some((x) => x.id === item.id)) return true;
  if (s.length >= COMPARE_MAX) return false;
  writeSelection([...s, item]);
  return true;
}

export function removeFromSelection(id: string) {
  writeSelection(readSelection().filter((x) => x.id !== id));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another component (or older code using the same key) changed the selection: reload from storage.
  const onExternal = () => {
    cache = load();
    listener();
  };
  window.addEventListener(COMPARE_EVENT, onExternal);
  return () => {
    listeners.delete(listener);
    window.removeEventListener(COMPARE_EVENT, onExternal);
  };
}

/** The current selection. Empty during server render and hydration, so server and client HTML match. */
export function useCompareSelection(): CompareItem[] {
  return useSyncExternalStore(subscribe, readSelection, () => EMPTY);
}

/** False during server render and hydration, true once JavaScript runs. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/** Address of the comparison page for these cards. */
export function compareHref(items: { id: string }[]): string {
  return items.length ? `/porownaj?ids=${items.map((i) => i.id).join(",")}` : "/porownaj";
}
