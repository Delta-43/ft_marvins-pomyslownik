"use client";

/** Compare selection on the results page (F2). Pick 2 to 4 cards, then open /porownaj?ids=a,b (F4).
 *
 *  Without JavaScript: every toggle is a plain checkbox tied to the compare form (`form="compare-form"`), so ticking
 *  cards on one page and pressing the button submits `ids=a&ids=b`.
 *  With JavaScript: the selection is kept in sessionStorage (this tab only), survives paging and new searches, and is
 *  capped at four with a written note. Only card ids and titles are stored, never tokens or personal data. */
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export const COMPARE_MAX = 4;
const COMPARE_MIN = 2;
const KEY = "pomyslownik:compare";
const FORM_ID = "compare-form";
const FULL_NOTE_ID = "compare-full-note";

type Item = { id: string; title: string };
const EMPTY: Item[] = [];
let cache: Item[] | null = null;
const listeners = new Set<() => void>();

function read(): Item[] {
  if (cache) return cache;
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(raw)
      ? raw.filter((x): x is Item => typeof x?.id === "string" && typeof x?.title === "string").slice(0, COMPARE_MAX)
      : [];
  } catch {
    cache = []; // storage blocked or corrupt: start empty, the page still works
  }
  return cache;
}

function write(next: Item[]) {
  cache = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: keep the selection in memory for this page view */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const useSelection = () => useSyncExternalStore(subscribe, read, () => EMPTY);
/** False during server render and hydration, true once JavaScript runs. */
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

/** "Compare" checkbox on one result card. Stays focusable when four are chosen; the note explains why it won't tick. */
export function CompareToggle({ id, title }: { id: string; title: string }) {
  const t = useTranslations("compare");
  const selection = useSelection();
  const checked = selection.some((s) => s.id === id);
  const full = !checked && selection.length >= COMPARE_MAX;

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        name="ids"
        value={id}
        form={FORM_ID}
        checked={checked}
        // Full name for screen readers ("Porównaj: <title>"); it starts with the visible word, as WCAG 2.5.3 asks.
        aria-label={t("toggleNamed", { title })}
        aria-disabled={full || undefined}
        aria-describedby={full ? FULL_NOTE_ID : undefined}
        onChange={() => {
          if (checked) write(selection.filter((s) => s.id !== id));
          else if (!full) write([...selection, { id, title }]);
        }}
        className="accent-granat"
      />
      <span>{t("toggle")}</span>
    </label>
  );
}

/** Sticky bar under the results: what is chosen, remove one, clear, and go to the comparison. */
export function CompareBar() {
  const t = useTranslations("compare");
  const router = useRouter();
  const hydrated = useHydrated();
  const selection = useSelection();
  const ready = selection.length >= COMPARE_MIN;
  const full = selection.length >= COMPARE_MAX;

  return (
    <form
      id={FORM_ID}
      action="/porownaj"
      method="get"
      aria-labelledby="compare-h"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) router.push(`/porownaj?ids=${selection.map((s) => s.id).join(",")}`);
      }}
      // Sticks to the bottom of the screen only while something is selected; otherwise it is a plain hint after the list.
      className={`glass-strong z-30 mt-6 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] p-3 sm:p-4 ${hydrated && selection.length > 0 ? "sticky bottom-3 sm:bottom-4" : ""}`}
    >
      <h2 id="compare-h" className="sr-only">{t("heading")}</h2>
      {/* Count and limit are announced politely when they change. */}
      <p role="status" aria-live="polite" className="text-sm">
        {!hydrated ? t("hint") : selection.length === 0 ? t("hint") : t("count", { count: selection.length, max: COMPARE_MAX })}
        {hydrated && full && <span id={FULL_NOTE_ID} className="block text-kamien">{t("full", { max: COMPARE_MAX })}</span>}
      </p>

      {hydrated && selection.length > 0 && (
        <ul className="flex w-full flex-wrap gap-2 max-sm:max-h-24 max-sm:overflow-y-auto sm:w-auto" aria-label={t("chosenLabel")}>
          {selection.map((s) => (
            <li key={s.id} className="flex max-w-full items-center gap-1 sm:max-w-64 rounded-full bg-white/70 py-1 pl-3 pr-1 text-sm ring-1 ring-white/80">
              <span className="truncate" title={s.title}>{s.title}</span>
              <button
                type="button"
                onClick={() => write(selection.filter((x) => x.id !== s.id))}
                aria-label={t("remove", { title: s.title })}
                className="inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded-full hover:bg-atrament/10"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto">
        {hydrated && selection.length > 0 && (
          <button type="button" onClick={() => write([])} className="min-h-11 cursor-pointer whitespace-nowrap rounded-full px-3 text-sm">
            {t("clear")}
          </button>
        )}
        <button
          type="submit"
          // Without JS the button always submits the ticked boxes. With JS it waits for at least two cards.
          aria-disabled={hydrated && !ready ? true : undefined}
          aria-describedby={hydrated && !ready ? "compare-need" : undefined}
          className="btn-primary min-h-11 cursor-pointer whitespace-nowrap rounded-full px-5 font-bold aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
        >
          {t("go")}
        </button>
        {hydrated && !ready && <span id="compare-need" className="sr-only">{t("needMore", { min: COMPARE_MIN })}</span>}
      </div>
    </form>
  );
}
