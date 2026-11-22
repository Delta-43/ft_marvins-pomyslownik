"use client";

/** On /porownaj: make the stored selection match the cards on screen, so the header tray, the card pages and the
 *  results ticks agree with the table (also after following a shared link or removing a card). Renders nothing. */
import { useEffect } from "react";
import { readSelection, writeSelection, type CompareItem } from "@/lib/compare-store";

export function CompareSync({ items }: { items: CompareItem[] }) {
  const key = items.map((i) => i.id).join(",");
  useEffect(() => {
    if (readSelection().map((i) => i.id).join(",") !== key) writeSelection(items);
    // `key` captures the ids; titles only change with them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
