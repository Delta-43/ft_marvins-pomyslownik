"use client";

/** "Add to comparison" on a card page (F4). A toggle button: pressed while the card is in the selection.
 *  When four cards are already chosen, it stays focusable and a written note says why nothing happens.
 *  Texts come in as props from the server page, so this component needs no dictionary of its own. */
import Link from "next/link";
import { useId } from "react";
import {
  addToSelection,
  COMPARE_MAX,
  compareHref,
  removeFromSelection,
  useCompareSelection,
  useHydrated,
} from "@/lib/compare-store";

export type CompareButtonLabels = {
  add: string;
  added: string;
  full: string;
  open: string; // "Compare ({count})", with {count} filled in here
};

export function CompareButton({ id, title, labels }: { id: string; title: string; labels: CompareButtonLabels }) {
  const hydrated = useHydrated();
  const selection = useCompareSelection();
  const noteId = useId();
  // Without JavaScript the selection cannot be kept, so the button is not shown at all.
  if (!hydrated) return null;

  const chosen = selection.some((s) => s.id === id);
  const full = !chosen && selection.length >= COMPARE_MAX;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-pressed={chosen}
        aria-disabled={full || undefined}
        aria-describedby={full ? noteId : undefined}
        onClick={() => (chosen ? removeFromSelection(id) : addToSelection({ id, title }))}
        className={`cursor-pointer rounded-full px-5 py-2 font-bold aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ${
          chosen ? "btn-secondary" : "btn-primary"
        }`}
      >
        <span aria-hidden="true">{chosen ? "✓ " : "+ "}</span>
        {chosen ? labels.added : labels.add}
      </button>
      {selection.length > 0 && (
        <Link href={compareHref(selection)} className="text-sm font-bold">
          {labels.open.replace("{count}", String(selection.length))}
        </Link>
      )}
      {full && <p id={noteId} className="w-full text-sm text-kamien">{labels.full}</p>}
    </div>
  );
}
